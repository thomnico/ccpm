<script lang="ts">
  import Router from 'svelte-spa-router';
  import Nav from './components/Nav.svelte';
  import AuthGate from './components/AuthGate.svelte';
  import RepoPicker from './components/RepoPicker.svelte';
  import PrdPage from './routes/prds/+page.svelte';
  import EpicPage from './routes/epics/+page.svelte';
  import TaskPage from './routes/tasks/+page.svelte';
  import AdrPage from './routes/adrs/+page.svelte';
  import EditorPage from './routes/editor/+page.svelte';
  import SettingsPage from './routes/settings/+page.svelte';
  import DepsPage from './routes/deps/+page.svelte';
  import { repoStore } from '$lib/stores/repo';

  const routes = {
    '/': PrdPage,
    '/prds': PrdPage,
    '/epics/:prd': EpicPage,
    '/tasks/:epic': TaskPage,
    '/adrs': AdrPage,
    '/deps': DepsPage,
    '/editor': EditorPage,
    '/settings': SettingsPage,
  };

  const repo = repoStore.repo;
</script>

<AuthGate>
  {#snippet children()}
    {#if $repo.owner && $repo.name}
      <div class="layout">
        <Nav />
        <main>
          <Router {routes} />
        </main>
      </div>
    {:else}
      <RepoPicker />
    {/if}
  {/snippet}
</AuthGate>

<style>
  .layout { display: flex; min-height: 100vh; }
  main { flex: 1; margin-left: var(--sidebar-width); padding: 24px; }
</style>
