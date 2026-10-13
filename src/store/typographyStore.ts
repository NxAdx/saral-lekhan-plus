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
        // PERMANENT DIRECTIVE: English fonts locked at 1.0x permanently (Rule 3 invariant).
        const scale = fontSize || 1.0;
        const isIndic = language !== 'En';

        const displayLargeSize = Math.round(sharedTokens.typography.displayLarge.size * scale);
        const headlineLargeSize = Math.round(sharedTokens.typography.headlineLarge.size * scale);
        const titleLargeSize = Math.round(sharedTokens.typography.titleLarge.size * scale);
        const bodyLargeSize = Math.round(sharedTokens.typography.bodyLarge.size * scale);
        const labelMediumSize = Math.round(sharedTokens.typography.labelMedium.size * scale);
        // Ensure complex Indic ligatures do not collapse into unreadable sub-12px blobs
        const bodySmallSize = isIndic ? Math.max(12, Math.round(11 * scale)) : Math.round(11 * scale);
        const labelSmallSize = isIndic ? Math.max(12, Math.round(10 * scale)) : Math.round(10 * scale);

        // Indic scripts (Telugu, Tamil, Bengali, Hindi, Marathi) contain above-base matras
        // and below-base viramas/vothulu. Generous line-height prevents vertical clipping.
        const lhDisplay = isIndic ? 1.45 : 1.35;
        const lhHeadline = isIndic ? 1.50 : 1.40;
        const lhTitle = isIndic ? 1.55 : 1.45;
        const lhBody = isIndic ? 1.60 : 1.50;
        const lhLabel = isIndic ? 1.55 : 1.45;
        const lhSmall = isIndic ? 1.55 : 1.45;

        return {
            displayLarge: {
                fontSize: displayLargeSize,
                lineHeight: Math.round(displayLargeSize * lhDisplay),
                fontWeight: '700' as const,
            },
            headlineLarge: {
                fontSize: headlineLargeSize,
                lineHeight: Math.round(headlineLargeSize * lhHeadline),
                fontWeight: '700' as const,
            },
            titleLarge: {
                fontSize: titleLargeSize,
                lineHeight: Math.round(titleLargeSize * lhTitle),
                fontWeight: '600' as const,
            },
            bodyLarge: {
                fontSize: bodyLargeSize,
                lineHeight: Math.round(bodyLargeSize * lhBody),
                fontWeight: '400' as const,
            },
            labelMedium: {
                fontSize: labelMediumSize,
                lineHeight: Math.round(labelMediumSize * lhLabel),
                fontWeight: '600' as const,
            },
            bodySmall: {
                fontSize: bodySmallSize,
                lineHeight: Math.round(bodySmallSize * lhSmall),
                fontWeight: '400' as const,
            },
            labelSmall: {
                fontSize: labelSmallSize,
                lineHeight: Math.round(labelSmallSize * lhSmall),
                fontWeight: '600' as const,
            }
        };
    }, [fontSize, language]);

    return type;
};
