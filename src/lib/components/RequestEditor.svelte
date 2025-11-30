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
    oncancel?: () => void;
    loading?: boolean;
  };

  let { request = $bindable(), onsubmit, oncancel, loading = false }: Props = $props();

  // Form state
  let name = $state(request?.name || 'New Request');
  let method = $state<HttpMethod>(request?.method || 'GET');
  let url = $state(request?.url || 'https://');
  let headers = $state<Header[]>(request?.headers || []);
  let body = $state(request?.body || '');

  // Validation state
  let urlError = $state('');
  let nameError = $state('');
  let bodyError = $state('');

  // Update form state when request prop changes
  $effect(() => {
    if (request) {
      name = request.name;
      method = request.method;
      url = request.url;
      headers = request.headers ? [...request.headers] : [];
      body = request.body || '';
      // Clear validation errors
      nameError = '';
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

  // Validate name
  function validateName(value: string): boolean {
    if (!value || value.trim() === '') {
      nameError = $t('requestEditor.errors.nameRequired').toString();
      return false;
    }
    nameError = '';
    return true;
  }

  // Validate JSON body
  function validateBody(value: string): boolean {
    if (!value || value.trim() === '') {
      bodyError = '';
      return true;
    }

    // Only validate if method supports body
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

    const isNameValid = validateName(name);
    const isUrlValid = validateUrl(url);
    const isBodyValid = validateBody(body);

    if (!isNameValid || !isUrlValid || !isBodyValid) {
      return;
    }

    // Filter out empty headers
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

  // Handle cancel
  function handleCancel() {
    oncancel?.();
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
    <!-- Name and Method Row -->
    <div class="form-row">
      <div class="form-group flex-1">
        <label for="request-name">
          {$t('requestEditor.name')}
          <span class="required">*</span>
        </label>
        <input
          id="request-name"
          type="text"
          bind:value={name}
          onblur={() => validateName(name)}
          placeholder={$t('requestEditor.namePlaceholder').toString()}
          disabled={loading}
          aria-required="true"
          aria-invalid={nameError !== ''}
          aria-describedby={nameError ? 'name-error' : undefined}
        />
        {#if nameError}
          <span class="error" id="name-error">{nameError}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="request-method">{$t('requestEditor.method')}</label>
        <select
          id="request-method"
          bind:value={method}
          disabled={loading}
          style="color: {methodColors[method]}"
        >
          {#each methods as m (m)}
            <option value={m} style="color: {methodColors[m]}">{m}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- URL -->
    <div class="form-group">
      <label for="request-url">
        {$t('requestEditor.url')}
        <span class="required">*</span>
      </label>
      <input
        id="request-url"
        type="url"
        bind:value={url}
        onblur={() => validateUrl(url)}
        placeholder={$t('requestEditor.urlPlaceholder').toString()}
        disabled={loading}
        aria-required="true"
        aria-invalid={urlError !== ''}
        aria-describedby={urlError ? 'url-error' : undefined}
      />
      {#if urlError}
        <span class="error" id="url-error">{urlError}</span>
      {/if}
    </div>

    <!-- Headers -->
    <div class="form-section">
      <div class="section-header">
        <h3>{$t('requestEditor.headers')}</h3>
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

    <!-- Body -->
    {#if ['POST', 'PUT', 'PATCH'].includes(method)}
      <div class="form-section">
        <div class="section-header">
          <h3>{$t('requestEditor.body')}</h3>
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
          rows="10"
          aria-invalid={bodyError !== ''}
          aria-describedby={bodyError ? 'body-error' : undefined}
        ></textarea>
        {#if bodyError}
          <span class="error" id="body-error">{bodyError}</span>
        {/if}
      </div>
    {/if}

    <!-- Actions -->
    <div class="form-actions">
      {#if oncancel}
        <button type="button" class="btn-secondary" onclick={handleCancel} disabled={loading}>
          {$t('requestEditor.cancel')}
        </button>
      {/if}
      <button type="submit" class="btn-primary" disabled={loading}>
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>
          {$t('requestEditor.sending')}
        {:else}
          {$t('requestEditor.send')}
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .request-editor {
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--color-border);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .form-row {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    min-width: 0;
  }

  .flex-1 {
    flex: 1;
  }

  label {
    font-weight: 600;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .required {
    color: var(--color-error);
  }

  input[type='text'],
  input[type='url'],
  select,
  textarea {
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

  input[type='text']:focus,
  input[type='url']:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  input[aria-invalid='true'],
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

  select {
    cursor: pointer;
    font-weight: 600;
  }

  textarea {
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    resize: vertical;
    min-height: 200px;
  }

  .error {
    color: var(--color-error);
    font-size: 0.75rem;
    margin-top: var(--spacing-xs);
  }

  .form-section {
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
  }

  .empty-state {
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 0.875rem;
    margin: 0;
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

  .form-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }

  button {
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
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-secondary {
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
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
