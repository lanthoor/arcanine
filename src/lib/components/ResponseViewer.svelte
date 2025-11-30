<script lang="ts">
  import { t } from '$lib/i18n';

  type Header = {
    key: string;
    value: string;
  };

  type Response = {
    status: number;
    statusText?: string;
    headers?: Header[];
    body?: string;
    time: number; // in milliseconds
  };

  type Props = {
    response?: Response;
  };

  let { response }: Props = $props();

  // State
  let headersExpanded = $state(false);
  let isFormatted = $state(true);
  let copyBodySuccess = $state(false);
  let copyHeadersSuccess = $state(false);

  // Derived state
  let statusClass = $derived(getStatusClass(response?.status));
  let contentType = $derived(getContentType(response?.headers));
  let formattedBody = $derived(formatBody(response?.body, contentType, isFormatted));
  let hasHeaders = $derived(response?.headers && response.headers.length > 0);
  let headerCount = $derived(response?.headers?.length || 0);

  // Get status code color class
  function getStatusClass(status?: number): string {
    if (!status) return '';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return '';
  }

  // Get content type from headers
  function getContentType(headers?: Header[]): string {
    if (!headers) return 'text/plain';
    const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
    return contentTypeHeader?.value.split(';')[0].trim() || 'text/plain';
  }

  // Format response body based on content type
  function formatBody(body?: string, contentType?: string, formatted: boolean = true): string {
    if (!body) return '';
    if (!formatted) return body;

    if (contentType?.includes('application/json')) {
      try {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return body;
      }
    }

    return body;
  }

  // Toggle headers expansion
  function toggleHeaders() {
    headersExpanded = !headersExpanded;
  }

  // Toggle format
  function toggleFormat() {
    isFormatted = !isFormatted;
  }

  // Copy body to clipboard
  async function copyBody() {
    if (!response?.body) return;
    try {
      await navigator.clipboard.writeText(response.body);
      copyBodySuccess = true;
      setTimeout(() => {
        copyBodySuccess = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy body:', err);
    }
  }

  // Copy headers to clipboard
  async function copyHeaders() {
    if (!response?.headers) return;
    const headersText = response.headers.map((h) => `${h.key}: ${h.value}`).join('\n');
    try {
      await navigator.clipboard.writeText(headersText);
      copyHeadersSuccess = true;
      setTimeout(() => {
        copyHeadersSuccess = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy headers:', err);
    }
  }

  // Format time display
  function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }
</script>

<div class="response-viewer">
  {#if response}
    <!-- Status and Time -->
    <div class="response-header">
      <div class="status-section">
        <span class="status-badge {statusClass}">
          {response.status}
          {#if response.statusText}
            {response.statusText}
          {/if}
        </span>
        <span class="time-badge">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 14.667A6.667 6.667 0 1 0 8 1.333a6.667 6.667 0 0 0 0 13.334Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 4v4l2.667 1.333"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {formatTime(response.time)}
        </span>
      </div>
    </div>

    <!-- Headers Section -->
    <div class="headers-section">
      <div class="section-header">
        <button
          type="button"
          class="expand-button"
          onclick={toggleHeaders}
          aria-expanded={headersExpanded}
          aria-label={headersExpanded
            ? $t('responseViewer.collapseHeaders')
            : $t('responseViewer.expandHeaders')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            class="chevron"
            class:expanded={headersExpanded}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <h3>
            {$t('responseViewer.headers')}
            {#if headerCount > 0}
              <span class="count">({headerCount})</span>
            {/if}
          </h3>
        </button>
        {#if hasHeaders}
          <button
            type="button"
            class="btn-icon"
            onclick={copyHeaders}
            aria-label={$t('responseViewer.copyHeaders')}
            title={copyHeadersSuccess
              ? $t('responseViewer.copied')
              : $t('responseViewer.copyHeaders')}
          >
            {#if copyHeadersSuccess}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M13.333 4L6 11.333 2.667 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {:else}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M13.333 6v6.667a1.333 1.333 0 0 1-1.333 1.333H6a1.333 1.333 0 0 1-1.333-1.333V6A1.333 1.333 0 0 1 6 4.667h6a1.333 1.333 0 0 1 1.333 1.333Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.333 4.667V3.333A1.333 1.333 0 0 0 10 2H3.333a1.333 1.333 0 0 0-1.333 1.333V10A1.333 1.333 0 0 0 3.333 11.333h1.334"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {/if}
          </button>
        {/if}
      </div>

      {#if headersExpanded}
        <div class="headers-content">
          {#if hasHeaders}
            <div class="headers-list">
              {#each response.headers as header (header.key)}
                <div class="header-row">
                  <span class="header-key">{header.key}:</span>
                  <span class="header-value">{header.value}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-state">{$t('responseViewer.noHeaders')}</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Body Section -->
    <div class="body-section">
      <div class="section-header">
        <h3>{$t('responseViewer.body')}</h3>
        <div class="body-actions">
          {#if contentType?.includes('application/json')}
            <button
              type="button"
              class="btn-secondary btn-sm"
              onclick={toggleFormat}
              aria-label={isFormatted
                ? $t('responseViewer.showRaw')
                : $t('responseViewer.formatJson')}
            >
              {isFormatted ? $t('responseViewer.raw') : $t('responseViewer.format')}
            </button>
          {/if}
          {#if response.body}
            <button
              type="button"
              class="btn-icon"
              onclick={copyBody}
              aria-label={$t('responseViewer.copyBody')}
              title={copyBodySuccess ? $t('responseViewer.copied') : $t('responseViewer.copyBody')}
            >
              {#if copyBodySuccess}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M13.333 4L6 11.333 2.667 8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {:else}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M13.333 6v6.667a1.333 1.333 0 0 1-1.333 1.333H6a1.333 1.333 0 0 1-1.333-1.333V6A1.333 1.333 0 0 1 6 4.667h6a1.333 1.333 0 0 1 1.333 1.333Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M11.333 4.667V3.333A1.333 1.333 0 0 0 10 2H3.333a1.333 1.333 0 0 0-1.333 1.333V10A1.333 1.333 0 0 0 3.333 11.333h1.334"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
            </button>
          {/if}
        </div>
      </div>

      <div class="body-content">
        {#if response.body}
          <pre class="response-body">{formattedBody}</pre>
        {:else}
          <p class="empty-state">{$t('responseViewer.noBody')}</p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="empty-state-container">
      <svg
        width="48"
        height="48"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 6.667v6.666a1.333 1.333 0 0 1-1.333 1.334H3.333A1.333 1.333 0 0 1 2 13.333V6.667m12 0V2.667A1.333 1.333 0 0 0 12.667 1.333H3.333A1.333 1.333 0 0 0 2 2.667v4m12 0H2"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <h2>{$t('responseViewer.empty')}</h2>
      <p>{$t('responseViewer.emptyHint')}</p>
    </div>
  {/if}
</div>

<style>
  .response-viewer {
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .status-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .status-badge {
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .status-success {
    background-color: var(--color-success-alpha);
    color: var(--color-success);
    border: 1px solid var(--color-success);
  }

  .status-redirect {
    background-color: var(--color-info-alpha);
    color: var(--color-info);
    border: 1px solid var(--color-info);
  }

  .status-client-error {
    background-color: var(--color-warning-alpha);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
  }

  .status-server-error {
    background-color: var(--color-danger-alpha);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  .time-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .headers-section,
  .body-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .count {
    color: var(--color-text-secondary);
    font-weight: 400;
    font-size: 0.875rem;
  }

  .expand-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-text);
    font-family: inherit;
    transition: color var(--transition-base);
  }

  .expand-button:hover {
    color: var(--color-primary);
  }

  .chevron {
    transition: transform var(--transition-base);
  }

  .chevron.expanded {
    transform: rotate(180deg);
  }

  .body-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .headers-content {
    padding-left: var(--spacing-md);
  }

  .headers-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .header-row {
    display: grid;
    grid-template-columns: minmax(150px, auto) 1fr;
    gap: var(--spacing-md);
    padding: var(--spacing-xs) 0;
    font-size: 0.875rem;
  }

  .header-key {
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .header-value {
    color: var(--color-text);
    word-break: break-all;
  }

  .body-content {
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .response-body {
    margin: 0;
    padding: var(--spacing-md);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-text);
    overflow-x: auto;
    max-height: 500px;
    overflow-y: auto;
  }

  .empty-state {
    padding: var(--spacing-md);
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 0.875rem;
    margin: 0;
  }

  .empty-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    text-align: center;
    color: var(--color-text-secondary);
  }

  .empty-state-container svg {
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
  }

  .empty-state-container h2 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text);
    font-size: 1.25rem;
  }

  .empty-state-container p {
    margin: 0;
    font-style: italic;
  }

  button {
    transition: all var(--transition-base);
  }

  .btn-secondary {
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    font-family: inherit;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-background);
    border-color: var(--color-primary);
  }

  .btn-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.75rem;
  }

  .btn-icon {
    padding: var(--spacing-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .btn-icon:hover {
    background-color: var(--color-background);
    border-color: var(--color-border);
    color: var(--color-text);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
