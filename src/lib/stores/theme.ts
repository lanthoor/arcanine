import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'arcanine-theme';

// Detect system preference
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Load saved theme or use system preference
const savedTheme =
  typeof window !== 'undefined'
    ? (localStorage.getItem(STORAGE_KEY) as Theme) || getSystemTheme()
    : 'light';

export const theme: Writable<Theme> = writable(savedTheme);

// Apply theme to document
export function applyTheme(newTheme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (newTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, newTheme);
}

// Toggle theme
export function toggleTheme(): void {
  theme.update((current) => {
    const newTheme = current === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    return newTheme;
  });
}

// Initialize theme on app load
export function initializeTheme(): void {
  if (typeof window === 'undefined') return;

  // Apply saved theme immediately
  applyTheme(savedTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const systemTheme = e.matches ? 'dark' : 'light';
    // Only update if user hasn't manually set a preference
    if (!localStorage.getItem(STORAGE_KEY)) {
      theme.set(systemTheme);
      applyTheme(systemTheme);
    }
  });
}
