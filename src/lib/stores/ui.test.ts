import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { uiStore } from './ui';

describe('UI Store', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };
  });

  describe('Store Structure', () => {
    it('should have sidebarCollapsed property', () => {
      const state = get(uiStore);
      expect(state).toHaveProperty('sidebarCollapsed');
      expect(typeof state.sidebarCollapsed).toBe('boolean');
    });

    it('should have layoutOrientation property', () => {
      const state = get(uiStore);
      expect(state).toHaveProperty('layoutOrientation');
      expect(['horizontal', 'vertical']).toContain(state.layoutOrientation);
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar state', () => {
      const initialState = get(uiStore);
      const wasCollapsed = initialState.sidebarCollapsed;

      uiStore.toggleSidebar();
      const newState = get(uiStore);

      expect(newState.sidebarCollapsed).toBe(!wasCollapsed);
    });

    it('should persist to localStorage', () => {
      uiStore.toggleSidebar();

      expect(localStorage.setItem).toHaveBeenCalledWith('arcanine-ui-state', expect.any(String));
    });

    it('should support multiple toggles', () => {
      const state1 = get(uiStore);
      uiStore.toggleSidebar();
      const state2 = get(uiStore);
      uiStore.toggleSidebar();
      const state3 = get(uiStore);

      expect(state2.sidebarCollapsed).toBe(!state1.sidebarCollapsed);
      expect(state3.sidebarCollapsed).toBe(state1.sidebarCollapsed);
    });

    it('should preserve layout orientation', () => {
      const initialLayout = get(uiStore).layoutOrientation;
      uiStore.toggleSidebar();
      const afterLayout = get(uiStore).layoutOrientation;

      expect(afterLayout).toBe(initialLayout);
    });
  });

  describe('toggleLayout', () => {
    it('should toggle layout orientation', () => {
      const initialState = get(uiStore);
      const wasVertical = initialState.layoutOrientation === 'vertical';

      uiStore.toggleLayout();
      const newState = get(uiStore);

      if (wasVertical) {
        expect(newState.layoutOrientation).toBe('horizontal');
      } else {
        expect(newState.layoutOrientation).toBe('vertical');
      }
    });

    it('should persist to localStorage', () => {
      uiStore.toggleLayout();

      expect(localStorage.setItem).toHaveBeenCalledWith('arcanine-ui-state', expect.any(String));
    });

    it('should support multiple toggles', () => {
      const state1 = get(uiStore);
      uiStore.toggleLayout();
      const state2 = get(uiStore);
      uiStore.toggleLayout();
      const state3 = get(uiStore);

      expect(state2.layoutOrientation).not.toBe(state1.layoutOrientation);
      expect(state3.layoutOrientation).toBe(state1.layoutOrientation);
    });

    it('should preserve sidebar state', () => {
      const initialSidebar = get(uiStore).sidebarCollapsed;
      uiStore.toggleLayout();
      const afterSidebar = get(uiStore).sidebarCollapsed;

      expect(afterSidebar).toBe(initialSidebar);
    });
  });

  describe('State Persistence', () => {
    it('should persist complete state', () => {
      uiStore.toggleSidebar();

      const setItemMock = localStorage.setItem as ReturnType<typeof vi.fn>;
      const lastCall = setItemMock.mock.calls[setItemMock.mock.calls.length - 1];
      const [key, value] = lastCall;

      expect(key).toBe('arcanine-ui-state');
      const parsed = JSON.parse(value);
      expect(parsed).toHaveProperty('sidebarCollapsed');
      expect(parsed).toHaveProperty('layoutOrientation');
    });

    it('should use correct localStorage key', () => {
      uiStore.toggleSidebar();

      expect(localStorage.setItem).toHaveBeenCalledWith('arcanine-ui-state', expect.any(String));
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers on sidebar toggle', () => {
      const states: Array<{ sidebarCollapsed: boolean; layoutOrientation: string }> = [];
      const unsubscribe = uiStore.subscribe((state) => {
        states.push({ ...state });
      });

      const initialLength = states.length;
      uiStore.toggleSidebar();

      expect(states.length).toBeGreaterThan(initialLength);
      unsubscribe();
    });

    it('should notify subscribers on layout toggle', () => {
      const states: Array<{ sidebarCollapsed: boolean; layoutOrientation: string }> = [];
      const unsubscribe = uiStore.subscribe((state) => {
        states.push({ ...state });
      });

      const initialLength = states.length;
      uiStore.toggleLayout();

      expect(states.length).toBeGreaterThan(initialLength);
      unsubscribe();
    });
  });

  describe('Combined Operations', () => {
    it('should handle both toggles independently', () => {
      const initial = get(uiStore);

      uiStore.toggleSidebar();
      const afterSidebar = get(uiStore);
      expect(afterSidebar.sidebarCollapsed).toBe(!initial.sidebarCollapsed);
      expect(afterSidebar.layoutOrientation).toBe(initial.layoutOrientation);

      uiStore.toggleLayout();
      const afterLayout = get(uiStore);
      expect(afterLayout.sidebarCollapsed).toBe(afterSidebar.sidebarCollapsed);
      expect(afterLayout.layoutOrientation).not.toBe(initial.layoutOrientation);
    });
  });
});
