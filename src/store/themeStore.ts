import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { shallow } from 'zustand/shallow';
import { sharedTokens, themes } from '../tokens';
import { useSettingsStore, AppLanguage } from './settingsStore';

type ThemeValue = {
    colors: (typeof themes)[keyof typeof themes]['light'];
    spacing: typeof sharedTokens.spacing;
    radius: typeof sharedTokens.radius;
    shadow: typeof sharedTokens.shadow;
    strokeWidth: typeof sharedTokens.strokeWidth;
    typography: typeof sharedTokens.typography;
    font: {
        sans: string;
        sansMed: string;
        sansSemi: string;
        sansBold: string;
        display: string;
        mono: string;
        branding: string;
    };
    isDark: boolean;
    fontSize: number;
    hitSlop: { top: number; bottom: number; left: number; right: number };
};

const HIND_FONT_SET = {
    sans: 'Hind',
    sansMed: 'Hind-Medium',
    sansSemi: 'Hind-SemiBold',
    sansBold: 'Hind-Bold',
    display: 'VesperLibre-Black',
    mono: 'DMMono-Regular',
    branding: 'Hind-Bold',
};

// For scripts not in Hind (Bengali, Telugu, Tamil), use calibrated system fonts
// which carry native ascent/descent metrics for zero matra/halant clipping.
const SYSTEM_INDIC_FONT_SET = {
    sans: Platform.OS === 'android' ? 'sans-serif' : 'System',
    sansMed: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
    sansSemi: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
    sansBold: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
    display: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
    mono: Platform.OS === 'android' ? 'monospace' : 'Courier',
    branding: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
};

export const useTheme = () => {
    const systemColorScheme = useColorScheme();
    const { nightMode, themeId, highContrast, largeTouch, language } = useSettingsStore(
        (s) => ({
            nightMode: s.nightMode,
            themeId: s.themeId,
            highContrast: s.highContrast,
            largeTouch: s.largeTouch,
            language: s.language,
        }),
        shallow
    );

    // Determine actual dark mode state
    const isDark = nightMode === 'system'
        ? (systemColorScheme === 'dark')
        : nightMode === 'dark';

    // Drive colors
    const colors = useMemo(() => {
        const themeEntry = themes[themeId] || themes.classic;
        const c = { ...(isDark ? themeEntry.dark : themeEntry.light) };
        
        if (highContrast) {
            c.inkDim = isDark ? '#F5F5F5' : '#111111';
            c.inkMid = isDark ? '#FAFAFA' : '#0A0A0A';
            c.ink = isDark ? '#FFFFFF' : '#000000';
            c.stroke = isDark ? '#888888' : '#777777';
            c.strokeDim = isDark ? '#666666' : '#999999';
        }
        
        return c;
    }, [themeId, isDark, highContrast]);

    // Script-aware typography selection
    const fontSet = useMemo(() => {
        // PERMANENT DIRECTIVE: English fonts must strictly use Hind typeface family at 1.0x scale.
        // Hindi (Hi) and Marathi (Mr) are Devanagari, natively supported with full fidelity by Hind.
        if (language === 'En' || language === 'Hi' || language === 'Mr') {
            return HIND_FONT_SET;
        }
        // Bengali (Bn), Telugu (Te), and Tamil (Ta) use system Indic font mapping to eliminate clipping.
        return SYSTEM_INDIC_FONT_SET;
    }, [language]);

    return useMemo<ThemeValue>(() => ({
        colors,
        ...sharedTokens,
        font: fontSet as any,
        isDark,
        fontSize: language === 'En' ? 1.0 : 0.95,
        hitSlop: {
            top: largeTouch ? 14 : 8,
            bottom: largeTouch ? 14 : 8,
            left: largeTouch ? 4 : 2,
            right: largeTouch ? 4 : 2,
        },
    }), [colors, fontSet, isDark, largeTouch, language]);
};
