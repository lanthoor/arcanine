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

export const t: Readable<(key: string, params?: Record<string, string>) => string> = derived(
  [locale, translations],
  ([$locale, $translations]) => {
    return (key: string, params?: Record<string, string>): string => {
      const translation = getNestedTranslation($translations[$locale] || {}, key);

      if (!translation) {
        console.warn(`Translation missing for key: ${key} in locale: ${$locale}`);
        return key;
      }

      if (!params) return translation;

      // Replace parameters in the format {paramName}
      return translation.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] || match;
      });
    };
  }
);

export async function loadTranslations(localeCode: string): Promise<void> {
  try {
    const module = await import(`./locales/${localeCode}.json`);
    translations.update((current) => ({
      ...current,
      [localeCode]: module.default,
    }));
  } catch (error) {
    console.error(`Failed to load translations for locale: ${localeCode}`, error);
  }
}

export async function setLocale(localeCode: string): Promise<void> {
  await loadTranslations(localeCode);
  locale.set(localeCode);
}
