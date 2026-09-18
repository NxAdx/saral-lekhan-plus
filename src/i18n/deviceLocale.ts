import { Platform, NativeModules } from 'react-native';
import { AppLanguage } from '../store/settingsStore';

/**
 * Detects the device's native system language on first launch.
 * Uses ECMA-402 Intl (native Hermes) with NativeModules.I18nManager fallback.
 */
export function getDeviceDefaultLanguage(): AppLanguage {
  try {
    let localeTag = '';

    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      localeTag = Intl.DateTimeFormat().resolvedOptions().locale;
    }

    if (!localeTag && Platform.OS === 'android') {
      localeTag = NativeModules.I18nManager?.localeIdentifier || '';
    }

    const clean = (localeTag || '').toLowerCase().replace('_', '-');
    const langPrefix = clean.split('-')[0];

    switch (langPrefix) {
      case 'hi':
        return 'Hi';
      case 'mr':
        return 'Mr';
      case 'bn':
        return 'Bn';
      case 'te':
        return 'Te';
      case 'ta':
        return 'Ta';
      case 'en':
      default:
        return 'En';
    }
  } catch (_e) {
    return 'Hi'; // Default Indian language preference for Saral Lekhan
  }
}
