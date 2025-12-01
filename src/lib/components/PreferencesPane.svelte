<script lang="ts">
  import { t } from '$lib/i18n';
  import ThemeToggle from './ThemeToggle.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  let { isOpen, onClose } = $props<{
    isOpen: boolean;
    onClose: () => void;
  }>();

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="preferences-backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div
      class="preferences-pane"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-title"
    >
      <div class="preferences-header">
        <h2 id="preferences-title">{$t('preferences.title')}</h2>
        <button
          type="button"
          class="close-button"
          onclick={onClose}
          aria-label={$t('preferences.close')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 3.5L3.5 12.5M3.5 3.5l9 9"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="preferences-content">
        <div class="preference-section">
          <h3>{$t('preferences.appearance')}</h3>
          <div class="preference-item">
            <span class="preference-label">{$t('preferences.theme')}</span>
            <ThemeToggle />
          </div>
        </div>

        <div class="preference-section">
          <h3>{$t('preferences.language')}</h3>
          <div class="preference-item">
            <span class="preference-label">{$t('preferences.selectLanguage')}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .preferences-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .preferences-pane {
    background-color: var(--color-surface);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 600px;
    min-height: 400px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .preferences-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .preferences-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .close-button:hover {
    background-color: var(--color-surface-hover);
  }

  .preferences-content {
    padding: 20px;
    overflow-y: auto;
    overflow-x: visible;
    position: relative;
  }

  .preference-section {
    margin-bottom: 24px;
  }

  .preference-section:last-child {
    margin-bottom: 0;
  }

  .preference-section h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .preference-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
  }

  .preference-label {
    font-size: 14px;
    color: var(--color-text);
  }
</style>
