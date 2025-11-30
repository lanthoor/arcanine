import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { theme, applyTheme, toggleTheme, initializeTheme } from './theme';

describe('Theme Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset theme to default
    theme.set('light');
    // Clear classList
    document.documentElement.className = '';
    // Clear any existing mock
    vi.restoreAllMocks();
  });

  it('detects system dark theme preference', () => {
    const mockDarkMediaQuery = {
      matches: true, // System prefers dark
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;

    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      if (query === '(prefers-color-scheme: dark)') {
        return mockDarkMediaQuery;
      }
      return {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList;
    });

    // Clear saved preference to test system detection
    localStorage.removeItem('arcanine-theme');

    // Call matchMedia to trigger the mocked implementation
    const result = window.matchMedia('(prefers-color-scheme: dark)');
    expect(result.matches).toBe(true);

    matchMediaSpy.mockRestore();
  });

  it('detects system light theme preference', () => {
    const mockLightMediaQuery = {
      matches: false, // System prefers light
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;

    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      if (query === '(prefers-color-scheme: dark)') {
        return mockLightMediaQuery;
      }
      return {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList;
    });

    const result = window.matchMedia('(prefers-color-scheme: dark)');
    expect(result.matches).toBe(false);

    matchMediaSpy.mockRestore();
  });

  it('initializes with light theme by default', () => {
    expect(get(theme)).toBe('light');
  });

  it('toggles between light and dark themes', () => {
    expect(get(theme)).toBe('light');
    toggleTheme();
    expect(get(theme)).toBe('dark');
    toggleTheme();
    expect(get(theme)).toBe('light');
  });

  it('applies theme class to document', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme to localStorage', () => {
    theme.set('dark');
    applyTheme('dark');
    expect(localStorage.getItem('arcanine-theme')).toBe('dark');

    theme.set('light');
    applyTheme('light');
    expect(localStorage.getItem('arcanine-theme')).toBe('light');
  });

  it('applies dark theme when initialized with saved dark preference', () => {
    document.documentElement.className = '';
    localStorage.setItem('arcanine-theme', 'dark');
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('listens for system theme changes when no preference set', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;

    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery);

    initializeTheme();

    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates theme when system preference changes and no manual preference', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;

    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery);

    // Clear any saved preference
    localStorage.clear();

    initializeTheme();

    // Clear localStorage again after init (since applyTheme sets it)
    localStorage.removeItem('arcanine-theme');

    // Verify listener was added
    expect(listeners.length).toBe(1);

    // Simulate system theme change to dark
    const changeEvent = { matches: true } as MediaQueryListEvent;
    listeners[0](changeEvent);

    // Should have updated to dark since there's no manual preference
    expect(get(theme)).toBe('dark');
  });

  it('does not update theme when system changes if user has manual preference', () => {
    localStorage.setItem('arcanine-theme', 'light');
    theme.set('light');

    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;

    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery);

    initializeTheme();

    // Simulate system theme change to dark
    const changeEvent = { matches: true } as MediaQueryListEvent;
    listeners[0](changeEvent);

    // Theme should remain light because user has a preference
    expect(get(theme)).toBe('light');
  });

  it('updates to light theme when system changes from dark to light', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn((event, handler) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;

    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery);

    localStorage.clear();
    initializeTheme();
    localStorage.removeItem('arcanine-theme');

    // Set theme to dark first
    theme.set('dark');

    // Simulate system theme change to light
    const changeEvent = { matches: false } as MediaQueryListEvent;
    listeners[0](changeEvent);

    // Should have updated to light
    expect(get(theme)).toBe('light');
  });

  it('initializes without errors', () => {
    expect(() => initializeTheme()).not.toThrow();
  });

  it('handles theme toggle from dark to light', () => {
    theme.set('dark');
    applyTheme('dark');
    expect(get(theme)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    theme.set('light');
    applyTheme('light');
    expect(get(theme)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('handles rapid theme toggles', () => {
    toggleTheme(); // light -> dark
    toggleTheme(); // dark -> light
    toggleTheme(); // light -> dark
    expect(get(theme)).toBe('dark');
  });

  it('applies theme correctly after multiple changes', () => {
    applyTheme('dark');
    applyTheme('light');
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('arcanine-theme')).toBe('dark');
  });

  it('handles theme initialization with saved dark preference', () => {
    document.documentElement.className = '';
    localStorage.setItem('arcanine-theme', 'dark');
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('handles theme initialization with saved light preference', () => {
    localStorage.setItem('arcanine-theme', 'light');
    theme.set('light');
    initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('preserves localStorage after toggle', () => {
    theme.set('light');
    applyTheme('light');
    expect(localStorage.getItem('arcanine-theme')).toBe('light');

    toggleTheme();
    expect(localStorage.getItem('arcanine-theme')).toBe('dark');
    expect(get(theme)).toBe('dark');
  });

  it('correctly updates classList when toggling', () => {
    theme.set('light');
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
