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

export const useTheme = () => {
    const systemColorScheme = useColorScheme();
    const { nightMode, themeId, highContrast, largeTouch } = useSettingsStore(
        (s) => ({
            nightMode: s.nightMode,
            themeId: s.themeId,
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

    // PERMANENT DIRECTIVE: English fonts must strictly use Hind typeface family at 1.0x scale.
    // Locking font tokens to HIND_FONT_SET eliminates all layout and screen jumps when switching languages.
    return useMemo<ThemeValue>(() => ({
        colors,
        ...sharedTokens,
        font: HIND_FONT_SET as any,
        isDark,
        fontSize: 1.0,
        hitSlop: {
            top: largeTouch ? 14 : 8,
            bottom: largeTouch ? 14 : 8,
            left: largeTouch ? 4 : 2,
            right: largeTouch ? 4 : 2,
        },
    }), [colors, isDark, largeTouch]);
};
