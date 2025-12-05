<script lang="ts">
  import { t } from '$lib/i18n';
  import { collectionStore } from '$lib/stores/collections.svelte';
  import { open } from '@tauri-apps/plugin-dialog';

  let { isOpen, onClose } = $props<{
    isOpen: boolean;
    onClose: () => void;
  }>();

  let isOpening = $state(false);
  let error = $state<string | null>(null);
  let selectedPath = $state('');

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isOpening) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isOpening) {
      handleClose();
    }
  }

  function handleClose() {
    if (!isOpening) {
      error = null;
      selectedPath = '';
      onClose();
    }
  }

  async function handleBrowse() {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        title: $t('collection.selectFile'),
        filters: [
          {
            name: 'Collection Files',
            extensions: ['yaml', 'yml'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        selectedPath = selected;
        error = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : $t('collection.errorOpening');
    }
  }

  async function handleOpen() {
    if (!selectedPath.trim()) {
      error = $t('collection.invalidPath');
      return;
    }

    isOpening = true;
    error = null;

    try {
      await collectionStore.loadCollection(selectedPath);
      // Success - close dialog
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : $t('collection.errorOpening');
    } finally {
      isOpening = false;
    }
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !isOpening) {
      event.preventDefault();
      handleOpen();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="open-collection-title">
      <div class="dialog-header">
        <h2 id="open-collection-title">{$t('collection.openCollection')}</h2>
        <button
          type="button"
          class="close-button"
          onclick={handleClose}
          aria-label={$t('accessibility.closeDialog')}
          disabled={isOpening}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M12.5 3.5L3.5 12.5M3.5 3.5l9 9"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="dialog-content">
        <div class="form-group">
          <label for="collection-path" class="form-label">
            {$t('collection.path')}
          </label>
          <div class="folder-selector">
            <input
              id="collection-path"
              type="text"
              class="form-input"
              class:error={error !== null}
              bind:value={selectedPath}
              placeholder={$t('collection.pathPlaceholder')}
              disabled={isOpening}
              onkeydown={handleInputKeydown}
              aria-invalid={error !== null}
              aria-describedby={error ? 'collection-path-error' : undefined}
            />
            <button
              type="button"
              class="button button-secondary browse-button"
              onclick={handleBrowse}
              disabled={isOpening}
            >
              {$t('actions.browse')}
            </button>
          </div>
          {#if error}
            <p id="collection-path-error" class="error-message" role="alert">
              {error}
            </p>
          {/if}
        </div>

        <p class="help-text">
          {$t('collection.selectFileManual')}
        </p>
      </div>

      <div class="dialog-footer">
        <button
          type="button"
          class="button button-secondary"
          onclick={handleClose}
          disabled={isOpening}
        >
          {$t('actions.cancel')}
        </button>
        <button
          type="button"
          class="button button-primary"
          onclick={handleOpen}
          disabled={isOpening || !selectedPath.trim()}
        >
          {#if isOpening}
            <svg class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-dasharray="30"
                stroke-dashoffset="0"
              />
            </svg>
            {$t('collection.opening')}
          {:else}
            {$t('collection.open')}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    width: 90%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
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
    transition: all 0.15s ease;
  }

  .close-button:hover:not(:disabled) {
    background-color: var(--color-surface-hover);
    color: var(--color-text);
  }

  .close-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dialog-content {
    padding: var(--spacing-lg);
    flex: 1;
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .form-label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .form-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-input.error {
    border-color: var(--color-error);
  }

  .form-input.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .error-message {
    margin: var(--spacing-xs) 0 0;
    font-size: 0.75rem;
    color: var(--color-error);
  }

  .help-text {
    margin: var(--spacing-sm) 0 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .folder-selector {
    display: flex;
    gap: var(--spacing-sm);
  }

  .folder-selector .form-input {
    flex: 1;
  }

  .browse-button {
    flex-shrink: 0;
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }

  .button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-secondary {
    background-color: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: var(--color-surface-hover);
  }

  .button-primary {
    background-color: var(--color-primary);
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .button-primary:active:not(:disabled) {
    transform: scale(0.98);
  }
</style>
