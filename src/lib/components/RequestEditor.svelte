<script lang="ts">
  import { t } from '$lib/i18n';

  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  type Header = {
    key: string;
    value: string;
  };

  type Request = {
    id?: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers?: Header[];
    body?: string;
  };

  type Props = {
    request?: Request;
    onsubmit?: (request: Request) => void;
    loading?: boolean;
  };

  let { request = $bindable(), onsubmit, loading = false }: Props = $props();

  // Active tab state
  let activeTab = $state<'headers' | 'body'>('headers');

  // Form state
  let name = $state(request?.name || 'New Request');
  let method = $state<HttpMethod>(request?.method || 'GET');
  let url = $state(request?.url || 'https://');
  let headers = $state<Header[]>(request?.headers || []);
  let body = $state(request?.body || '');

  // Validation state
  let urlError = $state('');
  let bodyError = $state('');

  // Update form state when request prop changes
  $effect(() => {
    if (request) {
      name = request.name;
      method = request.method;
      url = request.url;
      headers = request.headers ? [...request.headers] : [];
      body = request.body || '';
      urlError = '';
      bodyError = '';
    }
  });

  // HTTP methods with colors
  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const methodColors: Record<HttpMethod, string> = {
    GET: 'var(--color-method-get)',
    POST: 'var(--color-method-post)',
    PUT: 'var(--color-method-put)',
    DELETE: 'var(--color-method-delete)',
    PATCH: 'var(--color-method-patch)',
    HEAD: 'var(--color-method-head)',
    OPTIONS: 'var(--color-method-options)',
  };

  // Validate URL
  function validateUrl(value: string): boolean {
    if (!value || value.trim() === '') {
      urlError = $t('requestEditor.errors.urlRequired').toString();
      return false;
    }

    try {
      const parsedUrl = new URL(value);
      if (!parsedUrl.protocol.match(/^https?:$/)) {
        urlError = $t('requestEditor.errors.urlInvalidProtocol').toString();
        return false;
      }
      if (!parsedUrl.hostname) {
        urlError = $t('requestEditor.errors.urlInvalidHostname').toString();
        return false;
      }
      urlError = '';
      return true;
    } catch {
      urlError = $t('requestEditor.errors.urlInvalid').toString();
      return false;
    }
  }

  // Validate JSON body
  function validateBody(value: string): boolean {
    if (!value || value.trim() === '') {
      bodyError = '';
      return true;
    }

    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      bodyError = '';
      return true;
    }

    try {
      JSON.parse(value);
      bodyError = '';
      return true;
    } catch {
      bodyError = $t('requestEditor.errors.bodyInvalidJson').toString();
      return false;
    }
  }

  // Add header row
  function addHeader() {
    headers = [...headers, { key: '', value: '' }];
  }

  // Remove header row
  function removeHeader(index: number) {
    headers = headers.filter((_, i) => i !== index);
  }

  // Handle form submission
  function handleSubmit(event: Event) {
    event.preventDefault();

    const isUrlValid = validateUrl(url);
    const isBodyValid = validateBody(body);

    if (!isUrlValid || !isBodyValid) {
      return;
    }

    const validHeaders = headers.filter((h) => h.key.trim() !== '' && h.value.trim() !== '');

    const requestData: Request = {
      id: request?.id,
      name: name.trim(),
      method,
      url: url.trim(),
      headers: validHeaders.length > 0 ? validHeaders : undefined,
      body: body.trim() || undefined,
    };

    onsubmit?.(requestData);
  }

  // Format JSON
  function formatJson() {
    if (!body || body.trim() === '') return;
    try {
      const parsed = JSON.parse(body);
      body = JSON.stringify(parsed, null, 2);
      bodyError = '';
    } catch {
      // Don't format if invalid JSON
    }
  }
</script>

<div class="request-editor">
  <form onsubmit={handleSubmit}>
    <!-- Method and URL Row -->
    <div class="url-row">
      <select
        id="request-method"
        bind:value={method}
        disabled={loading}
        style="color: {methodColors[method]}"
        class="method-select"
      >
        {#each methods as m (m)}
          <option value={m} style="color: {methodColors[m]}">{m}</option>
        {/each}
      </select>

      <input
        id="request-url"
        type="url"
        bind:value={url}
        onblur={() => validateUrl(url)}
        placeholder={$t('requestEditor.urlPlaceholder').toString()}
        disabled={loading}
        class="url-input"
        aria-required="true"
        aria-invalid={urlError !== ''}
        aria-describedby={urlError ? 'url-error' : undefined}
      />

      <button type="submit" class="btn-send" disabled={loading}>
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>
          {$t('requestEditor.sending')}
        {:else}
          {$t('requestEditor.send')}
        {/if}
      </button>
    </div>

    {#if urlError}
      <span class="error" id="url-error">{urlError}</span>
    {/if}

    <!-- Tabs -->
    <div class="tabs">
      <button
        type="button"
        class="tab"
        class:active={activeTab === 'headers'}
        onclick={() => (activeTab = 'headers')}
      >
        {$t('requestEditor.headers')}
        {#if headers.length > 0}
          <span class="tab-count">{headers.length}</span>
        {/if}
      </button>
      <button
        type="button"
        class="tab"
        class:active={activeTab === 'body'}
        onclick={() => (activeTab = 'body')}
      >
        {$t('requestEditor.body')}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'headers'}
        <div class="headers-panel">
          <div class="panel-header">
            <button
              type="button"
              class="btn-secondary btn-sm"
              onclick={addHeader}
              disabled={loading}
              aria-label={$t('requestEditor.addHeader').toString()}
            >
              + {$t('requestEditor.addHeader')}
            </button>
          </div>

          {#if headers.length === 0}
            <p class="empty-state">{$t('requestEditor.noHeaders')}</p>
          {:else}
            <div class="headers-list">
              {#each headers as header, index (index)}
                <div class="header-row">
                  <input
                    type="text"
                    bind:value={header.key}
                    placeholder={$t('requestEditor.headerKey').toString()}
                    disabled={loading}
                    aria-label="{$t('requestEditor.headerKey')} {index + 1}"
                  />
                  <input
                    type="text"
                    bind:value={header.value}
                    placeholder={$t('requestEditor.headerValue').toString()}
                    disabled={loading}
                    aria-label="{$t('requestEditor.headerValue')} {index + 1}"
                  />
                  <button
                    type="button"
                    class="btn-icon btn-danger"
                    onclick={() => removeHeader(index)}
                    disabled={loading}
                    aria-label="{$t('requestEditor.removeHeader')} {index + 1}"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === 'body'}
        <div class="body-panel">
          <div class="panel-header">
            <button
              type="button"
              class="btn-secondary btn-sm"
              onclick={formatJson}
              disabled={loading || !body}
              aria-label={$t('requestEditor.formatJson').toString()}
            >
              {$t('requestEditor.formatJson')}
            </button>
          </div>

          <textarea
            id="request-body"
            bind:value={body}
            onblur={() => validateBody(body)}
            placeholder={$t('requestEditor.bodyPlaceholder').toString()}
            disabled={loading}
            aria-invalid={bodyError !== ''}
            aria-describedby={bodyError ? 'body-error' : undefined}
          ></textarea>
          {#if bodyError}
            <span class="error" id="body-error">{bodyError}</span>
          {/if}
        </div>
      {/if}
    </div>
  </form>
</div>

<style>
  .request-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    height: 100%;
  }

  .url-row {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .method-select {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-background);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-base);
    min-width: 100px;
    height: 40px;
  }

  .method-select:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  .url-input {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.875rem;
    transition: all var(--transition-base);
    height: 40px;
  }

  .url-input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  .url-input[aria-invalid='true'] {
    border-color: var(--color-error);
  }

  .btn-send {
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-base);
    border: none;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background-color: var(--color-primary);
    color: white;
    min-width: 100px;
    justify-content: center;
    height: 40px;
  }

  .btn-send:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-send:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error {
    color: var(--color-error);
    font-size: 0.75rem;
    margin-top: calc(-1 * var(--spacing-sm));
  }

  .tabs {
    display: flex;
    gap: var(--spacing-xs);
    border-bottom: 1px solid var(--color-border);
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

  .tab-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .headers-panel,
  .body-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }

  .panel-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .empty-state {
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 0.875rem;
    margin: var(--spacing-lg) 0;
    text-align: center;
  }

  .headers-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .header-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .header-row input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.875rem;
    transition: all var(--transition-base);
  }

  .header-row input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  textarea {
    flex: 1;
    width: 100%;
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 0.875rem;
    resize: none;
    min-height: 300px;
    transition: all var(--transition-base);
  }

  textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  textarea[aria-invalid='true'] {
    border-color: var(--color-error);
  }

  input:disabled,
  select:disabled,
  textarea:disabled,
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    transition: all var(--transition-base);
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
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-base);
  }

  .btn-danger {
    color: var(--color-danger);
  }

  .btn-danger:hover:not(:disabled) {
    background-color: var(--color-danger-alpha);
    border-color: var(--color-danger);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
