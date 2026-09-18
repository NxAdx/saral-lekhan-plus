import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Animated, { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import {
  ScrollView, StatusBar, Pressable, Platform, TextInput, View, Text, StyleSheet, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { Svg, Path } from 'react-native-svg';
import { useNotesStore, ALL_TAG_ID } from '../../store/notesStore';
import { shallow } from 'zustand/shallow';
import { useTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';
import { BentoCard } from '../../components/ui/BentoCard';
import { TagPill } from '../../components/ui/TagPill';
import { useTypography } from '../../store/typographyStore';
import { FAB } from '../../components/ui/FAB';
import { ThemedModal } from '../../components/ui/ThemedModal';
import { SmoothLanding } from '../../components/ui/SmoothLanding';
import { stripMarkdown, markdownToHtml } from '../../utils/markdown';
import { checkForUpdate } from '../../utils/githubUpdater';

const HOME_BRAND_EN = 'Saral';
const HOME_BRAND_HI = 'Lekhan';

const NoteSeparator = () => <View style={{ height: 8 }} />;

function formatDate(ts: number, loc: any): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return loc.home.yesterday || 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { themeId, nightMode, language: lang } = useSettingsStore(s => ({
    themeId: s.themeId,
    nightMode: s.nightMode,
    language: s.language
  }), shallow);
  const loc = strings[lang] || strings['En'];
  const { colors, font, radius, shadow, spacing, isDark } = theme;
  const type = useTypography();

  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG_ID);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [appAlert, setAppAlert] = useState<{ visible: boolean; title: string; subtitle: string }>({ visible: false, title: '', subtitle: '' });
  const [updateModal, setUpdateModal] = useState<{ visible: boolean; title: string; subtitle: string; version: string }>({ visible: false, title: '', subtitle: '', version: '' });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const isSelectionMode = selectedIds.size > 0;

  const listRef = useRef<FlatList>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const isLoaded = useNotesStore((s) => s.isLoaded);
  const notes = useNotesStore((s) => s.getNotesFilteredByTag(selectedTag));
  const getUniqueTags = useNotesStore((s) => s.getUniqueTags);
  
  const addNote = useNotesStore((s) => s.addNote);

  const bulkDeleteNotes = useNotesStore((s) => s.bulkDeleteNotes);

  useEffect(() => {
    const runUpdateCheck = async () => {
      const info = await checkForUpdate();
      if (info && info.hasUpdate && !info.isReinstall) {
        setUpdateModal({
          visible: true,
          title: "Update Available",
          subtitle: `Version ${info.version} is available! Head to Settings to download it directly.`,
          version: info.version
        });
      }
    };
    runUpdateCheck();
  }, [router]);

  const uniqueTags = useMemo(() => getUniqueTags(), [notes]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim().toLowerCase());
    }, 120);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchIndex = useMemo(() => {
    return notes.map((note) => ({
      note,
      haystack: [
        note.title,
        stripMarkdown(note.body),
        note.tag || '',
      ].join(' ').toLowerCase(),
    }));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = debouncedSearchQuery;
    if (!q) return notes;
    return searchIndex
      .filter(({ haystack }) => haystack.includes(q))
      .map(({ note }) => note);
  }, [notes, searchIndex, debouncedSearchQuery]);


  const toggleSelection = useCallback((id: number) => {
    console.log('[Selection] toggleSelection called, id:', id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      console.log('[Selection] after toggle, selectedIds size:', next.size);
      return next;
    });
  }, []);

  const handleLongPress = useCallback((id: number) => {
    console.log('[Selection] handleLongPress called, id:', id, '→ entering selection mode');
    setSelectedIds(new Set([id]));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Clear selection when filters or search change
  useEffect(() => {
    if (selectedIds.size > 0) {
      clearSelection();
    }
  }, [selectedTag, debouncedSearchQuery, clearSelection]);

  const toggleSelectAll = useCallback(() => {
    console.log('[Selection] toggleSelectAll called, selected:', selectedIds.size, 'total:', filteredNotes.length);
    if (selectedIds.size === filteredNotes.length) {
      console.log('[Selection] → deselecting all');
      clearSelection();
    } else {
      console.log('[Selection] → selecting all', filteredNotes.length, 'notes');
      setSelectedIds(new Set(filteredNotes.map(n => n.id)));
    }
  }, [filteredNotes, selectedIds.size, clearSelection]);

  const handleBulkDelete = useCallback(() => {
    console.log('[Selection] handleBulkDelete called, selectedIds:', Array.from(selectedIds));
    setShowBulkDeleteModal(true);
  }, [selectedIds]);

  const handleBulkExport = useCallback(async () => {
    const selectedNotes = filteredNotes.filter(n => selectedIds.has(n.id));
    if (selectedNotes.length === 0) return;
    try {
      const zip = new JSZip();
      
      selectedNotes.forEach(n => {
        const safeTitle = (n.title || `note_${n.id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        zip.file(`${safeTitle}.md`, `# ${n.title}\n\n${n.body}`);
      });

      const base64Content = await zip.generateAsync({ type: 'base64' });
      const filename = `saral_export_${Date.now()}.zip`;
      const uri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(uri, base64Content, { encoding: FileSystem.EncodingType.Base64 });
      
      const { shareAsync } = await import('expo-sharing');
      await shareAsync(uri, { dialogTitle: 'Bulk Export (ZIP)', UTI: 'public.zip-archive', mimeType: 'application/zip' });
      clearSelection();
    } catch (e) {
      console.warn(e);
    }
  }, [selectedIds, filteredNotes, clearSelection]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 400 && !showBackToTop) {
      setShowBackToTop(true);
    } else if (offsetY <= 400 && showBackToTop) {
      setShowBackToTop(false);
    }
  }, [showBackToTop]);

  const onNewNote = useCallback(() => router.push('/editor/new'), [router]);
  const onNotePress = useCallback((id: number) => router.push(`/editor/${id}`), [router]);

  const handleImportFile = useCallback(async () => {
    setShowImportModal(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/markdown', 'text/plain'],
        copyToCacheDirectory: true
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const file = result.assets[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'md' && ext !== 'txt') {
        setAppAlert({ visible: true, title: loc.home.importFailedTitle, subtitle: loc.editor.mdOnly || "Only Markdown files supported" });
        return;
      }
      let content = await FileSystem.readAsStringAsync(file.uri);
      if (ext === 'md') {
        content = markdownToHtml(content);
      }
      const newTitle = file.name.replace(/\.[^/.]+$/, "");
      const generatedId = addNote({ title: newTitle, body: content, tag: '', pinned: false });
      router.push(`/editor/${generatedId}`);
    } catch (e) {
      console.warn("Import failed", e);
      setAppAlert({ visible: true, title: loc.home.importFailedTitle, subtitle: loc.home.importFailedSub });
    }
  }, [addNote, loc, router]);

  const handleImportKeepZip = useCallback(async () => {
    setShowImportModal(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/x-zip-compressed'],
        copyToCacheDirectory: true
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const file = result.assets[0];
      
      setAppAlert({ visible: true, title: "Importing...", subtitle: "Parsing Google Keep Takeout. This might take a moment." });
      
      const { importGoogleKeepZip } = await import('../../utils/keepImporter');
      const importResult = await importGoogleKeepZip(file.uri);
      
      if (importResult.error) {
        setAppAlert({ visible: true, title: "Import Failed", subtitle: importResult.error });
      } else {
        setAppAlert({ visible: true, title: "Import Complete", subtitle: `Imported ${importResult.success} notes. Skipped ${importResult.skipped}. Failed ${importResult.failed}.` });
      }
    } catch (e) {
      console.warn("Keep import failed", e);
      setAppAlert({ visible: true, title: loc.home.importFailedTitle, subtitle: loc.home.importFailedSub });
    }
  }, [loc]);

  const handleImport = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44,
    },
    listContent: { paddingBottom: 100 },
    noteContainer: { paddingHorizontal: 20 },
    headerLeft: {
      flexShrink: 1, // Allow title to take only needed space
    },
    appNameRow: {
      flexDirection: 'row',
      alignItems: 'baseline', // Fixed: use baseline for nested text strategy
    },
    appNameWordmark: {
      color: colors.ink,
      fontFamily: font.sansBold,
      fontSize: 28, // Reduced from 32 to fit
      lineHeight: 34,
      letterSpacing: -0.4,
      includeFontPadding: false,
    },
    appNameHindi: {
      color: colors.ink,
      fontFamily: font.sansBold,
      fontSize: 28, // Reduced from 32 to fit
      lineHeight: 34,
      letterSpacing: -0.4,
      includeFontPadding: false,
    },
    appSub: {
      ...type.labelMedium,
      fontFamily: font.sansMed,
      color: colors.inkDim,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    selectionTitle: {
      ...type.headlineLarge,
      fontFamily: font.sansBold,
      color: colors.ink,
      fontSize: 24,
      lineHeight: 30,
    },
    selectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      gap: 10,
    },
    deleteBtn: {
      flex: 1, height: 44, borderRadius: 99, borderWidth: 1.5, borderColor: colors.accent,
      backgroundColor: colors.accentBg, justifyContent: 'center', alignItems: 'center',
      flexDirection: 'row', gap: 8,
      ...shadow.gentle, shadowColor: colors.shadow
    },
    deleteBtnLabel: {
      ...type.labelMedium, fontFamily: font.sansSemi, color: colors.accent
    },
    exportBtn: {
      height: 44, paddingHorizontal: 16, borderRadius: 99, borderWidth: 1.5, borderColor: colors.stroke,
      backgroundColor: colors.bgRaised, justifyContent: 'center', alignItems: 'center',
      flexDirection: 'row', gap: 6,
      ...shadow.gentle, shadowColor: colors.shadow
    },
    exportBtnLabel: {
      ...type.labelMedium, fontFamily: font.sansSemi, color: colors.inkMid
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.bgRaised,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.strokeDim,
    },
    chipText: {
      ...type.labelMedium,
      fontFamily: font.sansBold,
      color: colors.inkMid
    },
    searchWrap: {
      marginHorizontal: 20, marginBottom: spacing[4], backgroundColor: colors.bgRaised,
      borderRadius: radius.pill, borderWidth: 1, borderColor: searchFocused ? colors.accent : colors.strokeDim,
      paddingHorizontal: 16, height: 52, flexDirection: 'row', alignItems: 'center',
      ...shadow.gentle, shadowColor: colors.shadow, gap: 12
    },
    searchInput: { flex: 1, fontFamily: font.sans, fontSize: 15 * theme.fontSize, color: colors.ink, padding: 0 },
    clearBtn: { fontSize: 13 * theme.fontSize, color: colors.inkDim, paddingHorizontal: 4 },
    tagRailOuter: { marginBottom: 12 },
    tagRail: { paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
    empty: { paddingTop: 60, alignItems: 'center' },
    emptyTitle: { fontFamily: font.sansSemi, fontSize: 16 * theme.fontSize, color: colors.inkMid, marginBottom: 6 },
    emptySub: { fontFamily: font.mono, fontSize: 12 * theme.fontSize, color: colors.inkDim },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 20
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    fabWrap: { position: 'absolute', bottom: 32, right: 28 },
    circleBtn: {
      width: 44, height: 44, borderRadius: 99, borderWidth: 1.5, borderColor: colors.stroke,
      backgroundColor: colors.bgRaised, justifyContent: 'center', alignItems: 'center',
      ...shadow.gentle, shadowColor: colors.shadow
    },
    textBtn: {
      paddingHorizontal: 16, height: 44, borderRadius: 99, borderWidth: 1.5, borderColor: colors.stroke,
      backgroundColor: colors.bgRaised, justifyContent: 'center', alignItems: 'center',
      ...shadow.gentle, shadowColor: colors.shadow
    },
    textBtnLabel: {
      ...type.labelMedium, fontFamily: font.sansSemi, color: colors.ink
    },
  }), [colors, font, radius, shadow, searchFocused, spacing, theme.fontSize]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isItemSelected = selectedIds.has(item.id);
    return (
      <View style={s.noteContainer}>
        <BentoCard
          note={item}
          onPress={() => {
            if (isSelectionMode) {
              toggleSelection(item.id);
            } else {
              onNotePress(item.id);
            }
          }}
          onLongPress={() => handleLongPress(item.id)}
          date={formatDate(item.updated_at, loc)}
          selected={isItemSelected}
          isSelectionMode={isSelectionMode}
        />
      </View>
    );
  }, [toggleSelection, onNotePress, handleLongPress, loc, s, isSelectionMode, selectedIds]);

  if (!isLoaded) return <SmoothLanding themeId={themeId} isDark={isDark} />;

  return (
    <Animated.View style={s.root} entering={FadeIn.duration(400)}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} translucent={false} />
      {/* ── Header rendered OUTSIDE the list so React always re-renders it ── */}
      <View style={s.header}>
        {isSelectionMode ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
            <Pressable onPress={clearSelection} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Close selection">
              <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 6l-12 12" />
                <Path d="M6 6l12 12" />
              </Svg>
            </Pressable>
            <Text style={s.selectionTitle}>{selectedIds.size} {loc.home.selected || 'Selected'}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={toggleSelectAll} style={s.textBtn} hitSlop={theme.hitSlop}>
              <Text style={s.textBtnLabel}>
                {selectedIds.size === filteredNotes.length && filteredNotes.length > 0
                  ? loc.home.deselectAll || 'Deselect All'
                  : loc.home.selectAll || 'Select All'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={s.headerLeft}>
              <Text style={s.appNameRow} numberOfLines={1}>
                <Text style={s.appNameWordmark}>{HOME_BRAND_EN}</Text>
                <Text style={s.appNameHindi}> {HOME_BRAND_HI}</Text>
              </Text>
              <Text style={s.appSub}>{loc.appSub || "NOTES EXPERIENCE"}</Text>
            </View>
            <View style={s.headerRight}>
              <Pressable onPress={handleImport} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Import notes">
                <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <Path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" />
                  <Path d="M7 16.5l3 3l3 -3" />
                  <Path d="M10 20.2V12" />
                  <Path d="M20 18v1a2 2 0 0 1 -2 2h-1" />
                </Svg>
              </Pressable>
              <Pressable onPress={() => router.push('/trash')} style={s.circleBtn} hitSlop={theme.hitSlop} accessibilityLabel="Trash">
                <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 7l16 0" />
                  <Path d="M10 11l0 6" />
                  <Path d="M14 11l0 6" />
                  <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                  <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                </Svg>
              </Pressable>
              <Pressable onPress={() => router.push('/settings')} style={s.circleBtn} hitSlop={theme.hitSlop} testID="settings-button" accessibilityLabel="Settings">
                <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37a1.724 1.724 0 0 0 2.572 -1.065z" />
                  <Path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                </Svg>
              </Pressable>
            </View>
          </>
        )}
      </View>
      {/* Selection action bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <View style={s.selectionActions}>
          <Pressable onPress={handleBulkDelete} style={s.deleteBtn} hitSlop={theme.hitSlop} accessibilityLabel={`Delete ${selectedIds.size} notes`}>
            <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.accent} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 7l16 0" />
              <Path d="M10 11l0 6" />
              <Path d="M14 11l0 6" />
              <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
              <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
            </Svg>
            <Text style={s.deleteBtnLabel}>{loc.editor.delete || 'Delete'} ({selectedIds.size})</Text>
          </Pressable>
          <Pressable onPress={handleBulkExport} style={s.exportBtn} hitSlop={theme.hitSlop} accessibilityLabel="Export selected notes">
            <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.inkMid} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
              <Path d="M7 11l5 5l5 -5" />
              <Path d="M12 4l0 12" />
            </Svg>
            <Text style={s.exportBtnLabel}>{loc.home.export || 'Export'}</Text>
          </Pressable>
        </View>
      )}
      {/* Search + Tags */}
      <View style={s.searchWrap}>
        <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.inkDim} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <Path d="M21 21l-6 -6" />
        </Svg>
        <TextInput
          style={s.searchInput}
          placeholder={loc.searchPlaceholder}
          placeholderTextColor={colors.inkDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
          testID="search-input"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={theme.hitSlop} accessibilityLabel="Clear search">
            <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={colors.inkDim} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 6l-12 12" />
              <Path d="M6 6l12 12" />
            </Svg>
          </Pressable>
        )}
      </View>
      {uniqueTags.length > 0 && (
        <View style={s.tagRailOuter}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tagRail}
            data={['ALL_TAG_ID', ...uniqueTags]}
            keyExtractor={(item) => item}
            renderItem={({ item: tag }) => {
              if (tag === 'ALL_TAG_ID') {
                return <TagPill label={loc.allTag || "All Notes"} active={selectedTag === ALL_TAG_ID} onPress={() => setSelectedTag(ALL_TAG_ID)} />;
              }
              return <TagPill label={`#${tag}`} active={selectedTag === tag} onPress={() => setSelectedTag(tag)} />;
            }}
          />
        </View>
      )}
      {/* ── Note List (FlatList — no recycler caching bugs) ── */}
      <FlatList
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={filteredNotes}
        extraData={{ isSelectionMode, selectedIdsCount: selectedIds.size }}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        ItemSeparatorComponent={NoteSeparator}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>
              {searchQuery ? loc.noResults : loc.noNotes}
            </Text>
            <Text style={s.emptySub}>
              {searchQuery
                ? `${loc.noResultsSub} "${searchQuery}"`
                : loc.noNotesSub}
            </Text>
          </View>
        }
      />
      <View style={s.fabWrap} pointerEvents="box-none">
        {showBackToTop && (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={{ marginBottom: 16 }}>
            <Pressable
              onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
              style={[s.circleBtn, { backgroundColor: colors.bgRaised, alignSelf: 'flex-end', width: 40, height: 40 }]}
              accessibilityLabel="Back to top"
            >
              <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 19V5M5 12l7-7 7 7" />
              </Svg>
            </Pressable>
          </Animated.View>
        )}
        <FAB onPress={onNewNote} testID="fab-add-note" />
      </View>
      <ThemedModal
        visible={showImportModal}
        title={loc.home.importTitle}
        subtitle={loc.home.importSub}
        onClose={() => setShowImportModal(false)}
        actions={[
          { label: loc.home.importChoose, style: 'default', onPress: handleImportFile },
          { label: "Import Google Keep (.zip)", style: 'default', onPress: handleImportKeepZip },
          { label: loc.editor.cancel, style: 'cancel', onPress: () => setShowImportModal(false) }
        ]}
      />
      <ThemedModal
        visible={showBulkDeleteModal}
        title={loc.editor.deleteNote}
        subtitle={`${loc.home.deleteConfirm || "Delete"} ${selectedIds.size} ${loc.home.notesTitle || "notes"}?`}
        onClose={() => setShowBulkDeleteModal(false)}
        actions={[
          {
            label: loc.editor.delete,
            style: 'destructive',
            onPress: () => {
              const ids = Array.from(selectedIds);
              console.log('[Selection] CONFIRMED bulk delete, ids:', ids);
              bulkDeleteNotes(ids);
              clearSelection();
              setShowBulkDeleteModal(false);
            }
          },
          { label: loc.editor.cancel, style: 'cancel', onPress: () => setShowBulkDeleteModal(false) }
        ]}
      />
      <ThemedModal
        visible={appAlert.visible}
        title={appAlert.title}
        subtitle={appAlert.subtitle}
        onClose={() => setAppAlert(prev => ({ ...prev, visible: false }))}
        actions={[
          { label: loc.settingsScreen.ok, style: 'default', onPress: () => setAppAlert(prev => ({ ...prev, visible: false })) }
        ]}
      />
      <ThemedModal
        visible={updateModal.visible}
        onClose={() => setUpdateModal(prev => ({ ...prev, visible: false }))}
        title={updateModal.title + " - " + updateModal.subtitle}
        actions={[
          { label: "Later", onPress: () => setUpdateModal(prev => ({ ...prev, visible: false })), style: 'cancel' },
          {
            label: "Update Now",
            onPress: () => {
              setUpdateModal(prev => ({ ...prev, visible: false }));
              router.push('/settings');
            },
            style: 'default'
          }
        ]}
      />
    </Animated.View>
  );
}
