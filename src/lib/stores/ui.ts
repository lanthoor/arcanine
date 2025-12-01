import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// UI state store for sidebar and layout
interface UIState {
  sidebarCollapsed: boolean;
  layoutOrientation: 'horizontal' | 'vertical';
}

const STORAGE_KEY = 'arcanine-ui-state';

function createUIStore() {
  // Load from localStorage if in browser
  const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
  const initial: UIState = stored
    ? JSON.parse(stored)
    : {
        sidebarCollapsed: false,
        layoutOrientation: 'vertical',
      };

  const { subscribe, update } = writable<UIState>(initial);

  return {
    subscribe,
    toggleSidebar: () => {
      update((state) => {
        const newState = { ...state, sidebarCollapsed: !state.sidebarCollapsed };
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
        return newState;
      });
    },
    toggleLayout: () => {
      update((state) => {
        const newState = {
          ...state,
          layoutOrientation: state.layoutOrientation === 'horizontal' ? 'vertical' : 'horizontal',
        } as UIState;
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
        return newState;
      });
    },
  };
}

export const uiStore = createUIStore();
