<script lang="ts">
  import { collectionStore } from '$lib/stores/collections.svelte';
  import { t } from '$lib/i18n';
  import { SvelteSet } from 'svelte/reactivity';

  type Props = {
    selectedRequestId?: string | null;
    onSelectRequest?: (collectionIndex: number, requestIndex: number) => void;
    onNewRequest?: (collectionIndex: number) => void;
    onDeleteRequest?: (collectionIndex: number, requestIndex: number) => void;
  };

  let {
    selectedRequestId = $bindable(null),
    onSelectRequest,
    onNewRequest,
    onDeleteRequest,
  }: Props = $props();

  const collections = $derived(collectionStore.collections);
  const activeCollection = $derived(collectionStore.activeCollection);

  let expandedCollections = new SvelteSet<number>();

  // Automatically expand all collections on mount and when new collections are added
  $effect(() => {
    const newExpanded = new SvelteSet<number>();
    collections.forEach((_, index) => {
      newExpanded.add(index);
    });
    expandedCollections = newExpanded;
  });

  function toggleCollection(index: number) {
    collectionStore.setActiveCollection(index);
    if (expandedCollections.has(index)) {
      expandedCollections.delete(index);
    } else {
      expandedCollections.add(index);
    }
    expandedCollections = new SvelteSet(expandedCollections);
  }

  function handleCloseCollection(event: Event, index: number) {
    event.stopPropagation();
    const collection = collections[index];
    if (collection) {
      const confirmMessage = `Close collection "${collection.name}"?`;
      if (confirm(confirmMessage)) {
        collectionStore.closeCollection(index);
        expandedCollections.delete(index);
        expandedCollections = new SvelteSet(expandedCollections);
      }
    }
  }

  function handleSelectRequest(collectionIndex: number, requestIndex: number) {
    // Set this collection as active
    collectionStore.setActiveCollection(collectionIndex);
    const collection = collections[collectionIndex];
    const request = collection?.requests[requestIndex];
    if (request) {
      // Generate a unique ID for the request
      const requestId = `${collectionIndex}-${requestIndex}`;
      selectedRequestId = requestId;
      onSelectRequest?.(collectionIndex, requestIndex);
    }
  }

  function handleNewRequest(collectionIndex: number) {
    collectionStore.setActiveCollection(collectionIndex);
    onNewRequest?.(collectionIndex);
  }

  function handleDeleteRequest(event: Event, collectionIndex: number, requestIndex: number) {
    event.stopPropagation();
    const collection = collections[collectionIndex];
    const request = collection?.requests[requestIndex];
    if (request) {
      const confirmMessage = $t('requestList.confirmDelete')
        .toString()
        .replace('{name}', request.name);
      if (confirm(confirmMessage)) {
        onDeleteRequest?.(collectionIndex, requestIndex);
      }
    }
  }

  const methodColors: Record<string, string> = {
    GET: 'var(--color-method-get)',
    POST: 'var(--color-method-post)',
    PUT: 'var(--color-method-put)',
    DELETE: 'var(--color-method-delete)',
    PATCH: 'var(--color-method-patch)',
    HEAD: 'var(--color-method-head)',
    OPTIONS: 'var(--color-method-options)',
  };
</script>

<div class="collection-request-list">
  {#if collections.length === 0}
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M6 10C6 7.79086 7.79086 6 10 6H17.3137C18.1796 6 19.0103 6.34196 19.6274 6.95392L23.0294 10.3137C23.6465 10.9257 24.4772 11.2677 25.3431 11.2677H38C40.2091 11.2677 42 13.0586 42 15.2677V38C42 40.2091 40.2091 42 38 42H10C7.79086 42 6 40.2091 6 38V10Z"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p class="empty-state-text">{$t('collection.noCollections')}</p>
      <p class="empty-state-hint">{$t('collection.createFirst')}</p>
    </div>
  {:else}
    {#each collections as collection, collectionIndex (collection.path)}
      <div class="collection-section">
        <div
          class="collection-item"
          class:active={activeCollection?.path === collection.path}
          onclick={() => toggleCollection(collectionIndex)}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleCollection(collectionIndex);
            }
          }}
        >
          <div class="collection-header-content">
            <button
              class="expand-toggle"
              class:expanded={expandedCollections.has(collectionIndex)}
              onclick={(e) => {
                e.stopPropagation();
                toggleCollection(collectionIndex);
              }}
              aria-label={expandedCollections.has(collectionIndex) ? 'Collapse' : 'Expand'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <svg class="collection-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 3.33334C2 2.97972 2.14048 2.64058 2.39052 2.39053C2.64057 2.14048 2.97971 2 3.33333 2H5.72667C5.98134 2.00007 6.22862 2.08394 6.43333 2.24L7.9 3.42667C8.10471 3.58274 8.35199 3.66661 8.60667 3.66667H12.6667C13.0203 3.66667 13.3594 3.80715 13.6095 4.05719C13.8595 4.30724 14 4.64638 14 5V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33334Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div class="collection-details">
              <span class="collection-name">{collection.name}</span>
              <span class="collection-count">
                {collection.requests.length}
                {collection.requests.length === 1 ? 'request' : 'requests'}
              </span>
            </div>
          </div>
          <button
            class="close-button"
            onclick={(e) => handleCloseCollection(e, collectionIndex)}
            aria-label={`Close ${collection.name}`}
            title={`Close ${collection.name}`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

        {#if expandedCollections.has(collectionIndex)}
          <div class="request-list">
            {#if collection.requests.length === 0}
              <div class="empty-requests">
                <p>{$t('requestList.empty')}</p>
              </div>
            {:else}
              {#each collection.requests as request, requestIndex (requestIndex)}
                {@const requestId = `${collectionIndex}-${requestIndex}`}
                <div
                  class="request-item"
                  class:selected={selectedRequestId === requestId}
                  onclick={() => handleSelectRequest(collectionIndex, requestIndex)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectRequest(collectionIndex, requestIndex);
                    }
                  }}
                  role="button"
                  tabindex="0"
                >
                  <div class="request-item-content">
                    <span
                      class="request-method"
                      style="color: {methodColors[request.method] ||
                        'var(--color-text-secondary)'};"
                    >
                      {request.method}
                    </span>
                    <div class="request-details">
                      <span class="request-name">{request.name}</span>
                      <span class="request-url">{request.url}</span>
                    </div>
                  </div>
                  <button
                    class="delete-button"
                    onclick={(e) => handleDeleteRequest(e, collectionIndex, requestIndex)}
                    aria-label={`Delete ${request.name}`}
                    title={`Delete ${request.name}`}
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4H14M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333M3.33333 4L4 13.3333C4 13.687 4.14048 14.0261 4.39052 14.2761C4.64057 14.5262 4.97971 14.6667 5.33333 14.6667H10.6667C11.0203 14.6667 11.3594 14.5262 11.6095 14.2761C11.8595 14.0261 12 13.687 12 13.3333L12.6667 4M6 4V2.66667C6 2.48986 6.07024 2.32029 6.19526 2.19526C6.32029 2.07024 6.48986 2 6.66667 2H9.33333C9.51014 2 9.67971 2.07024 9.80474 2.19526C9.92976 2.32029 10 2.48986 10 2.66667V4"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              {/each}
            {/if}
            <button
              class="new-request-button"
              onclick={() => handleNewRequest(collectionIndex)}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 2.91667V11.0833M2.91667 7H11.0833"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{$t('requestList.newRequest')}</span>
            </button>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .collection-request-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    background-color: var(--color-background);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--color-text-secondary);
  }

  .empty-state svg {
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
  }

  .empty-state-text {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-state-hint {
    margin: 0;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .collection-section {
    border-bottom: 1px solid var(--color-border);
  }

  .collection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background-color: var(--color-surface);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .collection-item:hover {
    background-color: var(--color-surface-hover);
  }

  .collection-item.active {
    background-color: var(--color-primary-alpha);
  }

  .collection-header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    min-width: 0;
  }

  .expand-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: transform var(--transition-fast);
    flex-shrink: 0;
  }

  .expand-toggle.expanded {
    transform: rotate(0deg);
  }

  .expand-toggle:not(.expanded) {
    transform: rotate(-90deg);
  }

  .collection-icon {
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  .collection-item.active .collection-icon {
    color: var(--color-primary);
  }

  .collection-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .collection-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-item.active .collection-name {
    color: var(--color-primary);
  }

  .collection-count {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
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
      color var(--transition-fast);
  }

  .collection-item:hover .close-button {
    opacity: 1;
  }

  .close-button:hover {
    background-color: var(--color-danger-alpha);
    color: var(--color-danger);
  }

  .request-list {
    padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) var(--spacing-xl);
    background-color: var(--color-background);
  }

  .empty-requests {
    padding: var(--spacing-md);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-style: italic;
  }

  .request-item {
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
      transform var(--transition-fast);
  }

  .request-item:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
    transform: translateX(2px);
  }

  .request-item.selected {
    background-color: var(--color-primary-alpha);
    border-color: var(--color-primary);
  }

  .request-item-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
    min-width: 0;
  }

  .request-method {
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .request-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;
    min-width: 0;
  }

  .request-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .request-url {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .request-item.selected .request-name,
  .request-item.selected .request-url {
    color: var(--color-primary);
  }

  .delete-button {
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
      color var(--transition-fast);
  }

  .request-item:hover .delete-button {
    opacity: 1;
  }

  .delete-button:hover {
    background-color: var(--color-danger-alpha);
    color: var(--color-danger);
  }

  .new-request-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm);
    margin-top: var(--spacing-xs);
    background-color: transparent;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .new-request-button:hover {
    background-color: var(--color-surface);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Scrollbar styling */
  .collection-request-list::-webkit-scrollbar {
    width: 6px;
  }

  .collection-request-list::-webkit-scrollbar-track {
    background: var(--color-background);
  }

  .collection-request-list::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  .collection-request-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-secondary);
  }
</style>
