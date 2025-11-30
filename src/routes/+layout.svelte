<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { initializeTheme } from '$lib/stores/theme';
  import { initializeI18n } from '$lib/i18n';

  onMount(async () => {
    // Initialize theme system
    initializeTheme();

    // Initialize i18n with saved locale or browser language
    await initializeI18n();
  });
</script>

<slot />
