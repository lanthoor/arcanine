<script lang="ts">
  import { t } from '$lib/i18n';
  import type { Tab } from '$lib/stores/tabs';

  let { tabs, activeTabId, onSelectTab, onCloseTab } = $props<{
    tabs: Tab[];
    activeTabId: string | null;
    onSelectTab: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
  }>();

  function handleCloseTab(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    onCloseTab(tabId);
  }
</script>

{#if tabs.length > 0}
  <div class="tab-bar" role="tablist">
    {#each tabs as tab (tab.id)}
      <div
        class="tab"
        class:active={tab.id === activeTabId}
        role="tab"
        aria-selected={tab.id === activeTabId}
      >
        <button type="button" class="tab-button" onclick={() => onSelectTab(tab.id)}>
          <span class="tab-name">{tab.name || $t('tabs.untitled')}</span>
        </button>
        <button
          type="button"
          class="tab-close"
          onclick={(e) => handleCloseTab(e, tab.id)}
          aria-label={$t('tabs.close')}
          title={$t('tabs.close')}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3L3 9M3 3l6 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .tab-bar {
    display: flex;
    align-items: center;
    gap: 2px;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    padding: 4px 8px 0 8px;
    overflow-x: auto;
    overflow-y: hidden;
    min-height: 36px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px 6px 12px;
    background-color: transparent;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    color: var(--color-text-secondary);
    font-size: 13px;
    white-space: nowrap;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
    min-width: 100px;
    max-width: 200px;
  }

  .tab:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text);
  }

  .tab.active {
    background-color: var(--color-background);
    color: var(--color-text);
    border-bottom-color: var(--color-primary);
  }

  .tab-button {
    flex: 1;
    padding: 0;
    background: none;
    border: none;
    color: inherit;
    font-size: inherit;
    text-align: left;
    cursor: pointer;
    min-width: 0;
  }

  .tab-name {
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    background: none;
    border: none;
    color: currentColor;
    cursor: pointer;
    border-radius: 3px;
    opacity: 0.6;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .tab-close:hover {
    opacity: 1;
    background-color: var(--color-surface-hover);
  }

  .tab.active .tab-close {
    opacity: 0.8;
  }
</style>
