<script lang="ts">
  import { t } from '$lib/i18n';
  import { collectionStore } from '$lib/stores/collections.svelte';

  const saveStatus = $derived(collectionStore.saveStatus);
  const isDirty = $derived(collectionStore.isDirty);
  const error = $derived(collectionStore.error);
  const hasActiveCollection = $derived(collectionStore.activeCollection !== null);

  const statusConfig = $derived.by(() => {
    if (!hasActiveCollection) {
      return null;
    }

    if (error) {
      return {
        text: $t('collection.error'),
        icon: 'error',
        color: 'error',
      };
    }

    switch (saveStatus) {
      case 'saving':
        return {
          text: $t('collection.saving'),
          icon: 'saving',
          color: 'primary',
        };
      case 'saved':
        return isDirty
          ? {
              text: $t('collection.unsaved'),
              icon: 'unsaved',
              color: 'warning',
            }
          : {
              text: $t('collection.saved'),
              icon: 'saved',
              color: 'success',
            };
      case 'unsaved':
        return {
          text: $t('collection.unsaved'),
          icon: 'unsaved',
          color: 'warning',
        };
      case 'error':
        return {
          text: $t('collection.error'),
          icon: 'error',
          color: 'error',
        };
      default:
        return null;
    }
  });
</script>

{#if statusConfig}
  <div
    class="save-status"
    class:status-success={statusConfig.color === 'success'}
    class:status-primary={statusConfig.color === 'primary'}
    class:status-warning={statusConfig.color === 'warning'}
    class:status-error={statusConfig.color === 'error'}
  >
    {#if statusConfig.icon === 'saving'}
      <svg class="status-icon spinner" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle
          cx="7"
          cy="7"
          r="5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="25"
          stroke-dashoffset="0"
        />
      </svg>
    {:else if statusConfig.icon === 'saved'}
      <svg class="status-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M11.6667 3.5L5.25 9.91667L2.33333 7"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else if statusConfig.icon === 'unsaved'}
      <svg class="status-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="2" />
        <circle cx="7" cy="7" r="2" fill="currentColor" />
      </svg>
    {:else if statusConfig.icon === 'error'}
      <svg class="status-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="2" />
        <path
          d="M7 4V7.5M7 10V10.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    {/if}
    <span class="status-text">{statusConfig.text}</span>
  </div>
{/if}

<style>
  .save-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .status-icon {
    flex-shrink: 0;
  }

  .status-text {
    white-space: nowrap;
  }

  /* Status color variants */
  .status-success {
    color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
  }

  .status-primary {
    color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.1);
  }

  .status-warning {
    color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.1);
  }

  .status-error {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
  }

  /* Spinner animation */
  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive - hide text on small screens */
  @media (max-width: 640px) {
    .status-text {
      display: none;
    }

    .save-status {
      padding: var(--spacing-xs);
    }
  }
</style>
