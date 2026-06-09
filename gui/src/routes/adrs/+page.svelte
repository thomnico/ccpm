<script lang="ts">
  import type { ADR, AdrStatus } from '$lib/ccpm/types';
  import { LABELS } from '$lib/ccpm/labels';
  import { adrStore } from '$lib/stores/adrs';
  import { createBoardPoller } from '$lib/stores/polling';
  import { getClient } from '$lib/stores/client-helper';
  import CardDetail from '../../components/CardDetail.svelte';
  import CreateModal from '../../components/CreateModal.svelte';

  const { adrs, loading, refresh } = adrStore;

  let selectedAdr: ADR | null = $state(null);
  let showCreate = $state(false);

  $effect(() => {
    refresh();
    const stop = createBoardPoller(refresh);
    return stop;
  });

  interface AdrColumn {
    id: AdrStatus;
    title: string;
    items: ADR[];
  }

  function buildColumns(items: ADR[]): AdrColumn[] {
    return [
      { id: 'proposed', title: 'Proposed', items: items.filter(i => i.adrStatus === 'proposed') },
      { id: 'accepted', title: 'Accepted', items: items.filter(i => i.adrStatus === 'accepted') },
      { id: 'superseded', title: 'Superseded', items: items.filter(i => i.adrStatus === 'superseded') },
    ];
  }

  async function handleDrop(id: number, targetStatus: AdrStatus) {
    const client = getClient();
    if (!client) return;

    // Optimistic update
    adrs.update(list =>
      list.map(a =>
        a.id === id ? { ...a, adrStatus: targetStatus } : a
      )
    );

    const statusLabelMap: Record<AdrStatus, string> = {
      proposed: LABELS.ADR_PROPOSED,
      accepted: LABELS.ADR_ACCEPTED,
      superseded: LABELS.ADR_SUPERSEDED,
    };

    try {
      // Remove all ADR status labels, then add the target one
      for (const status of ['proposed', 'accepted', 'superseded'] as AdrStatus[]) {
        if (status !== targetStatus) {
          await client.removeLabel(id, statusLabelMap[status]);
        }
      }
      await client.addLabel(id, statusLabelMap[targetStatus]);
    } catch (err) {
      console.error('Failed to update ADR status:', err);
      refresh();
    }
  }

  async function handleCreate(data: { title: string; body: string }) {
    const client = getClient();
    if (!client) return;
    try {
      await client.createIssue(data.title, data.body, [LABELS.ADR, LABELS.ADR_PROPOSED]);
      showCreate = false;
      refresh();
    } catch (err) {
      console.error('Failed to create ADR:', err);
    }
  }

  function handleCardClick(adr: ADR) {
    selectedAdr = adr;
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>ADRs</h1>
    <button class="btn-primary" onclick={() => showCreate = true}>New ADR</button>
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
    {@const columns = buildColumns($adrs)}
    <div class="board">
      {#each columns as col}
        <div
          class="column"
          role="list"
          ondragover={(e) => e.preventDefault()}
          ondrop={(e) => {
            e.preventDefault();
            const id = parseInt(e.dataTransfer?.getData('text/plain') ?? '0', 10);
            if (id) handleDrop(id, col.id);
          }}
        >
          <div class="column-header">
            <span class="column-title">{col.title}</span>
            <span class="column-count">{col.items.length}</span>
          </div>
          <div class="column-body">
            {#each col.items as adr}
              <button
                class="card"
                draggable="true"
                ondragstart={(e) => e.dataTransfer?.setData('text/plain', String(adr.id))}
                onclick={() => handleCardClick(adr)}
              >
                <div class="card-title">#{adr.id} {adr.title}</div>
                {#if adr.assignees.length > 0}
                  <div class="card-meta">{adr.assignees.join(', ')}</div>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if selectedAdr}
    <CardDetail item={selectedAdr} onclose={() => selectedAdr = null} />
  {/if}

  {#if showCreate}
    <CreateModal type="adr" onsubmit={handleCreate} onclose={() => showCreate = false} />
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

  .board {
    display: flex;
    gap: 16px;
  }

  .column {
    flex: 1;
    min-width: 0;
  }

  .column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-surface);
    border-radius: var(--radius);
    margin-bottom: 12px;
  }

  .column-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .column-count {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg);
    padding: 1px 6px;
    border-radius: 10px;
  }

  .column-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100px;
  }

  .card {
    display: block;
    width: 100%;
    text-align: left;
    padding: 12px;
    background: var(--bg-card, var(--bg-surface));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .card:hover {
    border-color: var(--accent);
  }

  .card-title {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
  }

  .card-meta {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 6px;
  }

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
