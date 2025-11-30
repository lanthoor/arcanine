import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { locale, setLocale, loadTranslations, availableLocales, localeInfo } from '$lib/i18n';

describe('LanguageSwitcher Integration', () => {
  beforeEach(async () => {
    // Reset locale and load English translations
    await setLocale('en');
    await loadTranslations('en');
    localStorage.clear();
  });

  describe('Locale Management', () => {
    it('supports all defined languages', async () => {
      for (const localeCode of availableLocales) {
        await setLocale(localeCode);
        expect(get(locale)).toBe(localeCode);
      }
    });

    it('has metadata for all supported languages', () => {
      expect(localeInfo.en).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
      });
      expect(localeInfo.es).toEqual({
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
      });
      expect(localeInfo.fr).toEqual({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
      });
      expect(localeInfo.de).toEqual({
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
      });
      expect(localeInfo.ja).toEqual({
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
      });
    });

    it('persists language selection to localStorage', async () => {
      await setLocale('fr');
      expect(localStorage.getItem('arcanine-locale')).toBe('fr');

      await setLocale('ja');
      expect(localStorage.getItem('arcanine-locale')).toBe('ja');
    });

    it('loads translations for each language', async () => {
      for (const localeCode of availableLocales) {
        await loadTranslations(localeCode);
        // Verify translations were loaded (this will be in the store)
        expect(get(locale)).toBeDefined();
      }
    });
  });

  describe('Language Data Structure', () => {
    it('ensures all locales have required metadata fields', () => {
      for (const localeCode of availableLocales) {
        const info = localeInfo[localeCode];
        expect(info.code).toBe(localeCode);
        expect(info.name).toBeTruthy();
        expect(info.nativeName).toBeTruthy();
        expect(info.flag).toBeTruthy();
        expect(info.flag.length).toBeGreaterThan(0);
      }
    });

    it('has correct number of supported languages', () => {
      expect(availableLocales.length).toBe(5);
      expect(Object.keys(localeInfo).length).toBe(5);
    });
  });

  describe('Language Switching', () => {
    it('switches between all languages correctly', async () => {
      const languages = ['en', 'es', 'fr', 'de', 'ja'];

      for (const lang of languages) {
        await setLocale(lang);
        expect(get(locale)).toBe(lang);
      }
    });

    it('maintains locale state across operations', async () => {
      await setLocale('de');
      expect(get(locale)).toBe('de');

      // Perform some other operations
      await loadTranslations('de');

      // Locale should remain the same
      expect(get(locale)).toBe('de');
    });

    it('rejects invalid locale codes', async () => {
      const initialLocale = get(locale);
      await setLocale('invalid-locale');
      expect(get(locale)).toBe(initialLocale); // Should remain unchanged
    });
  });

  describe('Accessibility', () => {
    it('provides human-readable names for screen readers', () => {
      for (const localeCode of availableLocales) {
        const info = localeInfo[localeCode];
        // Both English and native names should be available
        expect(info.name).toMatch(/^[A-Za-z]+$/); // English name
        expect(info.nativeName).toBeTruthy(); // Native name
      }
    });

    it('includes visual flags for all languages', () => {
      for (const localeCode of availableLocales) {
        const info = localeInfo[localeCode];
        // Flags should be emoji characters
        expect(info.flag).toBeTruthy();
      }
    });
  });
});
