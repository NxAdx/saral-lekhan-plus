import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import { useNotesStore } from '../../store/notesStore';
import { useTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';
import { BentoCard } from '../../components/ui/BentoCard';
import { ThemedModal } from '../../components/ui/ThemedModal';

const NoteSeparator = () => <View style={{ height: 8 }} />;

export default function TrashScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font, shadow, radius } = theme;
    const lang = useSettingsStore(s => s.language);
    const loc = strings[lang] || strings['En'];

    const getDeletedNotes = useNotesStore((s) => s.getDeletedNotes);
    const restoreNote = useNotesStore((s) => s.restoreNote);
    const permanentlyDeleteNote = useNotesStore((s) => s.permanentlyDeleteNote);
    const emptyTrash = useNotesStore((s) => s.emptyTrash);

    const deletedNotes = getDeletedNotes();

    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
    const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);

    const handleNotePress = (id: number) => {
        setSelectedActionId(id);
        setShowActionModal(true);
    };

    const handleRestore = () => {
        if (selectedActionId !== null) restoreNote(selectedActionId);
        setShowActionModal(false);
    };

    const handlePermanentDelete = () => {
        if (selectedActionId !== null) permanentlyDeleteNote(selectedActionId);
        setShowActionModal(false);
    };

    const s = useMemo(() => StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.bg,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.strokeDim,
        },
        backBtn: { marginRight: 16, padding: 4 },
        title: { fontFamily: font.sansBold, fontSize: 22 * theme.fontSize, color: colors.ink, flex: 1 },
        emptyAllBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radius.sm,
            backgroundColor: colors.accentBg,
            borderWidth: 1,
            borderColor: colors.accent,
        },
        emptyAllText: {
            fontFamily: font.sansSemi,
            fontSize: 12,
            color: colors.accent,
            includeFontPadding: false,
        },

        listContent: { paddingBottom: 100, paddingTop: 16 },
        noteContainer: { paddingHorizontal: 20 },

        empty: { paddingTop: 60, alignItems: 'center' },
        emptyTitle: { fontFamily: font.sansSemi, fontSize: 16 * theme.fontSize, color: colors.inkMid, marginBottom: 6 },
        emptySub: { fontFamily: font.mono, fontSize: 12 * theme.fontSize, color: colors.inkDim },
    }), [colors, font, theme.fontSize, radius, shadow]);

    return (
        <View style={s.root}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} translucent={false} />

            <View style={s.header}>
                <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={theme.hitSlop} accessibilityLabel="Back">
                    <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.ink} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12l14 0" />
                        <Path d="M5 12l6 6" />
                        <Path d="M5 12l6 -6" />
                    </Svg>
                </Pressable>
                <Text style={s.title}>{loc.trash}</Text>
                {deletedNotes.length > 0 && (
                    <Pressable onPress={() => setShowEmptyTrashModal(true)} style={s.emptyAllBtn} hitSlop={theme.hitSlop} accessibilityLabel="Empty trash">
                        <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.accent} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M4 7l16 0" />
                            <Path d="M10 11l0 6" />
                            <Path d="M14 11l0 6" />
                            <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                            <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                        </Svg>
                        <Text style={s.emptyAllText}>{loc.emptyAll || 'Empty All'}</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                data={deletedNotes}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={s.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={s.noteContainer}>
                        <BentoCard
                            note={item}
                            date={new Date(item.updated_at).toLocaleDateString()}
                            onPress={() => handleNotePress(item.id)}
                        />
                    </View>
                )}
                ItemSeparatorComponent={NoteSeparator}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyTitle}>{loc.trashEmpty}</Text>
                        <Text style={s.emptySub}>{loc.trashEmptySub}</Text>
                    </View>
                }
            />

            <ThemedModal
                visible={showActionModal}
                title={loc.trash}
                onClose={() => setShowActionModal(false)}
                actions={[
                    {
                        label: loc.restore,
                        style: 'default',
                        onPress: handleRestore
                    },
                    {
                        label: loc.deleteForever,
                        style: 'destructive',
                        onPress: handlePermanentDelete
                    },
                    {
                        label: loc.editor.cancel,
                        style: 'cancel',
                        onPress: () => setShowActionModal(false)
                    }
                ]}
            />

            <ThemedModal
                visible={showEmptyTrashModal}
                title={loc.emptyTrash || 'Empty Trash'}
                subtitle={`${loc.emptyTrashConfirm || 'Permanently delete all'} ${deletedNotes.length} ${loc.trashNotes || 'notes in trash? This cannot be undone.'}`}
                onClose={() => setShowEmptyTrashModal(false)}
                actions={[
                    {
                        label: `${loc.deleteAll || 'Delete All'} (${deletedNotes.length})`,
                        style: 'destructive',
                        onPress: () => {
                            emptyTrash();
                            setShowEmptyTrashModal(false);
                        }
                    },
                    {
                        label: loc.editor.cancel,
                        style: 'cancel',
                        onPress: () => setShowEmptyTrashModal(false)
                    }
                ]}
            />
        </View>
    );
}
