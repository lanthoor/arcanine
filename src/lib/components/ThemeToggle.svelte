<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/theme';
  import { t } from '$lib/i18n';
</script>

<button
  onclick={toggleTheme}
  class="theme-toggle"
  aria-label={$t('theme.toggle')}
  title={$t('theme.toggle')}
>
  {#if $theme === 'light'}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
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
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
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

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.5rem;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      background-color var(--transition-base),
      border-color var(--transition-base),
      transform var(--transition-base),
      color var(--transition-base),
      box-shadow var(--transition-base);
    color: var(--color-text);
  }

  .theme-toggle:hover {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
  }

  .theme-toggle:active {
    transform: scale(0.95);
    box-shadow: var(--shadow-sm);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--color-focus-ring);
  }

  .theme-toggle svg {
    transition: transform var(--transition-base);
  }

  .theme-toggle:hover svg {
    transform: rotate(15deg);
  }
</style>
