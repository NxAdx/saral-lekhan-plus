import { AppFontType, AppLanguage, normalizeAppFont } from '../store/settingsStore';

export const FONT_SCALES: Record<AppFontType, number> = {
    hind: 1.0,
    poppins: 1.0,
    notoSans: 1.0,
    baloo2: 1.0,
};

export function getEffectiveAppFont(appFont: string, _language?: AppLanguage): AppFontType {
    return normalizeAppFont(appFont);
}

export function resolveEffectiveAppFont(appFont: AppFontType, language?: AppLanguage): AppFontType {
    return getEffectiveAppFont(appFont, language);
}
