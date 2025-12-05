<script lang="ts">
  import { t } from '$lib/i18n';
  import { collectionStore } from '$lib/stores/collections.svelte';

  const activeCollection = $derived(collectionStore.activeCollection);
</script>

{#if activeCollection}
  <div class="collection-header">
    <div class="collection-info">
      <svg class="collection-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H7.32322C7.65415 2.5 7.97136 2.63169 8.20875 2.86519L9.46692 4.10481C9.70431 4.33831 10.0215 4.46999 10.3525 4.46999H15.8333C16.7538 4.46999 17.5 5.21618 17.5 6.13666V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="collection-details">
        <h2 class="collection-name">{activeCollection.name}</h2>
        {#if activeCollection.description}
          <p class="collection-description">{activeCollection.description}</p>
        {/if}
      </div>
    </div>

    <div class="collection-meta">
      {#if activeCollection.requests && activeCollection.requests.length > 0}
        <span class="request-count">
          {activeCollection.requests.length}
          {activeCollection.requests.length === 1 ? $t('request.title') : $t('common.items')}
        </span>
      {/if}
    </div>
  </div>
{:else}
  <div class="collection-header empty">
    <div class="empty-state">
      <svg class="empty-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 7C3 5.89543 3.89543 5 5 5H8.58579C9.11622 5 9.62493 5.21071 10 5.58579L11.4142 7C11.7893 7.37507 12.2979 7.58579 12.8284 7.58579H19C20.1046 7.58579 21 8.48122 21 9.58579V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p class="empty-text">{$t('collection.noActive')}</p>
    </div>
  </div>
{/if}

<style>
  .collection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .collection-header.empty {
    justify-content: center;
  }

  .collection-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
    min-width: 0; /* Allow text truncation */
  }

  .collection-icon {
    flex-shrink: 0;
    color: var(--color-primary);
  }

  .collection-details {
    flex: 1;
    min-width: 0;
  }

  .collection-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-description {
    margin: var(--spacing-xs) 0 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-shrink: 0;
  }

  .request-count {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-background);
    border-radius: var(--radius-sm);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) 0;
  }

  .empty-icon {
    color: var(--color-text-secondary);
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .collection-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .collection-meta {
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>
