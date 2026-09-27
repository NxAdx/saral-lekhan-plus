import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';
import { AppLanguage } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';

export interface LanguageOption {
  id: AppLanguage;
  nativeName: string;
  englishName: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'En', nativeName: 'English', englishName: 'English', script: 'Latin' },
  { id: 'Hi', nativeName: 'हिन्दी', englishName: 'Hindi', script: 'Devanagari' },
  { id: 'Mr', nativeName: 'मराठी', englishName: 'Marathi', script: 'Devanagari' },
  { id: 'Bn', nativeName: 'বাংলা', englishName: 'Bengali', script: 'Bengali' },
  { id: 'Te', nativeName: 'తెలుగు', englishName: 'Telugu', script: 'Telugu' },
  { id: 'Ta', nativeName: 'தமிழ்', englishName: 'Tamil', script: 'Tamil' },
];

interface LanguageSelectorModalProps {
  visible: boolean;
  currentLanguage: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  currentLanguage,
  onSelectLanguage,
  onClose,
}) => {
  const { colors, font, radius, shadow } = useTheme();
  const loc = strings[currentLanguage] || strings['En'];

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.dialog, { backgroundColor: colors.bgRaised, borderColor: colors.stroke, borderRadius: radius.xl, ...shadow.hard, shadowColor: colors.shadow }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentBg }]}>
              <Svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                <Path d="M3.6 9h16.8" />
                <Path d="M3.6 15h16.8" />
                <Path d="M11.5 3a17 17 0 0 0 0 18" />
                <Path d="M12.5 3a17 17 0 0 1 0 18" />
              </Svg>
            </View>
            <Text style={[styles.title, { color: colors.ink, fontFamily: font.sansBold }]}>
              {loc.settingsScreen?.displayLanguage || 'Display Language'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.inkDim, fontFamily: font.sans }]}>
              {loc.settingsScreen?.displayLanguageSub || 'Choose your preferred language'}
            </Text>
          </View>

          {/* Languages List */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.id;
              return (
                <Pressable
                  key={lang.id}
                  style={[
                    styles.langRow,
                    {
                      backgroundColor: isSelected ? colors.accentBg : colors.bg,
                      borderColor: isSelected ? colors.accent : colors.strokeDim,
                      borderRadius: radius.md,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectLanguage(lang.id);
                    onClose();
                  }}
                >
                  <View style={styles.langInfo}>
                    <Text
                      style={[
                        styles.nativeName,
                        {
                          color: isSelected ? colors.accent : colors.ink,
                          fontFamily: font.sansBold,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.englishName,
                        {
                          color: colors.inkDim,
                          fontFamily: font.sans,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {lang.englishName}
                    </Text>
                  </View>

                  {/* Radio indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.accent : colors.strokeDim,
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12l5 5l10 -10" />
                      </Svg>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer Close Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: colors.bgDeep, borderColor: colors.strokeDim, borderRadius: radius.pill }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: colors.inkMid, fontFamily: font.sansSemi }]}>
                {loc.editor?.cancel || 'Cancel'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    maxHeight: 340,
  },
  listContent: {
    paddingVertical: 4,
    gap: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    borderWidth: 1.5,
  },
  langInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flex: 1,
  },
  nativeName: {
    fontSize: 16,
    lineHeight: 22,
  },
  englishName: {
    fontSize: 13,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  footer: {
    marginTop: 14,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
  },
});
