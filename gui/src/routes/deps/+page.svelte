<script lang="ts">
  import type { DepsNode } from '$lib/ccpm/types';
  import { depsStore } from '$lib/stores/deps';
  import { createBoardPoller } from '$lib/stores/polling';
  import TreeNode from '../../components/TreeNode.svelte';

  const { tree, loading, refresh } = depsStore;

  $effect(() => {
    refresh();
    const stop = createBoardPoller(refresh);
    return stop;
  });

  function countNodes(nodes: DepsNode[], type: string): number {
    let count = 0;
    for (const n of nodes) {
      if (n.type === type) count++;
      count += countNodes(n.children, type);
    }
    return count;
  }

  function countBugs(nodes: DepsNode[]): number {
    let count = 0;
    for (const n of nodes) {
      if (n.bugCount) count += n.bugCount;
      count += countBugs(n.children);
    }
    return count;
  }

  let prdCount = $derived(countNodes($tree, 'prd'));
  let epicCount = $derived(countNodes($tree, 'epic'));
  let taskCount = $derived(countNodes($tree, 'task'));
  let bugCount = $derived(countBugs($tree));
</script>

<div class="page">
  <header class="page-header">
    <h1>Dependencies</h1>
  </header>

  <div class="stats">
    <div class="stat">
      <span class="stat-value">{prdCount}</span>
      <span class="stat-label">PRDs</span>
    </div>
    <div class="stat">
      <span class="stat-value">{epicCount}</span>
      <span class="stat-label">Epics</span>
    </div>
    <div class="stat">
      <span class="stat-value">{taskCount}</span>
      <span class="stat-label">Tasks</span>
    </div>
    {#if bugCount > 0}
      <div class="stat stat-bug">
        <span class="stat-value">{bugCount}</span>
        <span class="stat-label">Bugs</span>
      </div>
    {/if}
  </div>

  {#if $loading && $tree.length === 0}
    <div class="skeleton-tree">
      {#each [1, 2, 3] as _}
        <div class="skeleton-row"></div>
        <div class="skeleton-row indent"></div>
        <div class="skeleton-row indent"></div>
        <div class="skeleton-row double-indent"></div>
      {/each}
    </div>
  {:else if $tree.length === 0}
    <div class="empty">No PRDs found. Create a PRD to get started.</div>
  {:else}
    <div class="tree">
      {#each $tree as node (node.id)}
        <TreeNode {node} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 900px;
  }

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

  .stats {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .stat-bug .stat-value {
    color: #ef4444;
  }

  .tree {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 8px;
  }

  .empty {
    text-align: center;
    padding: 48px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .skeleton-tree {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-row {
    height: 32px;
    background: var(--bg-surface);
    border-radius: var(--radius);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-row.indent {
    margin-left: 24px;
    width: calc(100% - 24px);
  }

  .skeleton-row.double-indent {
    margin-left: 48px;
    width: calc(100% - 48px);
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
</style>
