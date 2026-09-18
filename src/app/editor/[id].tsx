import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, BackHandler, Keyboard,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { useNotesStore } from '../../store/notesStore';
import { useTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';
import { wordCount, markdownToHtml, stripMarkdown } from '../../utils/markdown';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ThemedModal } from '../../components/ui/ThemedModal';
import { SmoothLanding } from '../../components/ui/SmoothLanding';
import { TableBuilderModal } from '../../components/ui/TableBuilderModal';
import { SparkLoadingModal } from '../../components/ui/SparkLoadingModal';
import { WebShareModal } from '../../components/ui/WebShareModal';
import { useAiStore } from '../../store/aiStore';
import { useRuntimeUxFlagsStore } from '../../store/runtimeUxFlagsStore';
import { useTypography } from '../../store/typographyStore';
import { AiService } from '../../services/aiService';
import * as Speech from 'expo-speech';
import { SparkGenerationPhase } from '../../types/spark';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { log } from '../../utils/Logger';
import { imageUriToDataUri, normalizeEditorHtmlImages } from '../../utils/editorMedia';
import { buildEditorCss } from '../../utils/editorCssTemplate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRichEditorViewport } from '../../hooks/useRichEditorViewport';
import { useFooterMeasurement } from '../../hooks/useFooterMeasurement';
import { useToastStore } from '../../store/toastStore';
export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const theme = useTheme();
  const settings = useSettingsStore(); // to get fonts & language
  const { colors, font, radius, shadow } = theme;
  const type = useTypography();
  const loc = strings[settings.language] || strings['En'];
  const insets = useSafeAreaInsets();

  const notes = useNotesStore((s) => s.notes);
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const note = notes.find((n) => String(n.id) === id);

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [bodyText, setBodyText] = useState(''); // Text representation for word count
  const [editorOffset, setEditorOffset] = useState(0);

  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showWebShareModal, setShowWebShareModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<SparkGenerationPhase>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [appAlert, setAppAlert] = useState<{ visible: boolean; title: string; subtitle: string }>({ visible: false, title: '', subtitle: '' });
  const ai = useAiStore();
  const sparkLoadingModalEnabled = useRuntimeUxFlagsStore((s) => s.flags.spark_loading_modal_v1);
  const sparkLoadingAnimationEnabled = useRuntimeUxFlagsStore((s) => s.flags.spark_loading_animation_v1);

  const richText = useRef<RichEditor>(null);
  const { footerHeight, handleFooterLayout } = useFooterMeasurement();
  const {
    editorSurfaceMinHeight,
    handleCursorPosition,
    handleEditorHeightChange,
    handleScroll,
    handleViewportLayout,
    scrollRef,
    showBackToTop,
  } = useRichEditorViewport(260, Math.max(footerHeight, 140));
  const isMounted = useRef(false);
  const isApplyingInitialContent = useRef(false);
  const [editorReady, setEditorReady] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{top: number, left: number, width: number, height: number} | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggleSpeech = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const textToSpeak = stripMarkdown(bodyText).trim() || loc.editor.titlePlaceholder;
      
      let langToUse: string | undefined = undefined;
      if (settings.ttsLanguage === 'auto') {
        const hasHindi = /[\u0900-\u097F]/.test(textToSpeak);
        langToUse = hasHindi ? 'hi-IN' : 'en-US';
      } else if (settings.ttsLanguage !== 'system') {
        langToUse = settings.ttsLanguage;
      }

      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        language: langToUse,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };
  const finishGeneration = useCallback(
    (nextPhase: SparkGenerationPhase) => {
      setGenerationPhase(nextPhase);
      const holdMs = sparkLoadingModalEnabled ? 220 : 0;
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationPhase('idle');
      }, holdMs);
    },
    [sparkLoadingModalEnabled]
  );

  const aiPhaseLabel = useMemo(() => {
    switch (generationPhase) {
      case 'preparing':
        return loc.editor.aiLoadingPreparing;
      case 'generating':
        return loc.editor.aiLoadingGenerating;
      case 'applying':
        return loc.editor.aiLoadingApplying;
      case 'done':
        return loc.editor.done;
      case 'error':
        return loc.editor.aiLoadingError;
      default:
        return loc.editor.aiLoadingGenerating;
    }
  }, [generationPhase, loc.editor]);

  useEffect(() => {
    isMounted.current = true;
    log.info(`Opening note: ${id}`);
    setEditorReady(false);

    if (note) {
      setTitle(note.title);
      setTag(note.tag || '');
      const stripped = note.body.replace(/<[^>]*>?/gm, ' ');
      setBodyText(stripped || '');
    }

    // Inject List & Quote Breakout Script — uses 'beforeinput' instead of
    // 'keydown' because Android virtual keyboards don't reliably fire keydown
    // with e.key === 'Enter'. The 'beforeinput' event fires consistently on
    // both platforms with inputType === 'insertParagraph' for Enter.
    const script = `
      (function() {
        if (window.__breakoutListenerAdded) return;
        window.__breakoutListenerAdded = true;
        document.addEventListener('beforeinput', function(e) {
          if (e.inputType !== 'insertParagraph') return;
          var selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
          var range = selection.getRangeAt(0);
          var node = range.startContainer;
          while (node && node.nodeName !== 'LI' && node.nodeName !== 'BLOCKQUOTE' && node.nodeName !== 'BODY') {
            node = node.parentNode;
          }
          if (node && node.nodeName === 'BLOCKQUOTE' && node.textContent.trim() === '') {
            e.preventDefault();
            document.execCommand('formatBlock', false, 'div');
          } else if (node && node.nodeName === 'LI' && node.textContent.trim() === '') {
            e.preventDefault();
            document.execCommand('outdent', false, null);
          }
        });

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        window.addEventListener('scroll', function() { window.scrollTo(0,0); });

        document.addEventListener('selectionchange', function() {
          var sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          var node = sel.anchorNode;
          
          var hasSelection = !sel.isCollapsed && sel.toString().trim().length > 0;
          var rect = null;
          if (hasSelection) {
            var range = sel.getRangeAt(0);
            rect = range.getBoundingClientRect();
          }

          if (!node) return;
          if (node.nodeType === 3) node = node.parentNode;
          var y = 0;
          var el = node;
          while(el && !isNaN(el.offsetTop)) {
              y += el.offsetTop;
              el = el.offsetParent;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
             type: 'CURSOR_Y', 
             data: y,
             selection: hasSelection ? {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                text: sel.toString().trim()
             } : null
          }));
        });
      })();
      true;
    `;

    const timer = setTimeout(() => {
      if (isMounted.current) {
        // @ts-ignore - Pell library uses lowercase 's'
        richText.current?.injectJavascript(script);
      }
    }, 800);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [id, note?.id]);

  useEffect(() => {
    if (!editorReady || !note) return;

    let cancelled = false;

    const applyEditorContent = async () => {
      const normalizedHtml = await normalizeEditorHtmlImages(note.body || '');
      if (cancelled) return;

      isApplyingInitialContent.current = true;
      richText.current?.setContentHTML(normalizedHtml);
      setBodyText(stripMarkdown(normalizedHtml));

      if (normalizedHtml !== note.body) {
        updateNote(note.id, { body: normalizedHtml });
      }

      setTimeout(() => {
        if (!cancelled) {
          isApplyingInitialContent.current = false;
        }
      }, 250);
    };

    applyEditorContent().catch((error) => {
      log.warn('Failed to normalize editor images on load.', error as any);
      isApplyingInitialContent.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [editorReady, note?.id]);

  const showSaved = useCallback(() => {
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    useToastStore.getState().showToast(loc.editor?.savedSubtitle || 'Note saved', 'success');
    setTimeout(() => setSaved(false), 1500);
  }, [loc]);



  useEffect(() => {
    const onBackPress = () => {
      if (isDirty && !settings.autoSave) {
        setShowExitModal(true);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isDirty, settings.autoSave]);

  const handleSave = useCallback(async () => {
    const html = await richText.current?.getContentHtml();
    if (note) {
      updateNote(note.id, { title: title.trim(), body: html?.trim() || '', tag: tag.trim() });
      setIsDirty(false);
      showSaved();
    }
  }, [note, title, tag, updateNote, showSaved]);

  const handleDone = useCallback(async () => {
    Keyboard.dismiss();
    await handleSave();
    router.back();
  }, [handleSave, router]);

  const handleBack = useCallback(() => {
    if (isDirty && !settings.autoSave) {
      setShowExitModal(true);
    } else {
      router.back();
    }
  }, [isDirty, settings.autoSave, router]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const insertHindiPunctuation = (char: string) => {
    richText.current?.insertText(char);
  };

  const handleInsertLink = () => {
    if (linkUrl.trim()) {
      richText.current?.insertLink('Link', linkUrl.trim());
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  const handleInsertImage = () => {
    if (imageUrl.trim()) {
      richText.current?.insertImage(imageUrl.trim());
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const handleReplace = useCallback(() => {
    if (!findText.trim()) return;
    // Walk text nodes and replace first match
    const findStr = findText.trim();
    const repStr = replaceText;
    const script = `
      (function() {
        var found = false;
        function walk(node) {
          if (node.nodeType === 3) {
            var index = node.data.indexOf(${JSON.stringify(findStr)});
            if (index !== -1 && !found) {
              node.data = node.data.substring(0, index) + ${JSON.stringify(repStr)} + node.data.substring(index + ${JSON.stringify(findStr)}.length);
              found = true;
              return;
            }
          } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
            for (var i = 0; i < node.childNodes.length; i++) {
              walk(node.childNodes[i]);
              if (found) return;
            }
          }
        }
        walk(document.body);
        if (found) {
          // Trigger change event to notify RN
          var event = new Event('input', { bubbles: true });
          document.body.dispatchEvent(event);
        }
        return found;
      })();
    `;
    // @ts-ignore
    richText.current?.injectJavascript(script);
    setIsDirty(true);
  }, [findText, replaceText]);

  const handleReplaceAll = useCallback(() => {
    if (!findText.trim()) return;
    const findStr = findText.trim();
    const repStr = replaceText;
    const script = `
      (function() {
        function escapeRegExp(string) {
          return string.replace(/[.*+?^$\${}()|[\\]\\\\]/g, '\\\\$&');
        }
        var count = 0;
        function walk(node) {
          if (node.nodeType === 3) {
            var regex = new RegExp(escapeRegExp(${JSON.stringify(findStr)}), 'g');
            if (regex.test(node.data)) {
              node.data = node.data.replace(regex, ${JSON.stringify(repStr)});
              count++;
            }
          } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
            for (var i = 0; i < node.childNodes.length; i++) {
              walk(node.childNodes[i]);
            }
          }
        }
        walk(document.body);
        if (count > 0) {
          var event = new Event('input', { bubbles: true });
          document.body.dispatchEvent(event);
        }
        return count;
      })();
    `;
    // @ts-ignore
    richText.current?.injectJavascript(script);
    setIsDirty(true);
  }, [findText, replaceText]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.45,
        base64: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : await imageUriToDataUri(asset.uri);
        richText.current?.insertImage(dataUri);
        setShowImageModal(false);
        log.info("Image inserted as Base64 data URI");
      }
    } catch (e) {
      console.error("Failed to pick image", e);
      setAppAlert({ visible: true, title: "Error", subtitle: "Could not load image." });
    }
  };

  const handlePrint = useCallback(async () => {
    try {
      if (!note) return;
      setShowExportModal(false);
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <title>${note.title || 'Note'}</title>
            <style>
              body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.8; font-size: 16px; }
              h1 { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size: 32px; margin-bottom: 24px; color: #000; font-weight: 800; }
              h2 { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size: 24px; margin-top: 24px; margin-bottom: 12px; font-weight: 700; color: #222; }
              blockquote { border-left: 4px solid #C14E28; padding-left: 16px; font-style: italic; color: #555; background: #f9f9f9; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
              ul, ol { margin-top: 10px; margin-bottom: 10px; padding-left: 24px; }
              li { margin-bottom: 6px; }
            </style>
          </head>
          <body>
            <h1>${note.title}</h1>
            <div>${note.body}</div>
          </body>
        </html>
      `;
      await Print.printAsync({ html: htmlContent });
    } catch (e) {
      console.warn(e);
    }
  }, [note]);

  const handleExportTextFile = useCallback(async (ext: 'txt' | 'md') => {
    try {
      if (!note) return;
      setShowExportModal(false);
      const safeTitle = (note.title || 'Untitled_Note').replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/ /g, '_');
      const filename = `${safeTitle}.${ext}`;
      const newUri = `${FileSystem.cacheDirectory}${filename}`;
      // Basic export: TXT gets unformatted plain text, MD gets the rich HTML (unless we add a Turndown parser)
      const content = ext === 'txt' ? bodyText : note.body;
      await FileSystem.writeAsStringAsync(newUri, content);
      await Sharing.shareAsync(newUri, { dialogTitle: safeTitle });
    } catch (e) {
      console.warn(e);
    }
  }, [note, bodyText]);

  const handleAiTitle = async () => {
    if (isGenerating) return;
    if (!bodyText.trim()) return;
    setShowAiModal(false);
    let didSucceed = false;
    try {
      setGenerationPhase('preparing');
      setIsGenerating(true);
      setGenerationPhase('generating');
      const generatedTitle = await AiService.getSmartTitle(bodyText.trim());
      setGenerationPhase('applying');
      setTitle(generatedTitle);
      didSucceed = true;
    } catch (e: any) {
      setGenerationPhase('error');
      setAppAlert({ visible: true, title: "Spark AI Error", subtitle: e.message || "Failed to generate title." });
    } finally {
      finishGeneration(didSucceed ? 'done' : 'error');
    }
  };

  const handleAiSummary = async () => {
    if (isGenerating) return;
    if (!bodyText.trim()) return;
    setShowAiModal(false);
    let didSucceed = false;
    try {
      setGenerationPhase('preparing');
      setIsGenerating(true);
      setGenerationPhase('generating');
      const summary = await AiService.getSummarization(bodyText.trim());
      setGenerationPhase('applying');
      setSummaryText(summary);
      setShowSummaryModal(true);
      didSucceed = true;
    } catch (e: any) {
      setGenerationPhase('error');
      setAppAlert({ visible: true, title: "Spark AI Error", subtitle: e.message || "Failed to summarize note." });
    } finally {
      finishGeneration(didSucceed ? 'done' : 'error');
    }
  };

  const handleCustomAiPrompt = async () => {
    if (isGenerating) return;
    if (!aiPrompt.trim()) return;
    setShowPromptModal(false);
    let didSucceed = false;
    try {
      setGenerationPhase('preparing');
      setIsGenerating(true);
      setGenerationPhase('generating');
      const output = await AiService.getDynamicGeneration(aiPrompt.trim());
      setGenerationPhase('applying');
      richText.current?.insertHTML(`<br><br>${markdownToHtml(output)}<br>`);
      setAiPrompt('');
      didSucceed = true;
    } catch (e: any) {
      setGenerationPhase('error');
      setAppAlert({ visible: true, title: "Spark AI Error", subtitle: e.message || "Failed to generate content." });
    } finally {
      finishGeneration(didSucceed ? 'done' : 'error');
    }
  };

  const handleAiFormat = async () => {
    if (isGenerating) return;
    if (!bodyText.trim()) return;
    setShowAiModal(false);
    let didSucceed = false;
    try {
      setGenerationPhase('preparing');
      setIsGenerating(true);
      setGenerationPhase('generating');
      const output = await AiService.getFormatNote(bodyText.trim());
      setGenerationPhase('applying');
      richText.current?.setContentHTML(markdownToHtml(output));
      didSucceed = true;
    } catch (e: any) {
      setGenerationPhase('error');
      setAppAlert({ visible: true, title: "Spark AI Error", subtitle: e.message || "Failed to format content." });
    } finally {
      finishGeneration(didSucceed ? 'done' : 'error');
    }
  };

  const s = useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.strokeDim + '44' },
    circleBtn: {
      width: 38, height: 38, borderRadius: 99, borderWidth: 1.5, borderColor: colors.stroke,
      backgroundColor: colors.bgRaised, justifyContent: 'center', alignItems: 'center',
      ...shadow.gentle, shadowColor: colors.shadow
    },
    circleBtnActive: { backgroundColor: colors.accent, borderColor: colors.accentDark },
    headerMid: { flex: 1, alignItems: 'center' },
    headerDate: { fontFamily: font.mono, fontSize: 11 * theme.fontSize, color: colors.inkDim },
    savedBadge: { fontFamily: font.mono, fontSize: 9 * theme.fontSize, color: colors.accent, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    doneBtn: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, ...shadow.gentle, shadowColor: colors.accentDark },
    doneBtnActive: { transform: [{ translateY: 2 }], shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    doneBtnText: { fontFamily: font.sansSemi, fontSize: 13, color: colors.white },
    exportBtnText: { color: colors.white }, // High contrast for share/export

    editorFrame: { flex: 1 },
    titleBox: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.strokeDim,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bg,
    },
    titleInput: {
      fontFamily: font.display,
      fontSize: 22 * theme.fontSize,
      fontWeight: '700',
      color: colors.ink,
      padding: 0,
      lineHeight: 30 * theme.fontSize,
      minHeight: 32,
    },
    editorViewport: { flex: 1 },
    editorScroll: { flex: 1 },
    editorScrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
    editorSurface: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.strokeDim,
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      overflow: 'hidden',
    },

    tagBox: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      minHeight: 36,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.strokeDim,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.bg,
    },
    tagHash: { fontFamily: font.mono, fontSize: 14, color: colors.accent, marginRight: 4 },
    tagInput: { ...type.bodyLarge, fontFamily: font.sans, color: colors.inkMid, flex: 1, padding: 0 },
    bottomControls: {
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.strokeDim,
      paddingBottom: Math.max(insets.bottom, 8),
    },
    bottomActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.strokeDim },
    bottomBarText: { ...type.labelMedium, fontFamily: font.mono, color: colors.inkDim },

    notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    notFoundText: { fontFamily: font.sansSemi, fontSize: 14, color: colors.inkMid },

    // Toolbar custom
    toolbarRoot: {
      backgroundColor: colors.bgRaised,
      borderTopWidth: 1.5,
      borderTopColor: colors.stroke,
      paddingHorizontal: 6,
      paddingTop: 0,
      paddingBottom: 4,
      height: 44,
    },
    toolbarItem: {
      height: 36,
      minHeight: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 2,
      marginVertical: 0,
    },
  }), [colors, font, insets.bottom, radius, shadow, theme.fontSize, type.bodyLarge, type.labelMedium]);

  if (!note && !isDeleting) {
    return (
      <View style={s.root}>
        <View style={s.notFound}>
          <Pressable onPress={() => router.back()} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Back">
            <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12l14 0" />
              <Path d="M5 12l6 6" />
              <Path d="M5 12l6 -6" />
            </Svg>
          </Pressable>
          <Text style={s.notFoundText}>{loc.editor.notFound}</Text>
        </View>
      </View>
    );
  }

  const dateStr = new Date(note?.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
  const wc = wordCount(bodyText);

  return (
    <View style={s.root}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Back">
          <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12l14 0" />
            <Path d="M5 12l6 6" />
            <Path d="M5 12l6 -6" />
          </Svg>
        </Pressable>

        <View style={s.headerMid}>
          <Text style={s.headerDate}>{dateStr}</Text>
          {saved && <Text style={s.savedBadge}>{loc.editor.saved}</Text>}
          {isGenerating && !sparkLoadingModalEnabled && (
            <Text style={[s.savedBadge, { color: colors.accent }]}>
              {loc.editor.thinking || loc.editor.aiLoadingGenerating}
            </Text>
          )}
        </View>

        <View style={s.headerRight}>
          <Pressable onPress={() => { if (note) updateNote(note.id, { pinned: !note.pinned }) }} style={[s.circleBtn, note?.pinned && { borderColor: colors.accent, backgroundColor: colors.accentBg }]} hitSlop={theme.hitSlop} accessibilityLabel={note?.pinned ? 'Unpin note' : 'Pin note'}>
            <Svg viewBox="0 0 24 24" width={24} height={24} fill={note?.pinned ? colors.accent : "none"} stroke={note?.pinned ? colors.accent : colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
              <Path d="M9 15l-4.5 4.5" />
              <Path d="M14.5 4l5.5 5.5" />
            </Svg>
          </Pressable>
          <Pressable onPress={() => setShowExportModal(true)} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Export note">
            <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <Path d="M11.5 21h-4.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v5m-5 6h7m-3 -3l3 3l-3 3" />
            </Svg>
          </Pressable>
          <Pressable onPress={handleDelete} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Delete note">
            <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 7l16 0" />
              <Path d="M10 11l0 6" />
              <Path d="M14 11l0 6" />
              <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
              <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
            </Svg>
          </Pressable>
          <Pressable onPress={handleDone} style={({ pressed }) => [s.doneBtn, pressed && s.doneBtnActive]} hitSlop={theme.hitSlop} testID="editor-done-button">
            <Text style={s.doneBtnText}>{loc.editor.done}</Text>
          </Pressable>
        </View>
      </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.editorFrame}>
            <View style={s.editorViewport} onLayout={handleViewportLayout}>
              <ScrollView
                ref={scrollRef}
                style={s.editorScroll}
                contentContainerStyle={s.editorScrollContent}
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                <View style={s.titleBox}>
                  <TextInput
                    style={s.titleInput}
                    placeholder={loc.editor.titlePlaceholder}
                    placeholderTextColor={colors.inkDim}
                    value={title}
                    onChangeText={(t) => { setTitle(t); setIsDirty(true); }}
                    multiline
                    blurOnSubmit
                    returnKeyType="next"
                    testID="editor-title-input"
                  />
                </View>

                <View style={s.tagBox}>
                  <Text style={s.tagHash}>#</Text>
                  <TextInput
                    style={s.tagInput}
                    placeholder={loc.editor.tagPlaceholder}
                    placeholderTextColor={colors.inkDim + '88'}
                    value={tag}
                    onChangeText={(t) => { setTag(t.replace(/\s/g, '')); setIsDirty(true); }}
                    autoCapitalize="none"
                  />
                </View>

                <View 
                  style={[s.editorSurface, { minHeight: editorSurfaceMinHeight }]}
                  onLayout={(e) => setEditorOffset(e.nativeEvent.layout.y)}
                >
                  <RichEditor
                    key={id}
                    ref={richText}
                    initialContentHTML=""
                    placeholder={loc.editor.bodyPlaceholder}
                    editorInitializedCallback={() => setEditorReady(true)}
                    editorStyle={{
                      backgroundColor: colors.bg,
                      color: colors.inkMid,
                      placeholderColor: colors.inkDim,
                      cssText: buildEditorCss({
                        fontSans: font.sans, fontSansBold: font.sansBold, fontSansSemi: font.sansSemi, fontMono: font.mono,
                        fontSize: theme.fontSize,
                        colorBg: colors.bg, colorBgRaised: colors.bgRaised, colorInk: colors.ink,
                        colorInkMid: colors.inkMid, colorInkDim: colors.inkDim, colorAccent: colors.accent, colorStroke: colors.stroke,
                      }),
                    }}
                    onChange={(html) => {
                      if (!isMounted.current || isApplyingInitialContent.current) return;
                      const stripped = html.replace(/<[^>]*>?/gm, ' ');
                      setBodyText(stripped);
                      setIsDirty(true);
                      if (settings.autoSave) {
                        updateNote(Number(id), { title, body: html, tag });
                      }
                    }}
                    scrollEnabled={false}
                    useContainer={false}
                    onCursorPosition={() => {}}
                    onMessage={(msg) => {
                      if (msg.type === 'CURSOR_Y') {
                        handleCursorPosition(Number(msg.data) + editorOffset);
                        const customMsg = msg as any;
                        if (customMsg.selection) {
                          setSelectionRect(customMsg.selection);
                        } else {
                          setSelectionRect(null);
                        }
                      }
                    }}
                    onHeightChange={handleEditorHeightChange}
                  />
                  {selectionRect && (
                    <Animated.View 
                      entering={FadeInDown.duration(200)} 
                      exiting={FadeOutDown.duration(200)}
                      style={{
                        position: 'absolute',
                        top: selectionRect.top - 54 > 0 ? selectionRect.top - 54 : selectionRect.top + selectionRect.height + 10,
                        left: Math.max(16, Math.min(selectionRect.left + (selectionRect.width / 2) - 60, 300)),
                        flexDirection: 'row',
                        backgroundColor: colors.bgRaised,
                        borderRadius: 8,
                        padding: 4,
                        gap: 8,
                        elevation: 5,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.strokeDim,
                        zIndex: 50,
                      }}
                    >
                      <Pressable style={{ padding: 8, minWidth: 32, alignItems: 'center' }} onPress={() => richText.current?.sendAction(actions.setBold, 'result')}>
                         <Text style={{ fontFamily: font.sansBold, fontSize: 16, color: colors.ink }}>B</Text>
                      </Pressable>
                      <Pressable style={{ padding: 8, minWidth: 32, alignItems: 'center' }} onPress={() => richText.current?.sendAction(actions.setItalic, 'result')}>
                         <Text style={{ fontFamily: font.sans, fontStyle: 'italic', fontSize: 16, color: colors.ink }}>I</Text>
                      </Pressable>
                      <Pressable style={{ padding: 8, minWidth: 32, alignItems: 'center' }} onPress={() => richText.current?.sendAction(actions.setUnderline, 'result')}>
                         <Text style={{ fontFamily: font.sans, textDecorationLine: 'underline', fontSize: 16, color: colors.ink }}>U</Text>
                      </Pressable>
                      <Pressable style={{ padding: 8, minWidth: 32, alignItems: 'center' }} onPress={() => richText.current?.sendAction(actions.setStrikethrough, 'result')}>
                         <Text style={{ fontFamily: font.sans, textDecorationLine: 'line-through', fontSize: 16, color: colors.ink }}>S</Text>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              </ScrollView>
              
              {/* Back to top button inside notes */}
              {showBackToTop && (
                <View style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, elevation: 10 }} pointerEvents="box-none">
                  <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                    <Pressable
                      onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                      style={[s.circleBtn, { backgroundColor: colors.bgRaised, width: 40, height: 40 }]}
                      accessibilityLabel="Back to top"
                    >
                      <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 19V5M5 12l7-7 7 7" />
                      </Svg>
                    </Pressable>
                  </Animated.View>
                </View>
              )}
            </View>
          </View>

          <View style={s.bottomControls} onLayout={handleFooterLayout}>
            <View style={s.bottomActions}>
            <Pressable 
              onPress={() => {
                if (!ai.geminiApiKey) {
                    setAppAlert({ visible: true, title: "Spark AI", subtitle: "Please add your Gemini API Key in Settings to use Spark AI features." });
                    return;
                }
                if (!isGenerating) setShowAiModal(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Boolean(ai.geminiApiKey) ? colors.accentBg : 'transparent', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Boolean(ai.geminiApiKey) ? colors.accent : colors.strokeDim }}
            >
              <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={Boolean(ai.geminiApiKey) ? colors.accent : colors.inkDim} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
              </Svg>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 13, color: Boolean(ai.geminiApiKey) ? colors.accent : colors.inkDim, includeFontPadding: false }}>Spark AI</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <Pressable onPress={() => richText.current?.sendAction(actions.undo, 'result')} hitSlop={theme.hitSlop} accessibilityLabel="Undo">
                  <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.inkMid} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M9 14l-4 -4l4 -4" />
                      <Path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                  </Svg>
              </Pressable>
              <Pressable onPress={() => richText.current?.sendAction(actions.redo, 'result')} hitSlop={theme.hitSlop} accessibilityLabel="Redo">
                  <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.inkMid} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M15 14l4 -4l-4 -4" />
                      <Path d="M19 10h-11a4 4 0 1 0 0 8h1" />
                  </Svg>
              </Pressable>
              <Pressable onPress={() => setShowFindReplaceModal(true)} hitSlop={theme.hitSlop} accessibilityLabel="Find and replace">
                  <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.inkMid} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                      <Circle cx="10" cy="10" r="7" />
                      <Path d="M21 21l-6-6" />
                  </Svg>
              </Pressable>
            </View>
          </View>

            <RichToolbar
              editor={richText}
              style={[s.toolbarRoot, { borderTopWidth: 0, paddingTop: 4 }]}
              iconTint={colors.ink}
              selectedIconTint={colors.accent}
              disabledIconTint={colors.inkDim}
              iconSize={18}
              iconGap={24}
              itemStyle={s.toolbarItem}
              flatContainerStyle={{ paddingBottom: 4 }}
              selectedButtonStyle={{ backgroundColor: 'transparent', borderBottomWidth: 2.5, borderBottomColor: colors.accent }}
              unselectedButtonStyle={{ backgroundColor: 'transparent' }}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.heading1,
                actions.heading2,
                actions.checkboxList,
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.blockquote,
                actions.code,
                actions.insertLink,
                actions.insertImage,
                'insertTable',
                actions.line,
                'insertPurnaViram',
                'insertDoublePurnaViram'
              ]}
              iconMap={{
                [actions.heading1]: ({ tintColor }: any) => <Text style={{ color: tintColor, fontWeight: 'bold' }}>H1</Text>,
                [actions.heading2]: ({ tintColor }: any) => <Text style={{ color: tintColor, fontWeight: 'bold' }}>H2</Text>,
                [actions.insertLink]: ({ tintColor }: any) => (
                  <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={tintColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </Svg>
                ),
                [actions.insertImage]: ({ tintColor }: any) => (
                  <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={tintColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <Circle cx="8.5" cy="8.5" r="1.5" />
                    <Path d="M21 15l-5-5L5 21" />
                  </Svg>
                ),
                'insertTable': ({ tintColor }: any) => (
                  <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={tintColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <Path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                  </Svg>
                ),
                [actions.checkboxList]: ({ tintColor }: any) => (
                  <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={tintColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x="4" y="4" width="16" height="16" rx="3" />
                    <Path d="M8 12l3 3l5 -6" />
                  </Svg>
                ),
                [actions.line]: ({ tintColor }: any) => (
                  <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={tintColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round">
                    <Path d="M5 12h14" />
                  </Svg>
                ),
                [actions.code]: ({ tintColor }: any) => (
                  <Text style={{ color: tintColor, fontFamily: font.mono, fontSize: 13, fontWeight: '700', includeFontPadding: false }}>
                    {'</>'}
                  </Text>
                ),
                'insertPurnaViram': ({ tintColor }: any) => <Text style={{ color: tintColor, fontWeight: 'bold' }}>{'\u0964'}</Text>,
                'insertDoublePurnaViram': ({ tintColor }: any) => <Text style={{ color: tintColor, fontWeight: 'bold' }}>{'\u0965'}</Text>,
              }}
              onInsertLink={() => setShowLinkModal(true)}
              onPressAddImage={() => setShowImageModal(true)}
              insertPurnaViram={() => insertHindiPunctuation('\u0964')}
              insertDoublePurnaViram={() => insertHindiPunctuation('\u0965')}
              insertTable={() => setShowTableModal(true)}
            />

            <View style={s.bottomBar}>
              <Text style={s.bottomBarText}>{bodyText.trim().length} {loc.editor.chars} | {wc} {loc.editor.words}</Text>
              {settings.ttsEnabled && (
                <Pressable onPress={toggleSpeech} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: isSpeaking ? colors.accentBg : 'transparent' }} hitSlop={theme.hitSlop}>
                  <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={isSpeaking ? colors.accent : colors.inkDim} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                    {isSpeaking ? (
                      <>
                        <Rect x="6" y="4" width="4" height="16" />
                        <Rect x="14" y="4" width="4" height="16" />
                      </>
                    ) : (
                      <>
                        <Path d="M15 8a5 5 0 0 1 0 8" />
                        <Path d="M17.7 5a9 9 0 0 1 0 14" />
                        <Path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
                      </>
                    )}
                  </Svg>
                  <Text style={{ fontFamily: font.sansSemi, fontSize: 12, color: isSpeaking ? colors.accent : colors.inkDim, includeFontPadding: false }}>
                    {isSpeaking ? 'Stop' : 'Listen'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

      <SparkLoadingModal
        visible={sparkLoadingModalEnabled && isGenerating}
        phase={generationPhase}
        title={loc.editor.aiLoadingTitle}
        phaseLabel={aiPhaseLabel}
        hintText={loc.editor.aiLoadingPleaseWait}
        enableAnimation={sparkLoadingAnimationEnabled}
      />

      <ThemedModal
        visible={showDeleteModal}
        title={loc.editor.deleteNote}
        subtitle={loc.editor.deleteNoteSub}
        onClose={() => setShowDeleteModal(false)}
        actions={[
          {
            label: loc.editor.delete,
            style: 'destructive',
            onPress: () => {
              if (note) {
                setIsDeleting(true);
                setShowDeleteModal(false);
                router.back();
                setTimeout(() => deleteNote(note.id), 300);
              }
            }
          },
          {
            label: loc.editor.cancel,
            style: 'cancel',
            onPress: () => setShowDeleteModal(false)
          }
        ]}
      />

      <ThemedModal
        visible={showExportModal}
        title={loc.exportOptions}
        onClose={() => setShowExportModal(false)}
        actions={[
          {
            label: (loc as any).print || "Print",
            style: 'default',
            icon: (
              <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M7 8V4h10v4" />
                <Path d="M7 16h10v4H7z" />
                <Path d="M6 12h.01" />
                <Path d="M6 16H5a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-1" />
              </Svg>
            ),
            onPress: handlePrint
          },
          {
            label: loc.exportMd || "Save as MD",
            style: 'default',
            icon: (
              <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <Path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                <Path d="M10 12l4 4m0 -4l-4 4" />
              </Svg>
            ),
            onPress: () => handleExportTextFile('md')
          },
          {
            label: "Web Share Studio (PC)",
            style: 'default',
            icon: (
              <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 16V5a2 2 0 0 0 -2 -2H6a2 2 0 0 0 -2 2v11" />
                <Path d="M2 20h20" />
                <Path d="M12 12v.01" />
                <Path d="M8.5 9.5a5 5 0 0 1 7 0" />
              </Svg>
            ),
            onPress: () => {
              setShowExportModal(false);
              setShowWebShareModal(true);
            }
          },
          {
            label: loc.editor.cancel,
            style: 'cancel',
            onPress: () => setShowExportModal(false)
          }
        ]}
      />

      <ThemedModal
        visible={showAiModal}
        title={loc.plusFeatures.aiDialogTitle}
        subtitle={loc.plusFeatures.aiDialogSub}
        onClose={() => setShowAiModal(false)}
        actions={[
          {
            label: loc.plusFeatures.aiFormat,
            style: 'default',
            onPress: handleAiFormat
          },
          {
            label: loc.plusFeatures.aiSmartTitle,
            style: 'default',
            onPress: handleAiTitle
          },
          {
            label: loc.plusFeatures.aiSummarize,
            style: 'default',
            onPress: handleAiSummary
          },
          {
            label: loc.plusFeatures.aiWriteForMe,
            style: 'default',
            onPress: () => {
              if (isGenerating) return;
              setShowAiModal(false);
              setTimeout(() => setShowPromptModal(true), 300);
            }
          },
          {
            label: loc.editor.cancel,
            style: 'cancel',
            onPress: () => setShowAiModal(false)
          }
        ]}
      />

      <ThemedModal
        visible={showPromptModal}
        title={loc.plusFeatures.aiWriteTitle}
        subtitle={loc.plusFeatures.aiWriteSub}
        onClose={() => setShowPromptModal(false)}
        customContent={
          <TextInput
            style={{
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: colors.bg,
              color: colors.ink,
              fontFamily: font.sans,
              fontSize: 14 * theme.fontSize,
              borderWidth: 1,
              borderColor: colors.strokeDim,
              minHeight: 80,
              textAlignVertical: 'top'
            }}
            placeholder={loc.plusFeatures.aiWritePlaceholder}
            placeholderTextColor={colors.inkDim}
            value={aiPrompt}
            onChangeText={setAiPrompt}
            multiline
            autoFocus
          />
        }
        actions={[
          {
            label: loc.plusFeatures.aiGenerateBtn,
            style: 'default',
            onPress: handleCustomAiPrompt
          },
          {
            label: loc.editor.cancel,
            style: 'cancel',
            onPress: () => setShowPromptModal(false)
          }
        ]}
      />

      <ThemedModal
        visible={showSummaryModal}
        title={loc.plusFeatures.aiSummaryTitle}
        onClose={() => setShowSummaryModal(false)}
        customContent={
          <ScrollView style={{ maxHeight: 300, backgroundColor: colors.bg, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.strokeDim }}>
            <Text style={{ fontFamily: font.sans, fontSize: 14 * theme.fontSize, color: colors.inkMid, lineHeight: 22 * theme.fontSize }}>
              {stripMarkdown(summaryText)}
            </Text>
          </ScrollView>
        }
        actions={[
          {
            label: loc.settingsScreen.ok,
            style: 'default',
            onPress: () => setShowSummaryModal(false)
          },
          {
            label: loc.plusFeatures.aiSummaryInsert,
            style: 'cancel',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              richText.current?.insertHTML(`<br><br><blockquote><b>${loc.plusFeatures.aiSummaryPrefix}</b><br>${markdownToHtml(summaryText)}</blockquote><br>`);
              setShowSummaryModal(false);
            }
          }
        ]}
      />

      <ThemedModal
        visible={showExitModal}
        title={loc.editor.unsavedChanges}
        subtitle={loc.editor.unsavedChangesSub}
        onClose={() => setShowExitModal(false)}
        actions={[
          {
            label: loc.editor.save,
            style: 'default',
            onPress: handleDone
          },
          {
            label: loc.editor.discard,
            style: 'destructive',
            onPress: () => router.back()
          },
          {
            label: loc.editor.cancel,
            style: 'cancel',
            onPress: () => setShowExitModal(false)
          }
        ]}
      />

      <ThemedModal
        visible={showLinkModal}
        title={loc.editor.insertLink}
        onClose={() => setShowLinkModal(false)}
        actions={[
          { label: loc.editor.save, style: 'default', onPress: handleInsertLink },
          { label: loc.editor.cancel, style: 'cancel', onPress: () => setShowLinkModal(false) }
        ]}
        customContent={
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: font.sansSemi, fontSize: 13, color: colors.inkMid }}>URL</Text>
            <TextInput
              style={{ backgroundColor: colors.bg, height: 48, paddingHorizontal: 14, borderRadius: radius.md, color: colors.ink, fontFamily: font.sans, fontSize: 14, borderWidth: 1.5, borderColor: colors.strokeDim }}
              placeholder="https://..."
              placeholderTextColor={colors.inkDim}
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        }
      />

      <ThemedModal
        visible={showImageModal}
        title={loc.editor.selectSource}
        onClose={() => setShowImageModal(false)}
        actions={[
          {
            label: loc.editor.pickGallery, style: 'default', onPress: handlePickImage, icon: (
              <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 8h.01" />
                <Path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
                <Path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
                <Path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
              </Svg>
            )
          },
          { label: loc.editor.enterUrl, style: 'cancel', onPress: () => { /* Handle toggle to URL input if needed, but keeping it simple with direct actions */ } },
        ]}
        customContent={
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: font.sansSemi, fontSize: 13, color: colors.inkMid }}>Image URL</Text>
            <TextInput
              style={{ backgroundColor: colors.bg, height: 48, paddingHorizontal: 14, borderRadius: radius.md, color: colors.ink, fontFamily: font.sans, fontSize: 14, borderWidth: 1.5, borderColor: colors.strokeDim }}
              placeholder={loc.editor.imageUrl}
              placeholderTextColor={colors.inkDim}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleInsertImage}
            />
          </View>
        }
      />

      <ThemedModal
        visible={showFindReplaceModal}
        title={loc.editor.findReplace}
        onClose={() => setShowFindReplaceModal(false)}
        actions={[
          {
            label: loc.editor.replaceAll,
            style: 'default',
            onPress: handleReplaceAll
          },
          {
            label: loc.editor.replace,
            style: 'default',
            onPress: handleReplace
          },
          {
            label: loc.editor.cancel,
            style: 'cancel',
            onPress: () => setShowFindReplaceModal(false)
          }
        ]}
        customContent={
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 13, color: colors.inkMid }}>{loc.editor.findPlaceholder}</Text>
              <TextInput
                style={{ backgroundColor: colors.bg, height: 48, paddingHorizontal: 14, borderRadius: radius.md, color: colors.ink, fontFamily: font.sans, fontSize: 14, borderWidth: 1.5, borderColor: colors.strokeDim }}
                placeholder={loc.editor.findPlaceholder}
                placeholderTextColor={colors.inkDim}
                value={findText}
                onChangeText={setFindText}
                autoFocus
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 13, color: colors.inkMid }}>{loc.editor.replacePlaceholder}</Text>
              <TextInput
                style={{ backgroundColor: colors.bg, height: 48, paddingHorizontal: 14, borderRadius: radius.md, color: colors.ink, fontFamily: font.sans, fontSize: 14, borderWidth: 1.5, borderColor: colors.strokeDim }}
                placeholder={loc.editor.replacePlaceholder}
                placeholderTextColor={colors.inkDim}
                value={replaceText}
                onChangeText={setReplaceText}
              />
            </View>
          </View>
        }
      />

      <ThemedModal
        visible={appAlert.visible}
        title={appAlert.title}
        subtitle={appAlert.subtitle}
        onClose={() => setAppAlert(prev => ({ ...prev, visible: false }))}
        actions={[
          {
            label: loc.settingsScreen.ok,
            style: 'default',
            onPress: () => setAppAlert(prev => ({ ...prev, visible: false }))
          }
        ]}
      />
      <TableBuilderModal 
        visible={showTableModal} 
        onClose={() => setShowTableModal(false)} 
        onInsert={(html) => {
          richText.current?.insertHTML(html);
          setShowTableModal(false);
          setIsDirty(true);
        }}
      />
      <WebShareModal
        visible={showWebShareModal}
        onClose={() => setShowWebShareModal(false)}
        onShowToast={(msg) => setAppAlert({ visible: true, title: "Web Share Studio", subtitle: msg })}
      />
    </View>
  );
}


