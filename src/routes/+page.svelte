<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import RequestList from '$lib/components/RequestList.svelte';
  import { t } from '$lib/i18n';

  type Request = {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
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
    },
    {
      id: '3',
      name: 'Update User',
      method: 'PUT',
      url: 'https://api.example.com/users/123',
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
    },
  ]);

  let selectedId = $state<string | null>(null);

  function handleSelect(request: Request) {
    console.log('Selected request:', request);
  }

  function handleNewRequest() {
    const newId = String(requests.length + 1);
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
      selectedId = null;
    }
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
  <RequestList
    {requests}
    bind:selectedId
    onselect={handleSelect}
    onnewrequest={handleNewRequest}
    ondelete={handleDelete}
  />
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
    height: calc(100vh - 70px);
    padding: var(--spacing-lg);
  }
</style>
