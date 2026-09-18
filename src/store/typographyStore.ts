import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useSettingsStore } from '../store/settingsStore';
import { sharedTokens } from '../tokens';

export const useTypography = () => {
    const { fontSize } = useSettingsStore(
        (s) => ({ fontSize: s.fontSize }),
        shallow
    );

    const type = useMemo(() => {
        const baseMultiplier = fontSize || 1.0;

        return {
            displayLarge: {
                fontSize: sharedTokens.typography.displayLarge.size * baseMultiplier,
                fontWeight: sharedTokens.typography.headlineLarge.weight as any,
                includeFontPadding: false,
            },
            headlineLarge: {
                fontSize: sharedTokens.typography.headlineLarge.size * baseMultiplier,
                fontWeight: sharedTokens.typography.headlineLarge.weight as any,
                includeFontPadding: false,
            },
            titleLarge: {
                fontSize: sharedTokens.typography.titleLarge.size * baseMultiplier,
                fontWeight: sharedTokens.typography.titleLarge.weight as any,
                includeFontPadding: false,
            },
            bodyLarge: {
                fontSize: sharedTokens.typography.bodyLarge.size * baseMultiplier,
                fontWeight: sharedTokens.typography.bodyLarge.weight as any,
                includeFontPadding: false,
            },
            labelMedium: {
                fontSize: sharedTokens.typography.labelMedium.size * baseMultiplier,
                fontWeight: sharedTokens.typography.labelMedium.weight as any,
                includeFontPadding: false,
            },
            bodySmall: {
                fontSize: 11 * baseMultiplier,
                fontWeight: '400' as any,
                includeFontPadding: false,
            },
            labelSmall: {
                fontSize: 10 * baseMultiplier,
                fontWeight: '500' as any,
                includeFontPadding: false,
            }
        };
    }, [fontSize]);

    return type;
};
