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

        const displayLargeSize = sharedTokens.typography.displayLarge.size * baseMultiplier;
        const headlineLargeSize = sharedTokens.typography.headlineLarge.size * baseMultiplier;
        const titleLargeSize = sharedTokens.typography.titleLarge.size * baseMultiplier;
        const bodyLargeSize = sharedTokens.typography.bodyLarge.size * baseMultiplier;
        const labelMediumSize = sharedTokens.typography.labelMedium.size * baseMultiplier;
        const bodySmallSize = 11 * baseMultiplier;
        const labelSmallSize = 10 * baseMultiplier;

        return {
            displayLarge: {
                fontSize: displayLargeSize,
                lineHeight: Math.round(displayLargeSize * 1.25),
                fontWeight: '700' as const,
            },
            headlineLarge: {
                fontSize: headlineLargeSize,
                lineHeight: Math.round(headlineLargeSize * 1.3),
                fontWeight: '700' as const,
            },
            titleLarge: {
                fontSize: titleLargeSize,
                lineHeight: Math.round(titleLargeSize * 1.35),
                fontWeight: '600' as const,
            },
            bodyLarge: {
                fontSize: bodyLargeSize,
                lineHeight: Math.round(bodyLargeSize * 1.45),
                fontWeight: '400' as const,
            },
            labelMedium: {
                fontSize: labelMediumSize,
                lineHeight: Math.round(labelMediumSize * 1.35),
                fontWeight: '600' as const,
            },
            bodySmall: {
                fontSize: bodySmallSize,
                lineHeight: Math.round(bodySmallSize * 1.4),
                fontWeight: '400' as const,
            },
            labelSmall: {
                fontSize: labelSmallSize,
                lineHeight: Math.round(labelSmallSize * 1.35),
                fontWeight: '600' as const,
            }
        };
    }, [fontSize]);

    return type;
};
