import { useSettingsStore } from '../store/settingsStore';
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';

function deepFallback<T>(target: any, fallback: T): T {
    if (!target) return fallback;
    const result: any = Array.isArray(fallback) ? [...(target || fallback)] : { ...fallback, ...target };
    for (const key of Object.keys(fallback as any)) {
        const fallbackVal = (fallback as any)[key];
        const targetVal = target[key];
        if (
            fallbackVal &&
            typeof fallbackVal === 'object' &&
            !Array.isArray(fallbackVal)
        ) {
            result[key] = deepFallback(targetVal, fallbackVal);
        } else if (targetVal === undefined || targetVal === null || targetVal === '') {
            result[key] = fallbackVal;
        }
    }
    return result;
}

const resolvedTranslations: Record<string, any> = {
    En: en,
    Hi: deepFallback(hi, en),
    Bn: deepFallback(bn, en),
    Te: deepFallback(te, en),
    Mr: deepFallback(mr, en),
    Ta: deepFallback(ta, en),
};

export type AppStrings = typeof en;

/**
 * Mihon-style Scalable i18n System
 * All locales are pre-merged with the English baseline, ensuring 100% key coverage
 * with zero undefined lookups or runtime layout crashes across all 6 scripts.
 */
export const getStrings = (lang: string) => {
    return resolvedTranslations[lang] || resolvedTranslations.En;
};

// Hook for components to use strings reactively
export const useStrings = () => {
    const language = useSettingsStore((state) => state.language);
    return getStrings(language);
};

// Legacy support for direct import (will non-reactively use the current store value)
// Note: Using this outside of hooks/loops is preferred to minimize code changes.
export const strings = new Proxy({}, {
    get(_, prop) {
        const language = useSettingsStore.getState().language;
        const currentStrings = getStrings(language);
        return currentStrings[prop];
    }
}) as any;
