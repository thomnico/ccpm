<script lang="ts">
  import type { Task, BoardColumn } from '$lib/ccpm/types';
  import { LABELS } from '$lib/ccpm/labels';
  import { taskStore } from '$lib/stores/tasks';
  import { streamStore } from '$lib/stores/streams';
  import { createBoardPoller, createCommentPoller } from '$lib/stores/polling';
  import { getClient } from '$lib/stores/client-helper';
  import Board from '../../components/Board.svelte';
  import CardDetail from '../../components/CardDetail.svelte';
  import CreateModal from '../../components/CreateModal.svelte';
  import AgentPanel from '../../components/AgentPanel.svelte';

  let { params } = $props<{ params: { epic: string } }>();

  const { tasks, loading, refreshByEpic } = taskStore;
  const { streams } = streamStore;

  let selectedTask: Task | null = $state(null);
  let showCreate = $state(false);
  let stopCommentPoller: (() => void) | null = $state(null);

  $effect(() => {
    refreshByEpic(params.epic);
    const stopBoard = createBoardPoller(() => refreshByEpic(params.epic));
    return () => {
      stopBoard();
      if (stopCommentPoller) stopCommentPoller();
    };
  });

  $effect(() => {
    if (selectedTask) {
      if (stopCommentPoller) stopCommentPoller();
      streamStore.refreshForTask(selectedTask.id);
      stopCommentPoller = createCommentPoller(() =>
        streamStore.refreshForTask(selectedTask!.id)
      );
    }
  });

  function buildColumns(items: Task[]): BoardColumn[] {
    return [
      { id: 'backlog', title: 'Open', status: 'backlog', items: items.filter(i => i.status === 'backlog') },
      { id: 'in-progress', title: 'In Progress', status: 'in-progress', items: items.filter(i => i.status === 'in-progress') },
      { id: 'closed', title: 'Closed', status: 'closed', items: items.filter(i => i.status === 'closed' || i.status === 'complete') },
    ];
  }

  async function handleDrop(id: number, status: string) {
    const client = getClient();
    if (!client) return;

    tasks.update(list =>
      list.map(t =>
        t.id === id ? { ...t, status: status as Task['status'] } : t
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
      console.error('Failed to update task status:', err);
      refreshByEpic(params.epic);
    }
  }

  function handleCardClick(task: Task) {
    selectedTask = task;
  }

  async function handleCreate(data: { title: string; body: string }) {
    const client = getClient();
    if (!client) return;
    try {
      await client.createIssue(data.title, data.body, [LABELS.TASK, `epic:${params.epic}`]);
      showCreate = false;
      refreshByEpic(params.epic);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }
</script>

<div class="page">
  <nav class="breadcrumb">
    <a href="#/prds">PRDs</a>
    <span class="sep">/</span>
    <span>Epic: {params.epic}</span>
    <span class="sep">/</span>
    <span class="current">Tasks</span>
  </nav>

  <header class="page-header">
    <h1>Tasks for {params.epic}</h1>
    <button class="btn-primary" onclick={() => showCreate = true}>New Task</button>
  </header>

  <div class="split-layout">
    <div class="board-panel">
      {#if $loading}
        <div class="skeleton-board">
          {#each [1, 2, 3] as _}
            <div class="skeleton-column">
              <div class="skeleton-bar"></div>
              <div class="skeleton-card"></div>
            </div>
          {/each}
        </div>
      {:else}
        <Board
          columns={buildColumns($tasks)}
          onDrop={(id, status) => handleDrop(id, status)}
        />
      {/if}
    </div>

    {#if selectedTask}
      <div class="agent-panel">
        <div class="panel-header">
          <h3>Agent Activity</h3>
          <button class="btn-close" onclick={() => selectedTask = null}>X</button>
        </div>
        <AgentPanel streams={$streams} />
      </div>
    {/if}
  </div>

  {#if selectedTask}
    <CardDetail item={selectedTask} onclose={() => selectedTask = null} />
  {/if}

  {#if showCreate}
    <CreateModal type="task" epicNames={[params.epic]} onsubmit={handleCreate} onclose={() => showCreate = false} />
  {/if}
</div>

<style>
  .page { max-width: 1400px; }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .breadcrumb a { color: var(--accent); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { color: var(--text-muted); }
  .breadcrumb .current { color: var(--text); }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .page-header h1 { margin: 0; font-size: 24px; color: var(--text); }

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

  .split-layout {
    display: flex;
    gap: 24px;
  }

  .board-panel { flex: 2; min-width: 0; }

  .agent-panel {
    flex: 1;
    min-width: 300px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .panel-header h3 { margin: 0; font-size: 16px; color: var(--text); }

  .btn-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
  }

  .btn-close:hover { color: var(--text); }

  .skeleton-board { display: flex; gap: 16px; }
  .skeleton-column { flex: 1; display: flex; flex-direction: column; gap: 12px; }
  .skeleton-bar { height: 32px; background: var(--bg-surface); border-radius: var(--radius); animation: pulse 1.5s ease-in-out infinite; }
  .skeleton-card { height: 80px; background: var(--bg-surface); border-radius: var(--radius); animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
</style>
