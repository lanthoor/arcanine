import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { tabStore } from './tabs';

describe('Tabs Store', () => {
  beforeEach(() => {
    // Reset store to initial state by clearing all tabs
    const state = get(tabStore);
    state.tabs.forEach((tab) => {
      tabStore.closeTab(tab.id);
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty tabs array', () => {
      const state = get(tabStore);
      expect(state.tabs).toEqual([]);
    });

    it('should initialize with null activeTabId', () => {
      const state = get(tabStore);
      expect(state.activeTabId).toBeNull();
    });
  });

  describe('openTab', () => {
    it('should create a new tab with unique id', () => {
      tabStore.openTab('request-1', 'Get Users');
      const state = get(tabStore);

      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].id).toMatch(/^tab-\d+-[a-z0-9]+$/);
      expect(state.tabs[0].requestId).toBe('request-1');
      expect(state.tabs[0].name).toBe('Get Users');
    });

    it('should set the newly created tab as active', () => {
      tabStore.openTab('request-1', 'Get Users');
      const state = get(tabStore);

      expect(state.activeTabId).toBe(state.tabs[0].id);
    });

    it('should not create duplicate tab for same request', () => {
      tabStore.openTab('request-1', 'Get Users');
      const stateAfterFirst = get(tabStore);
      const firstTabId = stateAfterFirst.tabs[0].id;

      tabStore.openTab('request-1', 'Get Users');
      const stateAfterSecond = get(tabStore);

      expect(stateAfterSecond.tabs).toHaveLength(1);
      expect(stateAfterSecond.tabs[0].id).toBe(firstTabId);
      expect(stateAfterSecond.activeTabId).toBe(firstTabId);
    });

    it('should switch to existing tab if request already has a tab', () => {
      tabStore.openTab('request-1', 'Get Users');
      tabStore.openTab('request-2', 'Create User');

      const beforeSwitch = get(tabStore);
      const firstTabId = beforeSwitch.tabs[0].id;

      tabStore.openTab('request-1', 'Get Users');
      const afterSwitch = get(tabStore);

      expect(afterSwitch.tabs).toHaveLength(2);
      expect(afterSwitch.activeTabId).toBe(firstTabId);
    });

    it('should create multiple tabs for different requests', () => {
      tabStore.openTab('request-1', 'Get Users');
      tabStore.openTab('request-2', 'Create User');
      tabStore.openTab('request-3', 'Delete User');

      const state = get(tabStore);
      expect(state.tabs).toHaveLength(3);
      expect(state.tabs[0].requestId).toBe('request-1');
      expect(state.tabs[1].requestId).toBe('request-2');
      expect(state.tabs[2].requestId).toBe('request-3');
    });

    it('should generate unique tab IDs for each tab', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      const state = get(tabStore);
      const ids = state.tabs.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('closeTab', () => {
    it('should remove the specified tab', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');

      const beforeClose = get(tabStore);
      const tabIdToClose = beforeClose.tabs[0].id;

      tabStore.closeTab(tabIdToClose);
      const afterClose = get(tabStore);

      expect(afterClose.tabs).toHaveLength(1);
      expect(afterClose.tabs.find((t) => t.id === tabIdToClose)).toBeUndefined();
    });

    it('should switch to next tab when closing active tab', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      const beforeClose = get(tabStore);
      const firstTabId = beforeClose.tabs[0].id;
      const secondTabId = beforeClose.tabs[1].id;

      tabStore.setActiveTab(firstTabId);
      tabStore.closeTab(firstTabId);

      const afterClose = get(tabStore);
      expect(afterClose.activeTabId).toBe(secondTabId);
    });

    it('should switch to previous tab when closing last tab', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      const beforeClose = get(tabStore);
      const secondTabId = beforeClose.tabs[1].id;
      const lastTabId = beforeClose.tabs[2].id;

      tabStore.setActiveTab(lastTabId);
      tabStore.closeTab(lastTabId);

      const afterClose = get(tabStore);
      expect(afterClose.activeTabId).toBe(secondTabId);
    });

    it('should set activeTabId to null when closing the last remaining tab', () => {
      tabStore.openTab('request-1', 'Tab 1');

      const state = get(tabStore);
      tabStore.closeTab(state.tabs[0].id);

      const afterClose = get(tabStore);
      expect(afterClose.tabs).toHaveLength(0);
      expect(afterClose.activeTabId).toBeNull();
    });

    it('should not change activeTabId when closing non-active tab', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      const beforeClose = get(tabStore);
      const secondTabId = beforeClose.tabs[1].id;
      const thirdTabId = beforeClose.tabs[2].id;

      tabStore.setActiveTab(thirdTabId);
      tabStore.closeTab(secondTabId);

      const afterClose = get(tabStore);
      expect(afterClose.activeTabId).toBe(thirdTabId);
    });

    it('should handle closing non-existent tab gracefully', () => {
      tabStore.openTab('request-1', 'Tab 1');

      const beforeClose = get(tabStore);
      tabStore.closeTab('non-existent-tab-id');
      const afterClose = get(tabStore);

      expect(afterClose.tabs).toHaveLength(beforeClose.tabs.length);
    });

    it('should handle edge case when closing tab at boundary index', () => {
      // Create exactly 2 tabs and close the first one to test index boundary
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');

      const state = get(tabStore);
      const firstTabId = state.tabs[0].id;
      const secondTabId = state.tabs[1].id;

      // Set first tab as active and close it
      tabStore.setActiveTab(firstTabId);
      tabStore.closeTab(firstTabId);

      const afterClose = get(tabStore);
      expect(afterClose.tabs).toHaveLength(1);
      expect(afterClose.activeTabId).toBe(secondTabId);
    });
  });
  describe('setActiveTab', () => {
    it('should set the specified tab as active', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');

      const state = get(tabStore);
      const secondTabId = state.tabs[1].id;

      tabStore.setActiveTab(secondTabId);
      const afterSet = get(tabStore);

      expect(afterSet.activeTabId).toBe(secondTabId);
    });

    it('should switch between tabs correctly', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      const state = get(tabStore);
      const [tab1, tab2, tab3] = state.tabs;

      tabStore.setActiveTab(tab1.id);
      expect(get(tabStore).activeTabId).toBe(tab1.id);

      tabStore.setActiveTab(tab3.id);
      expect(get(tabStore).activeTabId).toBe(tab3.id);

      tabStore.setActiveTab(tab2.id);
      expect(get(tabStore).activeTabId).toBe(tab2.id);
    });

    it('should not modify tabs array when setting active tab', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');

      const beforeSet = get(tabStore);
      const tabsBeforeSet = [...beforeSet.tabs];

      tabStore.setActiveTab(beforeSet.tabs[1].id);
      const afterSet = get(tabStore);

      expect(afterSet.tabs).toEqual(tabsBeforeSet);
    });
  });

  describe('updateTabName', () => {
    it('should update the name of the tab with matching requestId', () => {
      tabStore.openTab('request-1', 'Original Name');

      tabStore.updateTabName('request-1', 'Updated Name');
      const state = get(tabStore);

      expect(state.tabs[0].name).toBe('Updated Name');
    });

    it('should only update tabs with matching requestId', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      tabStore.updateTabName('request-2', 'Updated Tab 2');
      const state = get(tabStore);

      expect(state.tabs[0].name).toBe('Tab 1');
      expect(state.tabs[1].name).toBe('Updated Tab 2');
      expect(state.tabs[2].name).toBe('Tab 3');
    });

    it('should preserve tab id and requestId when updating name', () => {
      tabStore.openTab('request-1', 'Original Name');
      const beforeUpdate = get(tabStore);
      const originalId = beforeUpdate.tabs[0].id;
      const originalRequestId = beforeUpdate.tabs[0].requestId;

      tabStore.updateTabName('request-1', 'New Name');
      const afterUpdate = get(tabStore);

      expect(afterUpdate.tabs[0].id).toBe(originalId);
      expect(afterUpdate.tabs[0].requestId).toBe(originalRequestId);
    });

    it('should not modify other tabs when updating one tab name', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');

      const beforeUpdate = get(tabStore);
      const tab2BeforeUpdate = { ...beforeUpdate.tabs[1] };

      tabStore.updateTabName('request-1', 'Updated Tab 1');
      const afterUpdate = get(tabStore);

      expect(afterUpdate.tabs[1]).toEqual(tab2BeforeUpdate);
    });

    it('should handle updating non-existent requestId gracefully', () => {
      tabStore.openTab('request-1', 'Tab 1');
      const beforeUpdate = get(tabStore);

      tabStore.updateTabName('non-existent-request', 'New Name');
      const afterUpdate = get(tabStore);

      expect(afterUpdate.tabs).toEqual(beforeUpdate.tabs);
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers when a tab is opened', () => {
      const states: Array<{ tabs: unknown[]; activeTabId: string | null }> = [];
      const unsubscribe = tabStore.subscribe((state) => {
        states.push({ ...state, tabs: [...state.tabs] });
      });

      tabStore.openTab('request-1', 'Tab 1');

      expect(states.length).toBeGreaterThan(1);
      expect(states.at(-1)!.tabs.length).toBeGreaterThan(states[0].tabs.length);

      unsubscribe();
    });

    it('should notify subscribers when a tab is closed', () => {
      tabStore.openTab('request-1', 'Tab 1');

      const states: Array<{ tabs: unknown[]; activeTabId: string | null }> = [];
      const unsubscribe = tabStore.subscribe((state) => {
        states.push({ ...state, tabs: [...state.tabs] });
      });

      const currentState = get(tabStore);
      tabStore.closeTab(currentState.tabs[0].id);

      expect(states.length).toBeGreaterThan(1);
      expect(states.at(-1)!.tabs.length).toBeLessThan(states[0].tabs.length);

      unsubscribe();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle opening, switching, and closing multiple tabs', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');

      const state1 = get(tabStore);
      expect(state1.tabs).toHaveLength(3);

      tabStore.setActiveTab(state1.tabs[0].id);
      tabStore.closeTab(state1.tabs[1].id);

      const state2 = get(tabStore);
      expect(state2.tabs).toHaveLength(2);
      expect(state2.activeTabId).toBe(state1.tabs[0].id);

      tabStore.updateTabName('request-3', 'Updated Tab 3');
      const state3 = get(tabStore);
      expect(state3.tabs[1].name).toBe('Updated Tab 3');
    });

    it('should maintain correct active tab through multiple operations', () => {
      tabStore.openTab('request-1', 'Tab 1');
      tabStore.openTab('request-2', 'Tab 2');
      tabStore.openTab('request-3', 'Tab 3');
      tabStore.openTab('request-4', 'Tab 4');

      const state = get(tabStore);
      const tab3Id = state.tabs[2].id;

      tabStore.setActiveTab(tab3Id);
      tabStore.closeTab(state.tabs[0].id);

      const afterClose = get(tabStore);
      expect(afterClose.activeTabId).toBe(tab3Id);
      expect(afterClose.tabs).toHaveLength(3);
    });
  });
});
