import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// UI state store for sidebar and layout
interface UIState {
  sidebarCollapsed: boolean;
  layoutOrientation: 'horizontal' | 'vertical';
}

const STORAGE_KEY = 'arcanine-ui-state';

// Export helpers for testing
export const loadFromStorage = (): UIState | null => {
  if (!browser) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveToStorage = (state: UIState): void => {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently fail if localStorage is not available
  }
};

function createUIStore() {
  const initial: UIState = loadFromStorage() || {
    sidebarCollapsed: false,
    layoutOrientation: 'vertical',
  };

  const { subscribe, update } = writable<UIState>(initial);

  return {
    subscribe,
    toggleSidebar: () => {
      update((state) => {
        const newState = { ...state, sidebarCollapsed: !state.sidebarCollapsed };
        saveToStorage(newState);
        return newState;
      });
    },
    toggleLayout: () => {
      update((state) => {
        const newState = {
          ...state,
          layoutOrientation: state.layoutOrientation === 'horizontal' ? 'vertical' : 'horizontal',
        } as UIState;
        saveToStorage(newState);
        return newState;
      });
    },
  };
}

export const uiStore = createUIStore();
