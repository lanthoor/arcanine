<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import RequestList from '$lib/components/RequestList.svelte';
  import RequestEditor from '$lib/components/RequestEditor.svelte';
  import { t } from '$lib/i18n';

  type Request = {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
    headers?: { key: string; value: string }[];
    body?: string;
  };

  type EditorRequest = {
    id?: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
    headers?: { key: string; value: string }[];
    body?: string;
  };

  // Sample requests for demonstration
  let requests = $state<Request[]>([
    {
      id: '1',
      name: 'Get Users',
      method: 'GET',
      url: 'https://api.example.com/users',
    },
    {
      id: '2',
      name: 'Create User',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
    },
    {
      id: '3',
      name: 'Update User',
      method: 'PUT',
      url: 'https://api.example.com/users/123',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "name": "Jane Doe"\n}',
    },
    {
      id: '4',
      name: 'Delete User',
      method: 'DELETE',
      url: 'https://api.example.com/users/123',
    },
    {
      id: '5',
      name: 'Patch User Profile',
      method: 'PATCH',
      url: 'https://api.example.com/users/123/profile',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "bio": "Software developer"\n}',
    },
  ]);

  let selectedId = $state<string | null>('1');
  let selectedRequest = $derived(requests.find((r) => r.id === selectedId));
  let loading = $state(false);

  function handleSelect(request: Request) {
    selectedId = request.id;
  }

  function handleNewRequest() {
    const newId = String(Date.now());
    const newRequest: Request = {
      id: newId,
      name: 'New Request',
      method: 'GET',
      url: 'https://api.example.com/',
    };
    requests = [...requests, newRequest];
    selectedId = newId;
  }

  function handleDelete(request: Request) {
    requests = requests.filter((r) => r.id !== request.id);
    if (selectedId === request.id) {
      selectedId = requests.length > 0 ? requests[0].id : null;
    }
  }

  function handleSubmit(updatedRequest: EditorRequest) {
    loading = true;
    // Simulate API call
    setTimeout(() => {
      if (selectedId) {
        requests = requests.map((r) =>
          r.id === selectedId ? { ...updatedRequest, id: selectedId } : r
        );
      }
      loading = false;
      console.log('Request sent:', updatedRequest);
    }, 1000);
  }
</script>

<div class="app-header">
  <h1>{$t('app.name')}</h1>
  <div class="header-controls">
    <LanguageSwitcher />
    <ThemeToggle />
  </div>
</div>

<main class="app-layout">
  <aside class="sidebar">
    <RequestList
      {requests}
      bind:selectedId
      onselect={handleSelect}
      onnewrequest={handleNewRequest}
      ondelete={handleDelete}
    />
  </aside>

  <div class="main-content">
    {#if selectedRequest}
      <RequestEditor request={selectedRequest} onsubmit={handleSubmit} {loading} />
    {:else}
      <div class="empty-state">
        <h2>{$t('requestList.empty')}</h2>
        <p>{$t('requestList.emptyHint')}</p>
      </div>
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

  .app-layout {
    display: flex;
    height: calc(100vh - 70px);
    overflow: hidden;
  }

  .sidebar {
    width: 350px;
    min-width: 350px;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    background-color: var(--color-background);
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
    background-color: var(--color-background);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .empty-state h2 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
  }

  .empty-state p {
    font-style: italic;
  }
</style>
