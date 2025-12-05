<script lang="ts">
  import { collectionStore } from '$lib/stores/collections.svelte';
  import { t } from '$lib/i18n';

  const collections = $derived(collectionStore.collections);
  const activeCollection = $derived(collectionStore.activeCollection);

  function handleCollectionClick(index: number) {
    collectionStore.setActiveCollection(index);
  }

  function handleClose(event: Event, index: number) {
    event.stopPropagation();
    const collection = collections[index];
    if (collection) {
      const confirmMessage = `Close collection "${collection.name}"?`;
      if (confirm(confirmMessage)) {
        collectionStore.closeCollection(index);
      }
    }
  }
</script>

{#if collections.length > 0}
  <div class="collection-list">
    <div class="collection-list-header">
      <h3 class="collection-list-title">{$t('collections.title')}</h3>
      <span class="collection-count">{collections.length}</span>
    </div>
    <div class="collection-list-content">
      {#each collections as collection, index (collection.path)}
        <div
          class="collection-item"
          class:selected={activeCollection?.path === collection.path}
          onclick={() => handleCollectionClick(index)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCollectionClick(index);
            }
          }}
          role="button"
          tabindex="0"
          title={collection.path}
        >
          <div class="collection-item-content">
            <div class="collection-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 3.33334C2 2.97972 2.14048 2.64058 2.39052 2.39053C2.64057 2.14048 2.97971 2 3.33333 2H5.72667C5.98134 2.00007 6.22862 2.08394 6.43333 2.24L7.9 3.42667C8.10471 3.58274 8.35199 3.66661 8.60667 3.66667H12.6667C13.0203 3.66667 13.3594 3.80715 13.6095 4.05719C13.8595 4.30724 14 4.64638 14 5V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33334Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="collection-details">
              <span class="collection-name">{collection.name}</span>
              <span class="collection-info">
                {collection.requests.length}
                {collection.requests.length === 1 ? 'request' : 'requests'}
              </span>
            </div>
          </div>
          <button
            class="close-button"
            onclick={(e) => handleClose(e, index)}
            aria-label={`Close ${collection.name}`}
            title={`Close ${collection.name}`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .collection-list {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-background);
  }

  .collection-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background-color: var(--color-surface);
  }

  .collection-list-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .collection-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 var(--spacing-sm);
    background-color: var(--color-primary-alpha);
    color: var(--color-primary);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .collection-list-content {
    padding: var(--spacing-sm);
    max-height: 200px;
    overflow-y: auto;
  }

  .collection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-xs);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      transform var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .collection-item:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
    transform: translateX(2px);
  }

  .collection-item.selected {
    background-color: var(--color-primary-alpha);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .collection-item:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .collection-item-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
    min-width: 0;
  }

  .collection-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
  }

  .collection-item.selected .collection-icon {
    color: var(--color-primary);
  }

  .collection-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;
    min-width: 0;
  }

  .collection-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-info {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-item.selected .collection-name {
    color: var(--color-primary);
    font-weight: 600;
  }

  .collection-item.selected .collection-info {
    color: var(--color-primary);
    opacity: 0.8;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background-color: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity var(--transition-fast),
      background-color var(--transition-fast),
      color var(--transition-fast),
      transform var(--transition-fast);
  }

  .collection-item:hover .close-button {
    opacity: 1;
  }

  .close-button:hover {
    background-color: var(--color-danger-alpha);
    color: var(--color-danger);
  }

  .close-button:active {
    transform: scale(0.95);
  }

  .close-button:focus-visible {
    opacity: 1;
    outline: 2px solid var(--color-danger);
    outline-offset: 2px;
  }

  /* Scrollbar styling */
  .collection-list-content::-webkit-scrollbar {
    width: 6px;
  }

  .collection-list-content::-webkit-scrollbar-track {
    background: var(--color-background);
  }

  .collection-list-content::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  .collection-list-content::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-secondary);
  }
</style>
