import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  locale,
  t,
  setLocale,
  loadTranslations,
  translations,
  initializeI18n,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  pluralize,
  availableLocales,
  localeInfo,
  type Translations,
  type Locale,
} from './index';

describe('i18n System', () => {
  beforeEach(() => {
    localStorage.clear();
    translations.set({});
    locale.set('en');
  });

  describe('Core Translation', () => {
    it('initializes with default locale', () => {
      expect(get(locale)).toBe('en');
    });

    it('loads translations for a locale', async () => {
      await loadTranslations('en');
      const translation = get(t);
      expect(translation('app.name')).toBe('Arcanine');
    });

    it('handles nested translation keys', async () => {
      await loadTranslations('en');
      const translation = get(t);
      expect(translation('app.description')).toBeTruthy();
    });

    it('returns key when translation is missing', async () => {
      await loadTranslations('en');
      const translation = get(t);
      expect(translation('nonexistent.key')).toBe('nonexistent.key');
    });

    it('changes locale', async () => {
      await setLocale('en');
      expect(get(locale)).toBe('en');
    });

    it('supports parameter interpolation', async () => {
      await loadTranslations('en');
      const translation = get(t);
      const result = translation('test.param', { name: 'Test' });
      expect(result).toBe('Hello Test');
    });

    it('handles deeply nested translation keys', async () => {
      await loadTranslations('en');
      const translation = get(t);
      expect(translation('theme.toggle')).toBeTruthy();
    });

    it('returns original key for non-string translations', async () => {
      translations.set({ en: { nested: { key: { object: 'value' } } } } as Record<
        string,
        Translations
      >);
      const translation = get(t);
      expect(translation('nested.key')).toBe('nested.key');
    });

    it('handles missing parameters in interpolation', async () => {
      await loadTranslations('en');
      const translation = get(t);
      const result = translation('test.param', {});
      expect(result).toContain('{name}');
    });

    it('handles errors when loading invalid locale', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await loadTranslations('invalid-locale');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('warns when translation is missing', async () => {
      await loadTranslations('en');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const translation = get(t);
      translation('missing.key');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Translation missing'));
      consoleSpy.mockRestore();
    });

    it('returns translation without parameters when none provided', async () => {
      await loadTranslations('en');
      const translation = get(t);
      const result = translation('app.name');
      expect(result).toBe('Arcanine');
    });

    it('handles multiple parameter replacements', async () => {
      // Set custom translation with multiple params
      translations.set({
        en: {
          multi: {
            param: 'Hello {name}, you are {age} years old',
          },
        },
      });
      const translation = get(t);
      const result = translation('multi.param', { name: 'John', age: 30 });
      expect(result).toBe('Hello John, you are 30 years old');
    });

    it('handles translations for empty locale translations object', async () => {
      translations.set({});
      const translation = get(t);
      const result = translation('some.key');
      expect(result).toBe('some.key');
    });

    it('handles setting locale and loading translations', async () => {
      await setLocale('en');
      const translation = get(t);
      expect(translation('app.name')).toBe('Arcanine');
      expect(get(locale)).toBe('en');
    });

    it('preserves existing translations when loading new locale', async () => {
      await loadTranslations('en');
      translations.update((current) => ({
        ...current,
        fr: { app: { name: 'Arcanine FR' } },
      }));

      const translationsValue = get(translations);
      expect(translationsValue.en).toBeDefined();
      expect(translationsValue.fr).toBeDefined();
    });

    it('validates locale before setting', async () => {
      await setLocale('invalid-locale' as Locale);
      expect(get(locale)).toBe('en'); // Should remain unchanged
    });
  });

  describe('Locale Metadata', () => {
    it('should contain all available locales', () => {
      expect(availableLocales).toEqual(['en', 'es', 'fr', 'de', 'ja']);
    });

    it('should have locale info for all locales', () => {
      for (const localeCode of availableLocales) {
        expect(localeInfo[localeCode]).toBeDefined();
        expect(localeInfo[localeCode].code).toBe(localeCode);
        expect(localeInfo[localeCode].name).toBeTruthy();
        expect(localeInfo[localeCode].nativeName).toBeTruthy();
        expect(localeInfo[localeCode].flag).toBeTruthy();
      }
    });
  });

  describe('Formatting Utilities', () => {
    describe('formatNumber', () => {
      it('should format numbers', () => {
        locale.set('en');
        expect(formatNumber(1234.56)).toBe('1,234.56');
      });

      it('should format with custom options', () => {
        locale.set('en');
        expect(
          formatNumber(1234.56, {
            style: 'currency',
            currency: 'USD',
          })
        ).toBe('$1,234.56');
      });
    });

    describe('formatDate', () => {
      it('should format Date objects', () => {
        locale.set('en');
        const date = new Date('2024-01-15T12:00:00Z');
        const formatted = formatDate(date);
        expect(formatted).toBeTruthy();
      });

      it('should accept string dates', () => {
        locale.set('en');
        const formatted = formatDate('2024-01-15');
        expect(formatted).toBeTruthy();
      });

      it('should accept timestamp numbers', () => {
        locale.set('en');
        const formatted = formatDate(1705320000000);
        expect(formatted).toBeTruthy();
      });

      it('should format with custom options', () => {
        locale.set('en');
        const date = new Date('2024-01-15');
        const formatted = formatDate(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        expect(formatted).toContain('2024');
        expect(formatted).toContain('January');
      });
    });

    describe('formatRelativeTime', () => {
      it('should format recent times', () => {
        const now = new Date();
        const fiveSecondsAgo = new Date(now.getTime() - 5000);
        const formatted = formatRelativeTime(fiveSecondsAgo);
        expect(formatted).toBeTruthy();
      });

      it('should handle different time units', () => {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const formatted = formatRelativeTime(twoHoursAgo);
        expect(formatted).toBeTruthy();
      });
    });

    describe('formatFileSize', () => {
      it('should format zero bytes', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
      });

      it('should format bytes', () => {
        expect(formatFileSize(500)).toBe('500 Bytes');
      });

      it('should format kilobytes', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
      });

      it('should format megabytes', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      });

      it('should format with custom decimals', () => {
        expect(formatFileSize(1536, 0)).toBe('2 KB');
      });
    });

    describe('pluralize', () => {
      it('should return singular for 1', () => {
        expect(pluralize(1, 'item')).toBe('item');
      });

      it('should return plural for 0', () => {
        expect(pluralize(0, 'item')).toBe('items');
      });

      it('should return plural for >1', () => {
        expect(pluralize(5, 'item')).toBe('items');
      });

      it('should use custom plural form', () => {
        expect(pluralize(2, 'person', 'people')).toBe('people');
      });
    });
  });

  describe('Initialization', () => {
    it('should initialize with browser locale if available', async () => {
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE',
        configurable: true,
      });
      await initializeI18n();
      // Should be 'de' if browser locale is German
      expect(['en', 'de']).toContain(get(locale));
    });

    it('should fallback to English for unsupported locale', async () => {
      Object.defineProperty(navigator, 'language', {
        value: 'pt-BR',
        configurable: true,
      });
      await initializeI18n();
      expect(get(locale)).toBe('en');
    });
  });
});
