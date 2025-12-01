import { writable } from 'svelte/store';

export interface Tab {
  id: string;
  requestId: string;
  name: string;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

function createTabStore() {
  const { subscribe, update } = writable<TabState>({
    tabs: [],
    activeTabId: null,
  });

  return {
    subscribe,
    openTab: (requestId: string, name: string) => {
      update((state) => {
        // Check if tab already exists
        const existingTab = state.tabs.find((t) => t.requestId === requestId);
        if (existingTab) {
          return { ...state, activeTabId: existingTab.id };
        }

        // Create new tab
        const newTab: Tab = {
          id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          requestId,
          name,
        };

        return {
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        };
      });
    },
    closeTab: (tabId: string) => {
      update((state) => {
        const newTabs = state.tabs.filter((t) => t.id !== tabId);
        let newActiveTabId = state.activeTabId;

        // If closing active tab, switch to another tab
        if (state.activeTabId === tabId) {
          if (newTabs.length > 0) {
            // Find the index of the closed tab
            const closedIndex = state.tabs.findIndex((t) => t.id === tabId);
            // Switch to the tab before or after
            const newIndex = Math.min(closedIndex, newTabs.length - 1);
            newActiveTabId = newTabs[newIndex]?.id || null;
          } else {
            newActiveTabId = null;
          }
        }

        return { tabs: newTabs, activeTabId: newActiveTabId };
      });
    },
    setActiveTab: (tabId: string) => {
      update((state) => ({ ...state, activeTabId: tabId }));
    },
    updateTabName: (requestId: string, name: string) => {
      update((state) => ({
        ...state,
        tabs: state.tabs.map((t) => (t.requestId === requestId ? { ...t, name } : t)),
      }));
    },
  };
}

export const tabStore = createTabStore();
