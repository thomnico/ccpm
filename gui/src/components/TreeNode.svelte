<script lang="ts">
  import type { DepsNode } from '$lib/ccpm/types';
  import TreeNode from './TreeNode.svelte';

  let { node, depth = 0 }: { node: DepsNode; depth?: number } = $props();

  let userToggled = $state(false);
  let userExpanded = $state(false);
  let expanded = $derived(userToggled ? userExpanded : depth < 2);

  function toggle() {
    if (node.children.length > 0) {
      userToggled = true;
      userExpanded = !expanded;
    }
  }

  function navigate() {
    if (node.type === 'prd') {
      window.location.hash = `#/epics/${node.id}`;
    } else if (node.type === 'epic') {
      window.location.hash = `#/tasks/${node.title}`;
    }
  }

  const statusColor: Record<string, string> = {
    'backlog': 'var(--text-muted)',
    'in-progress': 'var(--accent)',
    'complete': 'var(--green, #22c55e)',
    'closed': 'var(--green, #22c55e)',
  };

  const typeBadge: Record<string, string> = {
    prd: 'PRD',
    epic: 'Epic',
    task: 'Task',
  };
</script>

<div class="tree-node" style="padding-left: {depth * 20}px">
  <div class="node-row">
    <button
      class="chevron"
      class:has-children={node.children.length > 0}
      class:expanded
      onclick={toggle}
      type="button"
      aria-label={expanded ? 'Collapse' : 'Expand'}
    >
      {#if node.children.length > 0}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M5 3l4 4-4 4" />
        </svg>
      {/if}
    </button>
    <span class="status-dot" style="background: {statusColor[node.status] || 'var(--text-muted)'}"></span>
    <span class="type-badge type-{node.type}">{typeBadge[node.type]}</span>
    {#if node.type !== 'task'}
      <button class="node-title clickable" onclick={navigate} type="button">
        {node.title}
      </button>
    {:else}
      <span class="node-title">{node.title}</span>
    {/if}
    {#if node.bugCount && node.bugCount > 0}
      <span class="bug-badge">{node.bugCount} bug{node.bugCount > 1 ? 's' : ''}</span>
    {/if}
    <span class="node-id">#{node.id}</span>
  </div>
  {#if expanded && node.children.length > 0}
    <div class="children">
      {#each node.children as child (child.id)}
        <TreeNode node={child} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-node {
    position: relative;
  }

  .node-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius);
    transition: background 0.1s;
  }

  .node-row:hover {
    background: var(--bg-hover);
  }

  .chevron {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: default;
    padding: 0;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .chevron.has-children {
    cursor: pointer;
  }

  .chevron.has-children:hover {
    color: var(--text);
  }

  .chevron.expanded {
    transform: rotate(90deg);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .type-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .type-prd {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
  }

  .type-epic {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .type-task {
    background: rgba(107, 114, 128, 0.15);
    color: #9ca3af;
  }

  .node-title {
    font-size: 13px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .node-title.clickable {
    background: none;
    border: none;
    font-family: inherit;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    padding: 0;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .node-title.clickable:hover {
    color: var(--accent);
    text-decoration: underline;
  }

  .bug-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    flex-shrink: 0;
  }

  .node-id {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
    margin-left: auto;
  }

  .children {
    border-left: 1px solid var(--border);
    margin-left: 18px;
  }
</style>
