<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { initializeTheme } from '$lib/stores/theme';
  import { loadTranslations } from '$lib/i18n';

  onMount(async () => {
    // Initialize theme system
    initializeTheme();

    // Load default translations (English)
    await loadTranslations('en');
  });
</script>

<slot />
