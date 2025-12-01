<script lang="ts">
  import { t } from '$lib/i18n';
  import { uiStore } from '$lib/stores/ui';
  import { theme, toggleTheme } from '$lib/stores/theme';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  let { onToggleSidebar, onToggleLayout } = $props<{
    onToggleSidebar: () => void;
    onToggleLayout: () => void;
  }>();

  const ui = $derived($uiStore);
</script>

<div class="bottom-toolbar">
  <div class="toolbar-left">
    <button
      type="button"
      class="toolbar-button"
      onclick={onToggleSidebar}
      aria-label={ui.sidebarCollapsed ? $t('toolbar.showSidebar') : $t('toolbar.hideSidebar')}
      title={ui.sidebarCollapsed ? $t('toolbar.showSidebar') : $t('toolbar.hideSidebar')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {#if ui.sidebarCollapsed}
          <!-- Show sidebar icon (bars with arrow right) -->
          <path d="M2 3h3v10H2V3zm5 0h7v2H7V3zm0 4h7v2H7V7zm0 4h7v2H7v-2z" fill="currentColor" />
        {:else}
          <!-- Hide sidebar icon (bars with arrow left) -->
          <path d="M11 3h3v10h-3V3zM2 3h7v2H2V3zm0 4h7v2H2V7zm0 4h7v2H2v-2z" fill="currentColor" />
        {/if}
      </svg>
    </button>

    <button
      type="button"
      class="toolbar-button"
      onclick={onToggleLayout}
      aria-label={ui.layoutOrientation === 'horizontal'
        ? $t('layout.switchToVertical')
        : $t('layout.switchToHorizontal')}
      title={ui.layoutOrientation === 'horizontal'
        ? $t('layout.switchToVertical')
        : $t('layout.switchToHorizontal')}
    >
      {#if ui.layoutOrientation === 'horizontal'}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="2" width="12" height="5" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="2" y="9" width="12" height="5" rx="1" fill="currentColor" />
        </svg>
      {:else}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="2" width="5" height="12" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="9" y="2" width="5" height="12" rx="1" fill="currentColor" />
        </svg>
      {/if}
    </button>
  </div>

  <div class="toolbar-right">
    <LanguageSwitcher compact={true} />

    <button
      type="button"
      class="toolbar-button"
      onclick={toggleTheme}
      aria-label={$t('theme.toggle')}
      title={$t('theme.toggle')}
    >
      {#if $theme === 'light'}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {:else}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      {/if}
    </button>
  </div>
</div>

<style>
  .bottom-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    background-color: var(--color-surface);
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    z-index: 100;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .toolbar-button:hover {
    background-color: var(--color-surface-hover);
  }

  .toolbar-button:active {
    background-color: var(--color-surface-active);
  }
</style>
