<script lang="ts">
  import type { GitHubRepo } from '$lib/github/types';
  import { GitHubClient } from '$lib/github/client';
  import { auth } from '$lib/stores/auth';
  import { repoStore } from '$lib/stores/repo';
  import { get } from 'svelte/store';

  let repos: (GitHubRepo & { ccpm: boolean; checking: boolean })[] = $state([]);
  let loading = $state(true);
  let error = $state('');
  let search = $state('');
  let showAll = $state(true);

  const CCPM_LABELS = ['prd', 'epic', 'task'];
  const BATCH_SIZE = 5;

  $effect(() => {
    loadRepos();
  });

  async function loadRepos() {
    const token = get(auth.token);
    if (!token) return;
    loading = true;
    error = '';
    try {
      const client = new GitHubClient(token, '', '');
      const raw = await client.listUserRepos();
      repos = raw.map((r) => ({ ...r, ccpm: false, checking: true }));
      loading = false;
      // Check CCPM status in batches
      for (let i = 0; i < repos.length; i += BATCH_SIZE) {
        const batch = repos.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (repo) => {
            const isCcpm = await checkCcpm(client, repo.owner.login, repo.name);
            repos = repos.map((r) =>
              r.full_name === repo.full_name
                ? { ...r, ccpm: isCcpm, checking: false }
                : r
            );
          })
        );
      }
    } catch (err: any) {
      console.error('Failed to load repos:', err);
      error = err.message || 'Failed to load repositories.';
      loading = false;
    }
  }

  async function checkCcpm(
    client: GitHubClient,
    owner: string,
    name: string
  ): Promise<boolean> {
    try {
      const labels = await client.listLabels(owner, name);
      if (CCPM_LABELS.some((l) => labels.includes(l))) return true;
      return await client.hasDirectory(owner, name, '.claude');
    } catch {
      return false;
    }
  }

  function selectRepo(owner: string, name: string) {
    repoStore.setRepo(owner, name);
    window.location.hash = '#/prds';
  }

  let filtered = $derived.by(() => {
    let list = repos;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false)
      );
    }
    if (!showAll) {
      // Show CCPM repos first, but also show repos still being checked
      const ccpmRepos = list.filter((r) => r.ccpm || r.checking);
      if (ccpmRepos.length > 0) return ccpmRepos;
    }
    return list;
  });
</script>

<div class="picker-backdrop">
  <div class="picker-card">
    <h2 class="picker-title">Select Repository</h2>
    <p class="picker-desc">Choose a CCPM-enabled repository to manage.</p>

    <input
      type="text"
      class="picker-search"
      placeholder="Search repositories..."
      bind:value={search}
    />

    <label class="toggle-row">
      <input type="checkbox" bind:checked={showAll} />
      <span>Show all repositories</span>
    </label>

    {#if loading}
      <div class="picker-loading">Loading repositories...</div>
    {:else if error}
      <div class="picker-error">{error}</div>
    {:else if filtered.length === 0}
      <div class="picker-empty">No repositories found.</div>
    {:else}
      <ul class="repo-list">
        {#each filtered as repo}
          <li>
            <button
              class="repo-item"
              class:dimmed={!repo.ccpm && !repo.checking}
              onclick={() => selectRepo(repo.owner.login, repo.name)}
            >
              <div class="repo-info">
                <span class="repo-name">{repo.full_name}</span>
                {#if repo.checking}
                  <span class="badge checking">...</span>
                {:else if repo.ccpm}
                  <span class="badge ccpm">CCPM</span>
                {/if}
                {#if repo.private}
                  <span class="badge private">Private</span>
                {/if}
              </div>
              {#if repo.description}
                <div class="repo-desc">{repo.description}</div>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .picker-backdrop {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg);
  }

  .picker-card {
    background: var(--bg-card, var(--bg-surface));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    max-width: 600px;
    width: 100%;
  }

  .picker-title {
    margin: 0 0 4px;
    font-size: 20px;
    color: var(--text);
  }

  .picker-desc {
    margin: 0 0 20px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .picker-search {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 12px;
  }

  .picker-search:focus {
    border-color: var(--accent);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 16px;
    cursor: pointer;
  }

  .picker-loading,
  .picker-empty {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .picker-loading {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .picker-error {
    padding: 10px 14px;
    background: var(--red);
    color: white;
    border-radius: var(--radius);
    font-size: 13px;
  }

  .repo-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 400px;
    overflow-y: auto;
  }

  .repo-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 12px 14px;
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    cursor: pointer;
    margin-bottom: 8px;
    transition: background 0.15s, border-color 0.15s;
  }

  .repo-item:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
  }

  .repo-item.dimmed {
    opacity: 0.5;
  }

  .repo-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .repo-name {
    font-weight: 600;
    font-size: 14px;
  }

  .badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 600;
  }

  .badge.ccpm {
    background: var(--accent);
    color: var(--bg);
  }

  .badge.private {
    background: var(--bg-surface);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }

  .badge.checking {
    color: var(--text-muted);
  }

  .repo-desc {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
