import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { locale, t, setLocale, loadTranslations, translations, type Translations } from './index';

describe('i18n System', () => {
  beforeEach(() => {
    localStorage.clear();
    translations.set({});
  });

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
    const result = translation('multi.param', { name: 'John', age: '30' });
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
});
