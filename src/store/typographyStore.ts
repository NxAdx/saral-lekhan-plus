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
        // PERMANENT DIRECTIVE: Font scale is locked at 1.0x permanently across all languages.
        // No artificial script reduction so the display size and layout remain 100% stable.
        const scale = fontSize || 1.0;

        const displayLargeSize = Math.round(sharedTokens.typography.displayLarge.size * scale);
        const headlineLargeSize = Math.round(sharedTokens.typography.headlineLarge.size * scale);
        const titleLargeSize = Math.round(sharedTokens.typography.titleLarge.size * scale);
        const bodyLargeSize = Math.round(sharedTokens.typography.bodyLarge.size * scale);
        const labelMediumSize = Math.round(sharedTokens.typography.labelMedium.size * scale);
        const bodySmallSize = Math.round(11 * scale);
        const labelSmallSize = Math.round(10 * scale);

        return {
            displayLarge: {
                fontSize: displayLargeSize,
                lineHeight: Math.round(displayLargeSize * 1.35),
                fontWeight: '700' as const,
            },
            headlineLarge: {
                fontSize: headlineLargeSize,
                lineHeight: Math.round(headlineLargeSize * 1.40),
                fontWeight: '700' as const,
            },
            titleLarge: {
                fontSize: titleLargeSize,
                lineHeight: Math.round(titleLargeSize * 1.45),
                fontWeight: '600' as const,
            },
            bodyLarge: {
                fontSize: bodyLargeSize,
                lineHeight: Math.round(bodyLargeSize * 1.50),
                fontWeight: '400' as const,
            },
            labelMedium: {
                fontSize: labelMediumSize,
                lineHeight: Math.round(labelMediumSize * 1.45),
                fontWeight: '600' as const,
            },
            bodySmall: {
                fontSize: bodySmallSize,
                lineHeight: Math.round(bodySmallSize * 1.45),
                fontWeight: '400' as const,
            },
            labelSmall: {
                fontSize: labelSmallSize,
                lineHeight: Math.round(labelSmallSize * 1.45),
                fontWeight: '600' as const,
            }
        };
    }, [fontSize]);

    return type;
};
