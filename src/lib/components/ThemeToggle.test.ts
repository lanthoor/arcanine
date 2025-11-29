import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import ThemeToggle from './ThemeToggle.svelte';
import { theme, applyTheme } from '$lib/stores/theme';
import { loadTranslations } from '$lib/i18n';

describe('ThemeToggle', () => {
  beforeEach(async () => {
    localStorage.clear();
    theme.set('light');
    document.documentElement.className = '';
    await loadTranslations('en');
  });

  it('exports component correctly', () => {
    expect(ThemeToggle).toBeDefined();
    expect(typeof ThemeToggle).toBe('function');
  });

  it('component has expected structure', () => {
    expect(ThemeToggle.name).toBeTruthy();
  });

  it('theme can be toggled programmatically', () => {
    expect(get(theme)).toBe('light');
    theme.set('dark');
    expect(get(theme)).toBe('dark');
    theme.set('light');
    expect(get(theme)).toBe('light');
  });

  it('theme applies to document when changed', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
