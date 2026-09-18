import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
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
    hitSlop: number;
};

const HIND_FONT_SET = {
    sans: 'Hind',
    sansMed: 'Hind-Medium',
    sansSemi: 'Hind-SemiBold',
    sansBold: 'Hind-Bold',
    display: 'Hind-Bold',
    mono: 'Hind-Medium',
    branding: 'Hind-Bold',
};

export const useTheme = () => {
    const systemColorScheme = useColorScheme();
    const { nightMode, themeId, fontSize, highContrast, largeTouch } = useSettingsStore(
        (s) => ({
            nightMode: s.nightMode,
            themeId: s.themeId,
            fontSize: s.fontSize,
            highContrast: s.highContrast,
            largeTouch: s.largeTouch,
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

    return useMemo<ThemeValue>(() => ({
        colors,
        ...sharedTokens,
        font: HIND_FONT_SET,
        isDark,
        fontSize: fontSize || 1.0,
        hitSlop: largeTouch ? 24 : 10,
    }), [colors, isDark, fontSize, largeTouch]);
};
