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
    hitSlop: number;
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

// System font set for languages whose scripts are not covered by Hind (Bengali, Telugu, Tamil).
// Android natively maps 'sans-serif' to Noto Sans Bengali / Telugu / Tamil with calibrated baselines and OpenType tables.
const SYSTEM_FONT_SET = {
    sans: Platform.select({ android: 'sans-serif', default: 'sans-serif' }) as string,
    sansMed: Platform.select({ android: 'sans-serif-medium', default: 'sans-serif' }) as string,
    sansSemi: Platform.select({ android: 'sans-serif-medium', default: 'sans-serif' }) as string,
    sansBold: Platform.select({ android: 'sans-serif', default: 'sans-serif' }) as string,
    display: 'VesperLibre-Black',
    mono: 'DMMono-Regular',
    branding: Platform.select({ android: 'sans-serif', default: 'sans-serif' }) as string,
};

export const useTheme = () => {
    const systemColorScheme = useColorScheme();
    const { nightMode, themeId, fontSize, highContrast, largeTouch, language } = useSettingsStore(
        (s) => ({
            nightMode: s.nightMode,
            themeId: s.themeId,
            fontSize: s.fontSize,
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

    // Choose script-aware font set: Hind covers Latin & Devanagari (En, Hi, Mr).
    // Bengali, Telugu, and Tamil use native Android system fonts (Noto Sans Bengali, Noto Sans Telugu, Noto Sans Tamil).
    const isIndicWithoutHind = language === 'Bn' || language === 'Te' || language === 'Ta';
    const activeFontSet = isIndicWithoutHind ? SYSTEM_FONT_SET : HIND_FONT_SET;

    return useMemo<ThemeValue>(() => ({
        colors,
        ...sharedTokens,
        font: activeFontSet as any,
        isDark,
        fontSize: fontSize || 1.0,
        hitSlop: largeTouch ? 24 : 10,
    }), [colors, isDark, fontSize, largeTouch, activeFontSet]);
};
