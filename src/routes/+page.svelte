<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import { t } from '$lib/i18n';
  import { theme } from '$lib/stores/theme';

  let name = $state('');
  let greetMsg = $state('');

  async function greet(event: Event) {
    event.preventDefault();
    greetMsg = await invoke('greet', { name });
  }
</script>

<div class="app-header">
  <h1>{$t('app.name')}</h1>
  <div class="header-controls">
    <LanguageSwitcher />
    <ThemeToggle />
  </div>
</div>

<main class="container">
  <div class="welcome-section">
    <h2>Welcome to {$t('app.name')}</h2>
    <p class="description">{$t('app.description')}</p>
  </div>

  <div class="theme-demo">
    <h3>Theme System Demo</h3>
    <p>Current theme: <strong>{$theme}</strong></p>
    <p>Click the theme toggle button above to switch between light and dark modes.</p>

    <div class="color-palette">
      <div class="color-box" style="background-color: var(--color-primary)">Primary</div>
      <div class="color-box" style="background-color: var(--color-secondary)">Secondary</div>
      <div class="color-box" style="background-color: var(--color-accent)">Accent</div>
      <div class="color-box" style="background-color: var(--color-success)">Success</div>
      <div class="color-box" style="background-color: var(--color-warning)">Warning</div>
      <div class="color-box" style="background-color: var(--color-error)">Error</div>
    </div>
  </div>

  <div class="greet-section">
    <h3>Tauri Integration Demo</h3>
    <form class="row" onsubmit={greet}>
      <input id="greet-input" placeholder="Enter a name..." bind:value={name} />
      <button type="submit">Greet</button>
    </form>
    {#if greetMsg}
      <p class="greet-msg">{greetMsg}</p>
    {/if}
  </div>
</main>

<style>
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg) var(--spacing-xl);
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .app-header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text);
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl);
  }

  .welcome-section {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  .welcome-section h2 {
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
  }

  .description {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }

  .theme-demo {
    background-color: var(--color-surface);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-xl);
    border: 1px solid var(--color-border);
  }

  .theme-demo h3 {
    margin-top: 0;
    color: var(--color-text);
  }

  .color-palette {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
  }

  .color-box {
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    text-align: center;
    color: white;
    font-weight: 600;
    box-shadow: var(--shadow-md);
  }

  .greet-section {
    background-color: var(--color-surface);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }

  .greet-section h3 {
    margin-top: 0;
    color: var(--color-text);
  }

  .row {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    margin-top: var(--spacing-md);
  }

  input,
  button {
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    color: var(--color-text);
    background-color: var(--color-background);
    transition: all var(--transition-base);
  }

  button {
    cursor: pointer;
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  button:active {
    transform: translateY(0);
  }

  input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .greet-msg {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background-color: var(--color-success);
    color: white;
    border-radius: var(--radius-md);
    text-align: center;
    font-weight: 600;
  }
</style>
