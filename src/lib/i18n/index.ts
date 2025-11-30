import { derived, writable } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';

export interface Translations {
  [key: string]: string | Translations;
}

export interface I18nStore {
  locale: Writable<string>;
  translations: Writable<Record<string, Translations>>;
  t: Readable<(key: string, params?: Record<string, string>) => string>;
}

// Available locales
export const availableLocales = ['en', 'es', 'fr', 'de', 'ja'] as const;
export type Locale = (typeof availableLocales)[number];

// Locale metadata
export type LocaleInfo = {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
};

export const localeInfo: Record<Locale, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
};

const STORAGE_KEY = 'arcanine-locale';

// Load saved locale or default to 'en'
const savedLocale =
  typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || 'en' : 'en';

export const locale: Writable<string> = writable(savedLocale);
export const translations: Writable<Record<string, Translations>> = writable({});

// Subscribe to locale changes and save to localStorage
if (typeof window !== 'undefined') {
  locale.subscribe((value) => {
    localStorage.setItem(STORAGE_KEY, value);
  });
}

function getNestedTranslation(obj: Translations, path: string): string | undefined {
  const keys = path.split('.');
  let current: string | Translations = obj;

  for (const key of keys) {
    if (typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export const t: Readable<(key: string, params?: Record<string, string | number>) => string> =
  derived([locale, translations], ([$locale, $translations]) => {
    return (key: string, params?: Record<string, string | number>): string => {
      const translation = getNestedTranslation($translations[$locale] || {}, key);

      if (!translation) {
        console.warn(`Translation missing for key: ${key} in locale: ${$locale}`);
        return key;
      }

      if (!params) return translation;

      // Replace parameters in the format {paramName}
      return translation.replace(/\{(\w+)\}/g, (match, paramName) => {
        const value = params[paramName];
        return value !== undefined ? String(value) : match;
      });
    };
  });

export async function loadTranslations(localeCode: string): Promise<void> {
  try {
    const module = await import(`./locales/${localeCode}.json`);
    translations.update((current) => ({
      ...current,
      [localeCode]: module.default,
    }));
  } catch (error) {
    console.error(`Failed to load translations for locale: ${localeCode}`, error);
    // Fallback to English if loading fails and not already English
    if (localeCode !== 'en') {
      await loadTranslations('en');
    }
  }
}

export async function setLocale(localeCode: string): Promise<void> {
  if (availableLocales.includes(localeCode as Locale)) {
    await loadTranslations(localeCode);
    locale.set(localeCode);
  }
}

/**
 * Initialize i18n with saved locale or browser language
 */
export async function initializeI18n(): Promise<void> {
  const browserLocale = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
  const initialLocale =
    savedLocale || (availableLocales.includes(browserLocale as Locale) ? browserLocale : 'en');

  await setLocale(initialLocale);
}

/**
 * Format a number according to the current locale
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  let currentLocale = 'en';
  const unsubscribe = locale.subscribe((l) => (currentLocale = l));
  unsubscribe();
  return new Intl.NumberFormat(currentLocale, options).format(value);
}

/**
 * Format a date according to the current locale
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  let currentLocale = 'en';
  const unsubscribe = locale.subscribe((l) => (currentLocale = l));
  unsubscribe();
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(currentLocale, options).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  let currentLocale = 'en';
  const unsubscribe = locale.subscribe((l) => (currentLocale = l));
  unsubscribe();

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });

  if (diffDay > 0) {
    return rtf.format(-diffDay, 'day');
  } else if (diffHour > 0) {
    return rtf.format(-diffHour, 'hour');
  } else if (diffMin > 0) {
    return rtf.format(-diffMin, 'minute');
  } else {
    return rtf.format(-diffSec, 'second');
  }
}

/**
 * Format file size in a human-readable format
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Simple pluralization helper
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}
