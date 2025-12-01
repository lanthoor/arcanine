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
    onClear?: () => void;
  };

  let { response, onClear }: Props = $props();

  // State
  let activeTab: 'body' | 'headers' = $state('body');

  // Derived state
  let statusClass = $derived(getStatusClass(response?.status));
  let contentType = $derived(getContentType(response?.headers));
  let sortedHeaders = $derived(
    response?.headers ? [...response.headers].sort((a, b) => a.key.localeCompare(b.key)) : []
  );
  let formattedBody = $derived.by(() => {
    if (!response?.body) return '';
    if (contentType?.includes('application/json')) {
      try {
        return JSON.stringify(JSON.parse(response.body), null, 2);
      } catch {
        return response.body;
      }
    }
    return response.body;
  });

  // Helper functions
  function getStatusClass(status: number | undefined): string {
    if (!status) return '';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return '';
  }

  function getContentType(headers?: Header[]): string | undefined {
    return headers?.find((h) => h.key.toLowerCase() === 'content-type')?.value;
  }

  function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  async function copyBody() {
    if (!response?.body) return;
    try {
      await navigator.clipboard.writeText(formattedBody);
    } catch (err) {
      console.error('Failed to copy body:', err);
    }
  }

  async function copyHeaders() {
    if (!response?.headers) return;
    try {
      const headersText = response.headers.map((h) => `${h.key}: ${h.value}`).join('\n');
      await navigator.clipboard.writeText(headersText);
    } catch (err) {
      console.error('Failed to copy headers:', err);
    }
  }
</script>

<div class="response-viewer">
  {#if response}
    <!-- Toolbar with Tabs, Status, Metadata, and Clear Button -->
    <div class="toolbar">
      <div class="tabs">
        <button
          type="button"
          class="tab"
          class:active={activeTab === 'body'}
          onclick={() => (activeTab = 'body')}
        >
          {$t('responseViewer.tabs.body')}
        </button>
        <button
          type="button"
          class="tab"
          class:active={activeTab === 'headers'}
          onclick={() => (activeTab = 'headers')}
        >
          {$t('responseViewer.tabs.headers')}
          {#if sortedHeaders.length > 0}
            <span class="tab-count">{sortedHeaders.length}</span>
          {/if}
        </button>
      </div>

      <div class="toolbar-right">
        <span class="status-badge {statusClass}" title={$t('responseViewer.status')}
          >{response.status} {response.statusText || ''}</span
        >
        <span class="metadata-item">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {formatTime(response.time)}
        </span>
        <span class="metadata-item" title="Size">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2v20m8-10H4m12-6a6 6 0 0 1-6 6m6-6a6 6 0 0 0-6 6m0 0a6 6 0 0 1-6 6m6-6a6 6 0 0 0-6 6"
            ></path>
          </svg>
          {formatSize(response.body?.length || 0)}
        </span>
        <button
          type="button"
          class="btn-icon"
          onclick={activeTab === 'body' ? copyBody : copyHeaders}
          title={activeTab === 'body'
            ? $t('responseViewer.copyBody')
            : $t('responseViewer.copyHeaders')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        {#if onClear}
          <button
            type="button"
            class="btn-clear"
            onclick={onClear}
            title={$t('responseViewer.clear')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
              ></path>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'body'}
        <div class="body-panel">
          <div class="body-content">
            <pre class="response-body">{formattedBody}</pre>
          </div>
        </div>
      {:else}
        <div class="headers-panel">
          <div class="headers-content">
            {#if sortedHeaders.length > 0}
              <table class="headers-table">
                <tbody>
                  {#each sortedHeaders as header (header.key)}
                    <tr class="header-row">
                      <td class="header-key">{header.key}</td>
                      <td class="header-value">{header.value}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <p class="empty-state">{$t('responseViewer.noHeaders')}</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="empty-state-container">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
      <h2>{$t('responseViewer.empty')}</h2>
      <p>{$t('responseViewer.emptyHint')}</p>
    </div>
  {/if}
</div>

<style>
  .response-viewer {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-md);
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .tabs {
    display: flex;
    gap: var(--spacing-xs);
  }

  .tab {
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .tab:hover {
    color: var(--color-text);
    background-color: var(--color-surface-hover);
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--spacing-xs);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tab.active .tab-count {
    background-color: var(--color-primary-alpha);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .status-badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    white-space: nowrap;
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

  .metadata-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
    white-space: nowrap;
  }

  .btn-clear {
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

  .btn-clear:hover {
    background-color: var(--color-background);
    border-color: var(--color-border);
    color: var(--color-danger);
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .body-panel,
  .headers-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
    flex: 1;
  }

  .panel-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .body-content {
    flex: 1;
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .response-body {
    margin: 0;
    padding: var(--spacing-md);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-text);
    overflow: auto;
    flex: 1;
  }

  .headers-content {
    flex: 1;
    overflow-y: auto;
  }

  .headers-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .header-row:nth-child(odd) {
    background-color: var(--color-surface);
  }

  .header-row:nth-child(even) {
    background-color: var(--color-background);
  }

  .header-row:hover {
    background-color: var(--color-surface-hover);
  }

  .header-key {
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text);
    font-weight: 600;
    width: 200px;
    vertical-align: top;
    border-bottom: 1px solid var(--color-border);
  }

  .header-value {
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text);
    word-break: break-all;
    border-bottom: 1px solid var(--color-border);
  }

  .empty-state {
    padding: var(--spacing-lg);
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 0.875rem;
    margin: 0;
    text-align: center;
  }

  .empty-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    text-align: center;
    color: var(--color-text-secondary);
    flex: 1;
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
