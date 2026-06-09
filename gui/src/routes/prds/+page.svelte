<script lang="ts">
  import type { PRD, BoardColumn } from '$lib/ccpm/types';
  import { LABELS } from '$lib/ccpm/labels';
  import { prdStore } from '$lib/stores/prds';
  import { createBoardPoller } from '$lib/stores/polling';
  import { getClient } from '$lib/stores/client-helper';
  import Board from '../../components/Board.svelte';
  import CardDetail from '../../components/CardDetail.svelte';
  import CreateModal from '../../components/CreateModal.svelte';

  const { prds, loading, refresh } = prdStore;

  let selectedPrd: PRD | null = $state(null);
  let showCreate = $state(false);

  $effect(() => {
    refresh();
    const stop = createBoardPoller(refresh);
    return stop;
  });

  function buildColumns(items: PRD[]): BoardColumn[] {
    return [
      { id: 'backlog', title: 'Backlog', status: 'backlog', items: items.filter(i => i.status === 'backlog') },
      { id: 'in-progress', title: 'In Progress', status: 'in-progress', items: items.filter(i => i.status === 'in-progress') },
      { id: 'complete', title: 'Complete', status: 'closed', items: items.filter(i => i.status === 'closed' || i.status === 'complete') },
    ];
  }

  async function handleDrop(id: number, status: string) {
    const client = getClient();
    if (!client) return;

    // Optimistic update
    prds.update(list =>
      list.map(p =>
        p.id === id ? { ...p, status: status as PRD['status'] } : p
      )
    );

    try {
      if (status === 'in-progress') {
        await client.addLabel(id, LABELS.IN_PROGRESS);
        await client.updateIssue(id, { state: 'open' });
      } else if (status === 'backlog') {
        await client.removeLabel(id, LABELS.IN_PROGRESS);
        await client.updateIssue(id, { state: 'open' });
      } else if (status === 'closed' || status === 'complete') {
        await client.removeLabel(id, LABELS.IN_PROGRESS);
        await client.updateIssue(id, { state: 'closed' });
      }
    } catch (err) {
      console.error('Failed to update PRD status:', err);
      refresh();
    }
  }

  async function handleCreate(data: { title: string; body: string }) {
    const client = getClient();
    if (!client) return;
    try {
      await client.createIssue(data.title, data.body, [LABELS.PRD]);
      showCreate = false;
      refresh();
    } catch (err) {
      console.error('Failed to create PRD:', err);
    }
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>PRDs</h1>
    <button class="btn-primary" onclick={() => showCreate = true}>New PRD</button>
  </header>

  {#if $loading}
    <div class="skeleton-board">
      {#each [1, 2, 3] as _}
        <div class="skeleton-column">
          <div class="skeleton-bar"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      {/each}
    </div>
  {:else}
    <Board
      columns={buildColumns($prds)}
      onDrop={(id, status) => handleDrop(id, status)}
    />
  {/if}

  {#if selectedPrd}
    <CardDetail item={selectedPrd} onclose={() => selectedPrd = null} />
  {/if}

  {#if showCreate}
    <CreateModal type="prd" onsubmit={handleCreate} onclose={() => showCreate = false} />
  {/if}
</div>

<style>
  .page { max-width: 1200px; }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .page-header h1 {
    margin: 0;
    font-size: 24px;
    color: var(--text);
  }

  .btn-primary {
    padding: 8px 16px;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-primary:hover { background: var(--accent-hover); }

  .skeleton-board {
    display: flex;
    gap: 16px;
  }

  .skeleton-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-bar {
    height: 32px;
    background: var(--bg-surface);
    border-radius: var(--radius);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-card {
    height: 80px;
    background: var(--bg-surface);
    border-radius: var(--radius);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
</style>
