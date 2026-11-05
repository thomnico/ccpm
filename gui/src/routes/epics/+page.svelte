<script lang="ts">
  import type { Epic, BoardColumn } from '$lib/ccpm/types';
  import { LABELS } from '$lib/ccpm/labels';
  import { epicStore } from '$lib/stores/epics';
  import { createBoardPoller } from '$lib/stores/polling';
  import { getClient } from '$lib/stores/client-helper';
  import Board from '../../components/Board.svelte';
  import CardDetail from '../../components/CardDetail.svelte';
  import CreateModal from '../../components/CreateModal.svelte';

  let { params } = $props<{ params: { prd: string } }>();

  const { epics, loading, refreshByPrd } = epicStore;

  let selectedEpic: Epic | null = $state(null);
  let showCreate = $state(false);

  $effect(() => {
    const prdNum = Number(params.prd);
    refreshByPrd(prdNum);
    const stop = createBoardPoller(() => refreshByPrd(prdNum));
    return stop;
  });

  function buildColumns(items: Epic[]): BoardColumn[] {
    return [
      { id: 'backlog', title: 'Planning', status: 'backlog', items: items.filter(i => i.status === 'backlog') },
      { id: 'in-progress', title: 'In Progress', status: 'in-progress', items: items.filter(i => i.status === 'in-progress') },
      { id: 'complete', title: 'Completed', status: 'closed', items: items.filter(i => i.status === 'closed' || i.status === 'complete') },
    ];
  }

  async function handleDrop(id: number, status: string) {
    const client = getClient();
    if (!client) return;

    epics.update(list =>
      list.map(e =>
        e.id === id ? { ...e, status: status as Epic['status'] } : e
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
      console.error('Failed to update epic status:', err);
      refreshByPrd(Number(params.prd));
    }
  }

  async function handleCreate(data: { title: string; body: string }) {
    const client = getClient();
    if (!client) return;
    try {
      await client.createIssue(data.title, data.body, [LABELS.EPIC]);
      showCreate = false;
      refreshByPrd(Number(params.prd));
    } catch (err) {
      console.error('Failed to create epic:', err);
    }
  }
</script>

<div class="page">
  <nav class="breadcrumb">
    <a href="#/prds">PRDs</a>
    <span class="sep">/</span>
    <span>PRD #{params.prd}</span>
    <span class="sep">/</span>
    <span class="current">Epics</span>
  </nav>

  <header class="page-header">
    <h1>Epics for PRD #{params.prd}</h1>
    <button class="btn-primary" onclick={() => showCreate = true}>New Epic</button>
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
      columns={buildColumns($epics)}
      onDrop={(id, status) => handleDrop(id, status)}
      onCardClick={(item) => {
        const epic = item as Epic;
        window.location.hash = `/tasks/${epic.epicName || epic.id}`;
      }}
    />
  {/if}

  {#if selectedEpic}
    <CardDetail item={selectedEpic} onclose={() => selectedEpic = null} />
  {/if}

  {#if showCreate}
    <CreateModal type="epic" onsubmit={handleCreate} onclose={() => showCreate = false} />
  {/if}
</div>

<style>
  .page { max-width: 1200px; }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .breadcrumb a {
    color: var(--accent);
    text-decoration: none;
  }

  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { color: var(--text-muted); }
  .breadcrumb .current { color: var(--text); }

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

  .skeleton-board { display: flex; gap: 16px; }
  .skeleton-column { flex: 1; display: flex; flex-direction: column; gap: 12px; }
  .skeleton-bar { height: 32px; background: var(--bg-surface); border-radius: var(--radius); animation: pulse 1.5s ease-in-out infinite; }
  .skeleton-card { height: 80px; background: var(--bg-surface); border-radius: var(--radius); animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
</style>
