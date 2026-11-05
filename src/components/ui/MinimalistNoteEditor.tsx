import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';
import { useTypography } from '../../store/typographyStore';
import { wordCount } from '../../utils/markdown';

interface MinimalistNoteEditorProps {
  initialTitle?: string;
  initialBody?: string;
  isGlancePinned?: boolean;
  onSave: (data: { title: string; body: string; isGlance: boolean }) => void;
  onSwitchToRichMode?: (currentTitle: string, currentBody: string) => void;
  onBack: () => void;
}

export function MinimalistNoteEditor({
  initialTitle = '',
  initialBody = '',
  isGlancePinned = false,
  onSave,
  onSwitchToRichMode,
  onBack,
}: MinimalistNoteEditorProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const settings = useSettingsStore();
  const type = useTypography();
  const { colors, font, radius } = theme;
  const loc = strings[settings.language] || strings['En'];

  // Clean body if coming from HTML
  const cleanInitialBody = useMemo(() => {
    if (!initialBody) return '';
    return initialBody
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }, [initialBody]);

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(cleanInitialBody);
  const [isGlance, setIsGlance] = useState(isGlancePinned);
  const [isDonePressed, setIsDonePressed] = useState(false);

  const bodyInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Focus body input on mount for zero-friction capture
    const timer = setTimeout(() => {
      bodyInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    
    // Auto-derive title from first line if empty
    let finalTitle = title.trim();
    if (!finalTitle && body.trim()) {
      const firstLine = body.trim().split('\n')[0];
      finalTitle = firstLine.length > 35 ? firstLine.slice(0, 35) + '...' : firstLine;
    }

    onSave({
      title: finalTitle,
      body: body.trim(),
      isGlance,
    });
  };

  const toggleGlance = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsGlance(!isGlance);
  };

  // Stats
  const words = useMemo(() => wordCount(body), [body]);
  const chars = body.length;

  // Visual Theme Tokens
  const isDark = theme.isDark;
  const cardBg = isDark ? '#141416' : '#F4F4F6';
  const cardBorder = isDark ? '#222226' : '#EAEAEF';
  const textPrimary = isDark ? '#FFFFFF' : '#111113';
  const textSecondary = isDark ? '#8E8E93' : '#6E6E73';
  const doneBg = isDark ? '#FFFFFF' : '#111113';
  const doneText = isDark ? '#000000' : '#FFFFFF';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerButton,
            { backgroundColor: isDark ? '#1F1F24' : '#EAEAEF', opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke={textPrimary}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.headerTitle,
              { color: textPrimary, fontFamily: font.sansBold },
            ]}
          >
            {isGlance ? '📌 Glance Note' : 'Mononote'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary, fontFamily: font.sans }]}>
            {loc.simpleNotesTitle || 'सरल लेखन'}
          </Text>
        </View>

        {/* Switch to Rich Editor */}
        {onSwitchToRichMode && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSwitchToRichMode(title, body);
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.switchButton,
              {
                backgroundColor: isDark ? '#1F1F24' : '#EAEAEF',
                borderColor: cardBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityLabel="Switch to Rich Editor"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L14.4 7.6L20 8.4L15.8 12.5L17 18L12 15.2L7 18L8.2 12.5L4 8.4L9.6 7.6L12 2Z"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.switchText, { color: colors.accent, fontFamily: font.sansMed }]}>
              Rich
            </Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Mononote Squircle Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            {/* Optional Note Title */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title (optional)"
              placeholderTextColor={textSecondary}
              style={[
                styles.titleInput,
                {
                  color: textPrimary,
                  fontFamily: font.sansBold,
                },
              ]}
              maxLength={80}
              returnKeyType="next"
              onSubmitEditing={() => bodyInputRef.current?.focus()}
            />

            {/* Note Body Text Input */}
            <TextInput
              ref={bodyInputRef}
              value={body}
              onChangeText={setBody}
              placeholder="Write your thought, priority, or reminder..."
              placeholderTextColor={textSecondary}
              style={[
                styles.bodyInput,
                {
                  color: textPrimary,
                  fontFamily: font.sans,
                },
              ]}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
            />

            {/* Bottom Card Footer: Glance Pin Toggle + Word Count */}
            <View style={styles.cardFooter}>
              {/* Glance Lock Screen Toggle Pill */}
              <Pressable
                onPress={toggleGlance}
                hitSlop={8}
                style={[
                  styles.glancePill,
                  {
                    backgroundColor: isGlance
                      ? (isDark ? '#2C2C30' : '#E2E2E8')
                      : 'transparent',
                    borderColor: isGlance ? colors.accent : cardBorder,
                  },
                ]}
                accessibilityLabel="Pin to Lock Screen"
              >
                <Text style={styles.glanceIcon}>📌</Text>
                <Text
                  style={[
                    styles.glanceText,
                    {
                      color: isGlance ? colors.accent : textSecondary,
                      fontFamily: isGlance ? font.sansBold : font.sansMed,
                    },
                  ]}
                >
                  {isGlance ? 'Lock Screen Pinned' : 'Pin to Lock Screen'}
                </Text>
              </Pressable>

              {/* Character & Word count with tabular numbers */}
              <View style={styles.statsBadge}>
                <Text
                  style={[
                    styles.statsText,
                    {
                      color: textSecondary,
                      fontFamily: font.mono || font.sans,
                    },
                  ]}
                >
                  {words}w · {chars}c
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Floating "Done" Action Pill */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.bg,
            },
          ]}
        >
          <Pressable
            onPress={handleDone}
            onPressIn={() => setIsDonePressed(true)}
            onPressOut={() => setIsDonePressed(false)}
            style={[
              styles.doneButton,
              {
                backgroundColor: doneBg,
                transform: [{ scale: isDonePressed ? 0.98 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Path
                d="M20 6L9 17L4 12"
                stroke={doneText}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text
              style={[
                styles.doneButtonText,
                {
                  color: doneText,
                  fontFamily: font.sansBold,
                },
              ]}
            >
              {loc.done || 'Done'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  switchText: {
    fontSize: 12,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    minHeight: 280,
  },
  titleInput: {
    fontSize: 19,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minHeight: 180,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  glancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 6,
  },
  glanceIcon: {
    fontSize: 13,
  },
  glanceText: {
    fontSize: 12,
  },
  statsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  statsText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  doneButton: {
    height: 52,
    borderRadius: 26,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  doneButtonText: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

