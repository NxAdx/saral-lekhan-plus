import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../store/themeStore';
import { useTypography } from '../../store/typographyStore';
import { stripMarkdown } from '../../utils/markdown';

import { Note } from '../../store/notesStore';

interface BentoCardProps {
    note: Note;
    date: string;
    selected?: boolean;
    isSelectionMode?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BentoCard = React.memo(({
    note,
    date,
    selected = false,
    isSelectionMode = false,
    onPress,
    onLongPress,
}: BentoCardProps) => {
    if (!note) return null;
    const { title, body: preview, tag, pinned } = note;
    const { colors, radius, shadow, font } = useTheme();
    const type = useTypography();
    const cleanPreview = stripMarkdown(preview);
    const pressed = useSharedValue(0);

    const s = useMemo(() => StyleSheet.create({
        card: {
            marginVertical: 6,
            backgroundColor: selected ? colors.accentBg : colors.bgRaised,
            borderColor: selected ? colors.accent : (pinned ? colors.accent : colors.strokeDim),
            borderWidth: 1.5,
            borderRadius: radius.lg,
            ...shadow.soft,
            shadowColor: colors.shadow,
            elevation: 2,
        },
        content: {
            paddingVertical: 18,
            paddingHorizontal: 20,
        },
        title: {
            ...type.titleLarge,
            fontFamily: font.sansBold,
            color: (selected || pinned) ? colors.accent : colors.ink,
            marginBottom: 4,
            lineHeight: Math.round(type.titleLarge.fontSize * 1.38),
        },
        preview: {
            ...type.bodyLarge,
            fontFamily: font.sans,
            color: colors.inkMid,
            lineHeight: Math.round(type.bodyLarge.fontSize * 1.45),
            opacity: 0.85,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
        },
        date: {
            ...type.bodySmall,
            fontFamily: font.mono,
            color: colors.inkDim,
        },
        tagChip: {
            borderWidth: 1,
            paddingVertical: 4,
            paddingHorizontal: 10,
            backgroundColor: colors.accentBg,
            borderColor: colors.accentDim,
            borderRadius: radius.md,
            justifyContent: 'center',
            alignItems: 'center',
        },
        tagText: {
            ...type.labelMedium,
            fontFamily: font.sansBold,
            color: colors.accent,
            fontSize: Math.round(type.labelMedium.fontSize * 0.88),
            lineHeight: Math.round(type.labelMedium.fontSize * 1.35),
        },
        selectionIcon: {
            position: 'absolute',
            top: 12,
            right: 12,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        unselectedIcon: {
            position: 'absolute',
            top: 12,
            right: 12,
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 1.5,
            borderColor: colors.stroke,
            backgroundColor: 'transparent',
            zIndex: 10,
        }
    }), [colors, radius, shadow, font, pinned, type, selected]);

    const animStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withTiming(pressed.value && !isSelectionMode ? 0.98 : 1, { duration: 150 }) }
            ],
            elevation: withTiming(pressed.value && !isSelectionMode ? shadow.gentle.elevation : shadow.soft.elevation, { duration: 150 })
        };
    });

    return (
        <AnimatedPressable
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => { pressed.value = 1; }}
            onPressOut={() => { pressed.value = 0; }}
            style={[s.card, animStyle]}
            delayLongPress={300}
            testID={`note-card-${note.id}`}
        >
            {selected ? (
                <View style={s.selectionIcon}>
                    <Svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={colors.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12l5 5l10 -10" />
                    </Svg>
                </View>
            ) : isSelectionMode ? (
                <View style={s.unselectedIcon} />
            ) : null}
            <View style={s.content}>
                <Text style={s.title} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.2}>
                    {pinned ? (
                        <Svg viewBox="0 0 24 24" width={14} height={14} fill={colors.accent} stroke={colors.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
                            <Path d="M9 15l-4.5 4.5" />
                            <Path d="M14.5 4l5.5 5.5" />
                        </Svg>
                    ) : null}
                    {pinned ? ' ' : ''}
                    {title || 'Untitled'}
                </Text>

                {cleanPreview ? (
                    <Text style={s.preview} numberOfLines={2} ellipsizeMode="tail" maxFontSizeMultiplier={1.2}>
                        {cleanPreview}
                    </Text>
                ) : null}

                <View style={s.metaRow}>
                    <Text style={s.date}>{date}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {tag ? (
                            <View style={s.tagChip}>
                                <Text style={s.tagText}>{tag}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </AnimatedPressable>
    );
});
