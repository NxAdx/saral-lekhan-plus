import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { shallow } from 'zustand/shallow';
import { sharedTokens, themes } from '../tokens';
import { useSettingsStore } from './settingsStore';

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

const TELUGU_FONT_SET = {
    sans: 'NotoSansTelugu-Regular',
    sansMed: 'NotoSansTelugu-SemiBold',
    sansSemi: 'NotoSansTelugu-SemiBold',
    sansBold: 'NotoSansTelugu-Bold',
    display: 'NotoSansTelugu-Bold',
    mono: 'DMMono-Regular',
    branding: 'NotoSansTelugu-Bold',
};

const TAMIL_FONT_SET = {
    sans: 'NotoSansTamil-Regular',
    sansMed: 'NotoSansTamil-SemiBold',
    sansSemi: 'NotoSansTamil-SemiBold',
    sansBold: 'NotoSansTamil-Bold',
    display: 'NotoSansTamil-Bold',
    mono: 'DMMono-Regular',
    branding: 'NotoSansTamil-Bold',
};

const BENGALI_FONT_SET = {
    sans: 'NotoSansBengali-Regular',
    sansMed: 'NotoSansBengali-SemiBold',
    sansSemi: 'NotoSansBengali-SemiBold',
    sansBold: 'NotoSansBengali-Bold',
    display: 'NotoSansBengali-Bold',
    mono: 'DMMono-Regular',
    branding: 'NotoSansBengali-Bold',
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

    // PERMANENT DIRECTIVE: English fonts must strictly use Hind typeface family at 1.0x scale.
    // Dedicated Google Noto Sans fonts for Telugu, Tamil, and Bengali eliminate all matra clipping and missing weights.
    const fontSet = useMemo(() => {
        if (language === 'Te') {
            return TELUGU_FONT_SET;
        }
        if (language === 'Ta') {
            return TAMIL_FONT_SET;
        }
        if (language === 'Bn') {
            return BENGALI_FONT_SET;
        }
        // English (En), Hindi (Hi), and Marathi (Mr) use Hind
        return HIND_FONT_SET;
    }, [language]);

    return useMemo<ThemeValue>(() => ({
        colors,
        ...sharedTokens,
        font: fontSet as any,
        isDark,
        fontSize: 1.0,
        hitSlop: {
            top: largeTouch ? 14 : 8,
            bottom: largeTouch ? 14 : 8,
            left: largeTouch ? 4 : 2,
            right: largeTouch ? 4 : 2,
        },
    }), [colors, fontSet, isDark, largeTouch]);
};
