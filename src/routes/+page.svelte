<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import RequestList from '$lib/components/RequestList.svelte';
  import RequestEditor from '$lib/components/RequestEditor.svelte';
  import ResponseViewer from '$lib/components/ResponseViewer.svelte';
  import BottomToolbar from '$lib/components/BottomToolbar.svelte';
  import TabBar from '$lib/components/TabBar.svelte';
  import { t } from '$lib/i18n';
  import { uiStore } from '$lib/stores/ui';
  import { tabStore } from '$lib/stores/tabs';
  import { responseStore } from '$lib/stores/responses';
  import type { CachedResponse } from '$lib/stores/responses';

  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  type Header = {
    key: string;
    value: string;
  };

  type Request = {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers?: Header[];
    body?: string;
  };

  type EditorRequest = {
    id?: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers?: Header[];
    body?: string;
  };

  type TauriRequest = {
    name: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
  };

  type TauriResponse = {
    status: number;
    status_text: string;
    headers: Record<string, string>;
    body: string;
    time_ms: number;
  };

  // Sample requests for demonstration
  let requests = $state<Request[]>([
    {
      id: '1',
      name: 'Get Users',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users',
    },
    {
      id: '2',
      name: 'Create User',
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/users',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
    },
    {
      id: '3',
      name: 'Update User',
      method: 'PUT',
      url: 'https://jsonplaceholder.typicode.com/users/1',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}',
    },
    {
      id: '4',
      name: 'Delete User',
      method: 'DELETE',
      url: 'https://jsonplaceholder.typicode.com/users/1',
    },
    {
      id: '5',
      name: 'Patch User',
      method: 'PATCH',
      url: 'https://jsonplaceholder.typicode.com/users/1',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "email": "newemail@example.com"\n}',
    },
  ]);

  // UI and tab state
  const ui = $derived($uiStore);
  const tabs = $derived($tabStore);
  const responses = $derived($responseStore);

  let selectedId = $state<string | null>('1');

  // Active tab request
  const activeTabRequest = $derived(
    tabs.activeTabId
      ? requests.find((r) => r.id === tabs.tabs.find((t) => t.id === tabs.activeTabId)?.requestId)
      : undefined
  );

  // Get cached response for active tab
  const activeTabResponse = $derived(activeTabRequest ? responses[activeTabRequest.id] : undefined);

  // Sync selectedId with active tab
  $effect(() => {
    if (activeTabRequest) {
      selectedId = activeTabRequest.id;
    }
  });

  // Request execution state
  let isLoading = $state(false);
  let executionError = $state<string | null>(null);

  function handleSelect(request: Request) {
    selectedId = request.id;
    // Open request in a new tab
    tabStore.openTab(request.id, request.name);
  }

  function handleNewRequest() {
    const newId = String(Date.now());
    const newRequest: Request = {
      id: newId,
      name: 'New Request',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/',
    };
    requests = [...requests, newRequest];
    selectedId = newId;
    tabStore.openTab(newId, newRequest.name);
  }

  function handleDelete(request: Request) {
    requests = requests.filter((r) => r.id !== request.id);
    // Close the tab if it's open
    const tab = tabs.tabs.find((t) => t.requestId === request.id);
    if (tab) {
      tabStore.closeTab(tab.id);
    }
    if (selectedId === request.id) {
      selectedId = requests.length > 0 ? requests[0].id : null;
    }
  }

  function convertHeadersToRecord(headers?: Header[]): Record<string, string> {
    if (!headers || headers.length === 0) return {};
    return headers.reduce(
      (acc, h) => {
        if (h.key && h.value) {
          acc[h.key] = h.value;
        }
        return acc;
      },
      {} as Record<string, string>
    );
  }

  function convertRecordToHeaders(record: Record<string, string>): Header[] {
    return Object.entries(record).map(([key, value]) => ({ key, value }));
  }

  async function handleSubmit(updatedRequest: EditorRequest) {
    // Update the request in the list
    const requestId = activeTabRequest?.id;
    if (requestId) {
      requests = requests.map((r) =>
        r.id === requestId ? { ...updatedRequest, id: requestId } : r
      );

      // Update tab name if request name changed
      if (updatedRequest.name !== activeTabRequest?.name) {
        tabStore.updateTabName(requestId, updatedRequest.name);
      }
    }

    // Execute the request
    await executeRequest(updatedRequest, requestId);
  }

  async function executeRequest(request: EditorRequest, requestId?: string) {
    // Clear previous error
    executionError = null;
    isLoading = true;

    try {
      const tauriRequest: TauriRequest = {
        name: request.name,
        method: request.method,
        url: request.url,
        headers: convertHeadersToRecord(request.headers),
        body: request.body || null,
      };

      const startTime = Date.now();
      const response = await invoke<TauriResponse>('execute_request', {
        request: tauriRequest,
      });
      const endTime = Date.now();

      // Convert Tauri response to CachedResponse
      const cachedResponse: CachedResponse = {
        status: response.status,
        statusText: response.status_text,
        headers: convertRecordToHeaders(response.headers),
        body: response.body,
        time: response.time_ms || endTime - startTime,
        size: response.body.length,
      };

      // Cache the response if we have a request ID
      if (requestId) {
        responseStore.setResponse(requestId, cachedResponse);
      }
    } catch (error) {
      // Handle errors
      executionError = error instanceof Error ? error.message : String(error);
      console.error('Request execution error:', error);
    } finally {
      isLoading = false;
    }
  }

  function handleClear() {
    executionError = null;
    // Clear cached response for active tab
    if (activeTabRequest) {
      responseStore.clearResponse(activeTabRequest.id);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Cmd/Ctrl+Enter to send request
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      if (activeTabRequest && !isLoading) {
        const editorRequest: EditorRequest = {
          id: activeTabRequest.id,
          name: activeTabRequest.name,
          method: activeTabRequest.method,
          url: activeTabRequest.url,
          headers: activeTabRequest.headers,
          body: activeTabRequest.body,
        };
        executeRequest(editorRequest, activeTabRequest.id);
      }
      event.preventDefault();
    }

    // Escape to clear response
    if (event.key === 'Escape') {
      handleClear();
      event.preventDefault();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<main class="app-layout">
  <aside class="sidebar" class:collapsed={ui.sidebarCollapsed}>
    <RequestList
      {requests}
      bind:selectedId
      onselect={handleSelect}
      onnewrequest={handleNewRequest}
      ondelete={handleDelete}
    />
  </aside>

  <div class="main-content">
    <TabBar
      tabs={tabs.tabs}
      activeTabId={tabs.activeTabId}
      onSelectTab={(tabId) => {
        tabStore.setActiveTab(tabId);
      }}
      onCloseTab={tabStore.closeTab}
    />

    <div
      class="content-area"
      class:vertical={ui.layoutOrientation === 'vertical'}
      class:horizontal={ui.layoutOrientation === 'horizontal'}
    >
      {#if activeTabRequest}
        <div class="editor-panel">
          <RequestEditor request={activeTabRequest} onsubmit={handleSubmit} loading={isLoading} />
        </div>

        <div class="response-panel">
          {#if executionError}
            <div class="error-banner">
              <div class="error-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div class="error-content">
                <h3>{$t('errors.general')}</h3>
                <p>{executionError}</p>
              </div>
              <button class="error-close" onclick={handleClear} aria-label={$t('actions.close')}>
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          {/if}

          <ResponseViewer response={activeTabResponse} onClear={handleClear} />

          {#if !activeTabResponse && !executionError && !isLoading}
            <div class="shortcuts-hint">
              <p>
                <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send request
              </p>
              <p>
                <kbd>Esc</kbd> to clear response
              </p>
              <p>
                <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>,</kbd> to open preferences
              </p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty-state">
          <h2>{$t('tabs.noActiveTab')}</h2>
          <p>{$t('tabs.selectOrCreateRequest')}</p>
        </div>
      {/if}
    </div>
  </div>
</main>

<BottomToolbar onToggleSidebar={uiStore.toggleSidebar} onToggleLayout={uiStore.toggleLayout} />

<style>
  .app-layout {
    display: flex;
    height: 100vh;
    padding-bottom: 32px;
    overflow: hidden;
  }

  .sidebar {
    width: 350px;
    min-width: 350px;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    background-color: var(--color-background);
    transition:
      width 0.3s ease,
      min-width 0.3s ease;
  }

  .sidebar.collapsed {
    width: 0;
    min-width: 0;
    border-right: none;
  }

  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background);
  }

  .content-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    position: relative;
  }

  .content-area.vertical {
    flex-direction: column;
  }

  .content-area.horizontal {
    flex-direction: row;
  }

  .editor-panel {
    padding: var(--spacing-lg);
    overflow-y: auto;
  }

  .content-area.vertical .editor-panel {
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
    max-height: 50vh;
  }

  .content-area.horizontal .editor-panel {
    flex: 1;
    border-right: 1px solid var(--color-border);
    max-width: 50%;
  }

  .response-panel {
    padding: var(--spacing-lg);
    overflow-y: auto;
    position: relative;
  }

  .content-area.vertical .response-panel {
    flex: 1;
  }

  .content-area.horizontal .response-panel {
    flex: 1;
  }

  .error-banner {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    background-color: var(--color-danger-alpha);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-md);
    color: var(--color-danger);
  }

  .error-icon {
    flex-shrink: 0;
  }

  .error-icon svg {
    width: 24px;
    height: 24px;
  }

  .error-content {
    flex: 1;
  }

  .error-content h3 {
    margin: 0 0 var(--spacing-1) 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .error-content p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: var(--color-text);
  }

  .error-close {
    flex-shrink: 0;
    padding: var(--spacing-1);
    background: transparent;
    border: none;
    color: var(--color-danger);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-fast);
  }

  .error-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .error-close svg {
    display: block;
    width: 20px;
    height: 20px;
  }

  .shortcuts-hint {
    margin-top: var(--spacing-xl);
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    background-color: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
  }

  .shortcuts-hint p {
    margin: var(--spacing-2) 0;
  }

  .shortcuts-hint kbd {
    display: inline-block;
    padding: var(--spacing-1) var(--spacing-2);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-text-secondary);
    padding: var(--spacing-lg);
  }

  .empty-state h2 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
  }

  .empty-state p {
    font-style: italic;
  }
</style>
