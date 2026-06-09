<script lang="ts">
  import { repoStore } from '$lib/stores/repo';

  const repoSlug = repoStore.repoSlug;
  const repo = repoStore.repo;

  let currentHash = $state(window.location.hash || '#/prds');

  $effect(() => {
    function onHashChange() {
      currentHash = window.location.hash || '#/prds';
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  function isActive(path: string): boolean {
    return currentHash.startsWith(path);
  }

  function clearRepo() {
    repoStore.setRepo('', '');
  }
</script>

<nav class="sidebar">
  <div class="logo">CCPM</div>
  {#if $repoSlug}
    <button class="repo-slug" onclick={clearRepo} title="Switch repo">
      {$repoSlug}
    </button>
  {/if}
  <ul class="nav-links">
    <li>
      <a href="#/prds" class:active={isActive('#/prds')}>PRDs</a>
    </li>
    <li>
      <a href="#/adrs" class:active={isActive('#/adrs')}>ADRs</a>
    </li>
    <li>
      <a href="#/deps" class:active={isActive('#/deps')}>Deps</a>
    </li>
    <li>
      <a href="#/editor" class:active={isActive('#/editor')}>Editor</a>
    </li>
    <li>
      <a href="#/settings" class:active={isActive('#/settings')}>Settings</a>
    </li>
  </ul>
</nav>

<style>
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-width);
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 50;
  }

  .logo {
    padding: 20px 16px 8px;
    font-size: 18px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 2px;
  }

  .repo-slug {
    padding: 0 16px 12px;
    font-size: 11px;
    color: var(--text-muted);
    cursor: pointer;
    background: none;
    border: none;
    text-align: left;
    font-family: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .repo-slug:hover {
    color: var(--text);
    text-decoration: underline;
  }

  .nav-links {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-links li a {
    display: block;
    padding: 10px 16px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    transition: background 0.15s, color 0.15s;
  }

  .nav-links li a:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .nav-links li a.active {
    color: var(--accent);
    background: var(--bg-hover);
    border-left: 3px solid var(--accent);
  }
</style>
