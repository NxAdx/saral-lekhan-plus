import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from '../tokens';
import { getDeviceDefaultLanguage } from '../i18n/deviceLocale';

export type AppLanguage = 'En' | 'Hi' | 'Bn' | 'Te' | 'Mr' | 'Ta';
export type NightMode = 'system' | 'light' | 'dark';
export type AppFontType = 'hind' | 'poppins' | 'notoSans' | 'baloo2';

export function normalizeAppFont(_font?: string | null): AppFontType {
    return 'hind';
}

interface SettingsState {
    language: AppLanguage;
    hasUserChosenLanguage: boolean;
    nightMode: NightMode;
    themeId: ThemeName;
    fontSize: number;
    appFont: AppFontType;
    autoSave: boolean;
    ttsLanguage: string;
    ttsEnabled: boolean;
    highContrast: boolean;
    largeTouch: boolean;

    setLanguage: (l: AppLanguage) => void;
    setNightMode: (m: NightMode) => void;
    setThemeId: (i: ThemeName) => void;
    setFontSize: (s: number) => void;
    setAppFont: (f: AppFontType) => void;
    setAutoSave: (b: boolean) => void;
    setTtsLanguage: (l: string) => void;
    setTtsEnabled: (b: boolean) => void;
    setHighContrast: (b: boolean) => void;
    setLargeTouch: (b: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: getDeviceDefaultLanguage(),
            hasUserChosenLanguage: false,
            nightMode: 'system',
            themeId: 'classic',
            fontSize: 1.0,
            appFont: 'hind',
            autoSave: true,
            ttsLanguage: 'auto',
            ttsEnabled: true,
            highContrast: false,
            largeTouch: false,

            setLanguage: (l) => set({ language: l, hasUserChosenLanguage: true }),
            setNightMode: (m) => set({ nightMode: m }),
            setThemeId: (i) => {
                // Migration: if the theme was pitch (which is being removed), reset to classic
                const newTheme = i === ('pitch' as ThemeName) ? 'classic' : i;
                set({ themeId: newTheme as ThemeName });
            },
            setFontSize: (s) => set({ fontSize: s }),
            setAppFont: (f) => set({ appFont: normalizeAppFont(f) }),
            setAutoSave: (b) => set({ autoSave: b }),
            setTtsLanguage: (l) => set({ ttsLanguage: l }),
            setTtsEnabled: (b) => set({ ttsEnabled: b }),
            setHighContrast: (b) => set({ highContrast: b }),
            setLargeTouch: (b) => set({ largeTouch: b }),
        }),
        {
            name: 'saral-lekhan-settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
            merge: (persistedState, currentState) => {
                const typedState = (persistedState as Partial<SettingsState>) || {};
                const resolvedLanguage = typedState.hasUserChosenLanguage && typedState.language
                    ? typedState.language
                    : (typedState.language || getDeviceDefaultLanguage());

                return {
                    ...currentState,
                    ...typedState,
                    language: resolvedLanguage,
                    appFont: normalizeAppFont(typedState.appFont),
                    ttsEnabled: typedState.ttsEnabled !== undefined ? typedState.ttsEnabled : true,
                };
            },
        }
    )
);
