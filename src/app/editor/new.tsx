import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView,
  Platform, StatusBar, ScrollView, BackHandler, Keyboard
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { useNotesStore } from '../../store/notesStore';
import { useTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { wordCount, markdownToHtml, stripMarkdown } from '../../utils/markdown';
import { useAiStore } from '../../store/aiStore';
import { AiService } from '../../services/aiService';
import { ThemedModal } from '../../components/ui/ThemedModal';
import { SparkLoadingModal } from '../../components/ui/SparkLoadingModal';
import { TableBuilderModal } from '../../components/ui/TableBuilderModal';
import { useTypography } from '../../store/typographyStore';
import * as Speech from 'expo-speech';
import { SparkGenerationPhase } from '../../types/spark';
import { useRuntimeUxFlagsStore } from '../../store/runtimeUxFlagsStore';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { imageUriToDataUri } from '../../utils/editorMedia';
import { buildEditorCss } from '../../utils/editorCssTemplate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRichEditorViewport } from '../../hooks/useRichEditorViewport';
import { useFooterMeasurement } from '../../hooks/useFooterMeasurement';
import { useToastStore } from '../../store/toastStore';

export default function NewNoteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const settings = useSettingsStore(); // to get fonts & language
  const { colors, font, radius, shadow } = theme;
  const type = useTypography();
  const loc = strings[settings.language] || strings['En'];
  const insets = useSafeAreaInsets();

  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [bodyText, setBodyText] = useState(''); // Text representation for word count
  const [editorOffset, setEditorOffset] = useState(0);

  const [showAiModal, setShowAiModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<SparkGenerationPhase>('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [appAlert, setAppAlert] = useState<{ visible: boolean; title: string; subtitle: string }>({ visible: false, title: '', subtitle: '' });
  const noteId = useRef<number | null>(null);
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
  const editorListBreakoutScript = useMemo(() => `
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
  `, []);
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



  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore - Pell exposes injectJavascript on the ref.
      richText.current?.injectJavascript(editorListBreakoutScript);
    }, 800);

    return () => clearTimeout(timer);
  }, [editorListBreakoutScript]);

  const handleSave = useCallback(async () => {
    const html = await richText.current?.getContentHtml();
    if (title.trim() || (html && html.trim())) {
      if (noteId.current) {
        updateNote(noteId.current, { title: title.trim(), body: html || '', tag: tag.trim() });
      } else {
        const id = addNote({ title: title.trim(), body: html || '', tag: tag.trim(), pinned: isPinned });
        noteId.current = id;
      }
      setIsDirty(false);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    useToastStore.getState().showToast(loc.editor?.savedSubtitle || 'Note saved', 'success');
  }, [title, tag, bodyText, updateNote, addNote, loc]);

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
      }
    } catch (error: any) {
      setAppAlert({
        visible: true,
        title: 'Image Error',
        subtitle: error?.message || 'Could not load the selected image.',
      });
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
    circleBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.stroke, backgroundColor: colors.bgRaised, justifyContent: 'center', alignItems: 'center', ...shadow.gentle, shadowColor: colors.shadow },
    headerMid: { flex: 1, alignItems: 'center' },
    headerDate: { fontFamily: font.mono, fontSize: 11, color: colors.inkDim },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    doneBtn: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, ...shadow.gentle, shadowColor: colors.accentDark },
    doneBtnActive: { transform: [{ translateY: 2 }], shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    doneBtnText: { fontFamily: font.sansSemi, fontSize: 13, color: colors.white },

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

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
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
          {isGenerating && !sparkLoadingModalEnabled && (
            <Text style={{ fontFamily: font.mono, fontSize: 9, color: colors.accent, marginTop: 2 }}>
              {loc.editor.thinking || loc.editor.aiLoadingGenerating}
            </Text>
          )}
        </View>
        <View style={s.headerRight}>
          <Pressable 
            onPress={() => {
              const newPinned = !isPinned;
              setIsPinned(newPinned);
              setIsDirty(true);
              if (noteId.current) {
                useNotesStore.getState().updateNote(noteId.current, { pinned: newPinned });
              }
            }} 
            style={[s.circleBtn, isPinned && { borderColor: colors.accent, backgroundColor: colors.accentBg }]} 
            hitSlop={theme.hitSlop}
            accessibilityLabel={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Svg viewBox="0 0 24 24" width={24} height={24} fill={isPinned ? colors.accent : "none"} stroke={isPinned ? colors.accent : colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
              <Path d="M9 15l-4.5 4.5" />
              <Path d="M14.5 4l5.5 5.5" />
            </Svg>
          </Pressable>
          <Pressable onPress={handleDone} style={({ pressed }) => [s.doneBtn, pressed && s.doneBtnActive]} hitSlop={theme.hitSlop}>
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
                />
              </View>

              <View style={s.tagBox}>
                <Text style={s.tagHash}>#</Text>
                <TextInput
                  style={s.tagInput}
                  placeholder={loc.editor.tagPlaceholder}
                  placeholderTextColor={colors.strokeDim}
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
                  ref={richText}
                  initialContentHTML=""
                  placeholder={loc.editor.bodyPlaceholder}
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
                    const stripped = html.replace(/<[^>]*>?/gm, ' ');
                    setBodyText(stripped);
                    setIsDirty(true);
                    if (settings.autoSave && (title.trim() || stripped.trim())) {
                      if (noteId.current) {
                        useNotesStore.getState().updateNote(noteId.current, { title, body: html, tag });
                      } else {
                        const id = addNote({ title, body: html, tag, pinned: isPinned });
                        noteId.current = id;
                      }
                    }
                  }}
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
                  scrollEnabled={false}
                  useContainer={false}
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
                <Rect x="3" y="3" width="18" height="18" rx="2" />
                <Circle cx="8.5" cy="8.5" r="1.5" />
                <Path d="M21 15l-5-5L5 21" />
              </Svg>
            )
          },
          { label: loc.editor.enterUrl, style: 'cancel', onPress: () => { } },
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
        title={loc.editor.findAndReplace || 'Find & Replace'}
        onClose={() => setShowFindReplaceModal(false)}
        actions={[
          {
            label: loc.editor.replaceAll || 'Replace All',
            style: 'default',
            onPress: handleReplaceAll
          },
          {
            label: loc.editor.replace || 'Replace',
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
    </View>
  );
}
