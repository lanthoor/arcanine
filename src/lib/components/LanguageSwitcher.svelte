<script lang="ts">
  import { locale, t } from '$lib/i18n';
  import { setLocale } from '$lib/i18n';

  let { compact = false } = $props<{ compact?: boolean }>();

  type Language = {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
  };

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ];

  let isOpen = $state(false);
  let buttonRef: HTMLButtonElement;

  const currentLanguage = $derived(languages.find((lang) => lang.code === $locale) || languages[0]);

  function handleLanguageChange(langCode: string) {
    setLocale(langCode);
    isOpen = false;
    buttonRef?.focus();
  }

  function handleKeyDown(event: KeyboardEvent, langCode: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageChange(langCode);
    }
  }

  function handleButtonClick() {
    isOpen = !isOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (buttonRef && !buttonRef.contains(target)) {
      isOpen = false;
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

<div class="language-switcher" class:compact>
  <button
    bind:this={buttonRef}
    onclick={handleButtonClick}
    class="language-button"
    class:compact
    aria-label={$t('language.select')}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    type="button"
  >
    <span class="flag" aria-hidden="true">{currentLanguage.flag}</span>
    {#if !compact}
      <span class="language-name">{currentLanguage.code.toUpperCase()}</span>
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
    {/if}
  </button>

  {#if isOpen}
    <div
      class="language-menu"
      class:compact
      role="listbox"
      aria-label={$t('language.selectLanguage')}
    >
      {#each languages as language (language.code)}
        <button
          class="language-option"
          class:active={language.code === $locale}
          role="option"
          aria-selected={language.code === $locale}
          onclick={() => handleLanguageChange(language.code)}
          onkeydown={(e) => handleKeyDown(e, language.code)}
          type="button"
        >
          <span class="flag" aria-hidden="true">{language.flag}</span>
          <div class="language-info">
            <span class="native-name">{language.nativeName}</span>
            <span class="english-name">{language.name}</span>
          </div>
          {#if language.code === $locale}
            <svg class="checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3332 4L5.99984 11.3333L2.6665 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .language-switcher {
    position: relative;
  }

  .language-switcher:not(.compact) {
    margin-right: 5%;
  }

  .language-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    height: 2.5rem;
    padding: 0 var(--spacing-sm);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .language-button.compact {
    width: 24px;
    height: 24px;
    padding: 0;
    justify-content: center;
    border: none;
    background: none;
  }

  .language-button.compact:hover {
    background-color: var(--color-surface-hover);
    border-radius: 4px;
  }

  .language-button:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .language-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .language-button:active {
    transform: scale(0.98);
  }

  .flag {
    font-size: 1.125rem;
    line-height: 1;
  }

  .language-name {
    line-height: 1;
  }

  .chevron {
    transition: transform var(--transition-medium);
    color: var(--color-text-secondary);
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .language-menu {
    position: absolute;
    top: calc(100% + var(--spacing-sm));
    right: 0;
    min-width: 200px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-xs);
    z-index: 10;
    animation: slideDown var(--transition-medium) cubic-bezier(0.16, 1, 0.3, 1);
  }

  .language-menu.compact {
    bottom: calc(100% + 4px);
    top: auto;
    animation: slideUp var(--transition-medium) cubic-bezier(0.16, 1, 0.3, 1);
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

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .language-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
    padding: 5%;
    background-color: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.875rem;
    text-align: left;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);
  }

  .language-option:hover {
    background-color: var(--color-surface-hover);
  }

  .language-option:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  .language-option.active {
    background-color: var(--color-primary-alpha);
    color: var(--color-primary);
  }

  .language-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    flex: 1;
  }

  .native-name {
    font-weight: 500;
    line-height: 1;
  }

  .english-name {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  .language-option.active .english-name {
    color: var(--color-primary);
    opacity: 0.8;
  }

  .checkmark {
    color: var(--color-primary);
    flex-shrink: 0;
  }
</style>
