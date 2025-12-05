<script lang="ts">
  import { t } from '$lib/i18n';
  import { collectionStore } from '$lib/stores/collections.svelte';
  import NewCollectionDialog from './NewCollectionDialog.svelte';
  import OpenCollectionDialog from './OpenCollectionDialog.svelte';

  let isOpen = $state(false);
  let buttonRef: HTMLButtonElement;

  let showNewDialog = $state(false);
  let showOpenDialog = $state(false);

  function handleMenuToggle() {
    isOpen = !isOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (buttonRef && !buttonRef.contains(target)) {
      isOpen = false;
    }
  }

  function handleNewCollection() {
    isOpen = false;
    showNewDialog = true;
  }

  function handleOpenCollection() {
    isOpen = false;
    showOpenDialog = true;
  }

  function handleKeyDown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<div class="collection-menu">
  <button
    bind:this={buttonRef}
    onclick={handleMenuToggle}
    class="menu-button"
    aria-label={$t('collection.menu')}
    aria-expanded={isOpen}
    aria-haspopup="menu"
    type="button"
  >
    <svg class="icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 5H17M3 10H17M3 15H17"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="menu-label">{$t('collection.title')}</span>
    <svg
      class="chevron"
      class:open={isOpen}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>

  {#if isOpen}
    <div class="menu-dropdown" role="menu" aria-label={$t('collection.menu')}>
      <button
        class="menu-item"
        role="menuitem"
        onclick={handleNewCollection}
        onkeydown={(e) => handleKeyDown(e, handleNewCollection)}
        type="button"
      >
        <svg class="item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3.33337V12.6667M3.33333 8H12.6667"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{$t('collection.newCollection')}</span>
      </button>

      <button
        class="menu-item"
        role="menuitem"
        onclick={handleOpenCollection}
        onkeydown={(e) => handleKeyDown(e, handleOpenCollection)}
        type="button"
      >
        <svg class="item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M14 9V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H7M11.3333 2H14V4.66667M6.66667 9.33333L14 2"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{$t('collection.openCollection')}</span>
      </button>

      <div class="menu-divider" role="separator"></div>

      <div class="menu-info">
        {#if collectionStore.activeCollection}
          <span class="info-label">{$t('collection.active')}:</span>
          <span class="info-value">{collectionStore.activeCollection.name}</span>
        {:else}
          <span class="info-empty">{$t('collection.noActive')}</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<NewCollectionDialog isOpen={showNewDialog} onClose={() => (showNewDialog = false)} />
<OpenCollectionDialog isOpen={showOpenDialog} onClose={() => (showOpenDialog = false)} />

<style>
  .collection-menu {
    position: relative;
  }

  .menu-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    height: 2.5rem;
    padding: 0 var(--spacing-md);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .menu-button:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .menu-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .menu-button:active {
    transform: scale(0.98);
  }

  .icon {
    flex-shrink: 0;
  }

  .menu-label {
    flex: 1;
    text-align: left;
  }

  .chevron {
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .menu-dropdown {
    position: absolute;
    top: calc(100% + var(--spacing-xs));
    left: 0;
    min-width: 220px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-xs);
    z-index: 1000;
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .menu-item:hover {
    background-color: var(--color-surface-hover);
  }

  .menu-item:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  .item-icon {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .menu-divider {
    height: 1px;
    background-color: var(--color-border);
    margin: var(--spacing-xs) 0;
  }

  .menu-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .info-label {
    font-weight: 500;
  }

  .info-value {
    color: var(--color-text);
    font-weight: 600;
  }

  .info-empty {
    font-style: italic;
    opacity: 0.7;
  }
</style>
