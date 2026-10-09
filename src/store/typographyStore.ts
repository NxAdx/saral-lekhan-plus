import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useSettingsStore } from '../store/settingsStore';
import { sharedTokens } from '../tokens';

export const useTypography = () => {
    const { fontSize, language } = useSettingsStore(
        (s) => ({ fontSize: s.fontSize, language: s.language }),
        shallow
    );

    const type = useMemo(() => {
        const baseMultiplier = fontSize || 1.0;
        // Indic scripts (Devanagari, Bengali, Telugu, Tamil) have an optical height ~15% larger than Latin.
        // Applying an optical balance scale of 0.925 aligns them with Latin visually so they never feel "too big".
        const scriptScale = language === 'En' ? 1.0 : 0.925;
        const scale = baseMultiplier * scriptScale;

        const displayLargeSize = Math.round(sharedTokens.typography.displayLarge.size * scale);
        const headlineLargeSize = Math.round(sharedTokens.typography.headlineLarge.size * scale);
        const titleLargeSize = Math.round(sharedTokens.typography.titleLarge.size * scale);
        const bodyLargeSize = Math.round(sharedTokens.typography.bodyLarge.size * scale);
        const labelMediumSize = Math.round(sharedTokens.typography.labelMedium.size * scale);
        const bodySmallSize = Math.round(11 * scale);
        const labelSmallSize = Math.round(10 * scale);

        // Indic scripts require generous line-height (1.48x - 1.55x) to prevent matras (vowel signs) from being sliced off.
        const lhRatio = language === 'En' ? 1.40 : 1.52;

        return {
            displayLarge: {
                fontSize: displayLargeSize,
                lineHeight: Math.round(displayLargeSize * (language === 'En' ? 1.25 : 1.42)),
                fontWeight: '700' as const,
            },
            headlineLarge: {
                fontSize: headlineLargeSize,
                lineHeight: Math.round(headlineLargeSize * (language === 'En' ? 1.30 : 1.45)),
                fontWeight: '700' as const,
            },
            titleLarge: {
                fontSize: titleLargeSize,
                lineHeight: Math.round(titleLargeSize * (language === 'En' ? 1.38 : 1.50)),
                fontWeight: '600' as const,
            },
            bodyLarge: {
                fontSize: bodyLargeSize,
                lineHeight: Math.round(bodyLargeSize * lhRatio),
                fontWeight: '400' as const,
            },
            labelMedium: {
                fontSize: labelMediumSize,
                lineHeight: Math.round(labelMediumSize * (language === 'En' ? 1.38 : 1.55)),
                fontWeight: '600' as const,
            },
            bodySmall: {
                fontSize: bodySmallSize,
                lineHeight: Math.round(bodySmallSize * (language === 'En' ? 1.40 : 1.50)),
                fontWeight: '400' as const,
            },
            labelSmall: {
                fontSize: labelSmallSize,
                lineHeight: Math.round(labelSmallSize * (language === 'En' ? 1.35 : 1.50)),
                fontWeight: '600' as const,
            }
        };
    }, [fontSize, language]);

    return type;
};
