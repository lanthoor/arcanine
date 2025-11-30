<script lang="ts">
  import { t } from '$lib/i18n';

  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  export type Request = {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
  };

  type Props = {
    requests?: Request[];
    selectedId?: string | null;
    onselect?: (request: Request) => void;
    onnewrequest?: () => void;
    ondelete?: (request: Request) => void;
  };

  let {
    requests = [],
    selectedId = $bindable(null),
    onselect,
    onnewrequest,
    ondelete,
  }: Props = $props();

  let listRef: HTMLDivElement;
  let selectedIndex = $state(0);

  const methodColors: Record<HttpMethod, string> = {
    GET: 'var(--color-method-get)',
    POST: 'var(--color-method-post)',
    PUT: 'var(--color-method-put)',
    DELETE: 'var(--color-method-delete)',
    PATCH: 'var(--color-method-patch)',
    HEAD: 'var(--color-method-head)',
    OPTIONS: 'var(--color-method-options)',
  };

  function handleRequestClick(request: Request, index: number) {
    selectedId = request.id;
    selectedIndex = index;
    onselect?.(request);
  }

  function handleNewRequest() {
    onnewrequest?.();
  }

  function handleDelete(event: Event, request: Request) {
    event.stopPropagation();
    const confirmMessage = $t('requestList.confirmDelete')
      .toString()
      .replace('{name}', request.name);
    if (confirm(confirmMessage)) {
      ondelete?.(request);
      // If deleted request was selected, clear selection
      if (selectedId === request.id) {
        selectedId = null;
        selectedIndex = 0;
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!requests.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, requests.length - 1);
        selectedId = requests[selectedIndex]?.id || null;
        if (requests[selectedIndex]) {
          onselect?.(requests[selectedIndex]);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        selectedId = requests[selectedIndex]?.id || null;
        if (requests[selectedIndex]) {
          onselect?.(requests[selectedIndex]);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (requests[selectedIndex]) {
          onselect?.(requests[selectedIndex]);
        }
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (requests[selectedIndex]) {
          handleDelete(event, requests[selectedIndex]);
        }
        break;
    }
  }

  // Update selectedIndex when selectedId changes externally
  $effect(() => {
    if (selectedId) {
      const index = requests.findIndex((r) => r.id === selectedId);
      if (index !== -1) {
        selectedIndex = index;
      }
    }
  });
</script>

<div class="request-list" bind:this={listRef} role="region" aria-label={$t('requestList.title')}>
  <div class="request-list-header">
    <h2 class="request-list-title">{$t('requestList.title')}</h2>
    <button
      class="new-request-button"
      onclick={handleNewRequest}
      aria-label={$t('requestList.newRequest')}
      title={$t('requestList.newRequest')}
      type="button"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 3.33334V12.6667M3.33333 8H12.6667"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{$t('requestList.newRequest')}</span>
    </button>
  </div>

  <div
    class="request-list-content"
    role="listbox"
    aria-label={$t('requestList.requests')}
    tabindex="0"
    onkeydown={handleKeyDown}
  >
    {#if requests.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M24 16V24M24 32H24.02"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="empty-state-text">{$t('requestList.empty')}</p>
        <p class="empty-state-hint">{$t('requestList.emptyHint')}</p>
      </div>
    {:else}
      {#each requests as request, index (request.id)}
        <div
          class="request-item"
          class:selected={request.id === selectedId}
          role="option"
          aria-selected={request.id === selectedId}
          onclick={() => handleRequestClick(request, index)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRequestClick(request, index);
            }
          }}
          tabindex="-1"
        >
          <div class="request-item-content">
            <span
              class="request-method"
              style="color: {methodColors[request.method]};"
              aria-label={$t('requestList.method')}
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
            onclick={(e) => handleDelete(e, request)}
            aria-label={$t('requestList.delete').toString().replace('{name}', request.name)}
            title={$t('requestList.delete').toString().replace('{name}', request.name)}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
  </div>
</div>

<style>
  .request-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-background);
    border-right: 1px solid var(--color-border);
  }

  .request-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-surface);
  }

  .request-list-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .new-request-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      transform var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .new-request-button:hover {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .new-request-button:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  .new-request-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .request-list-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
  }

  .request-list-content:focus {
    outline: none;
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
      transform var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .request-item:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
    transform: translateX(2px);
  }

  .request-item.selected {
    background-color: var(--color-primary-alpha);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .request-item:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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

  .request-item.selected .request-name {
    color: var(--color-primary);
  }

  .request-item.selected .request-url {
    color: var(--color-primary);
    opacity: 0.8;
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
      color var(--transition-fast),
      transform var(--transition-fast);
  }

  .request-item:hover .delete-button {
    opacity: 1;
  }

  .delete-button:hover {
    background-color: var(--color-danger-alpha);
    color: var(--color-danger);
  }

  .delete-button:active {
    transform: scale(0.95);
  }

  .delete-button:focus-visible {
    opacity: 1;
    outline: 2px solid var(--color-danger);
    outline-offset: 2px;
  }
</style>
