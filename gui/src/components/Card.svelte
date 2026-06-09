<script lang="ts">
  import type { PRD, Epic, Task } from '$lib/ccpm/types';

  let { item, onclick }: {
    item: PRD | Epic | Task;
    onclick?: () => void;
  } = $props();

  let progress = $derived('progress' in item ? (item as Task).progress : 0);
  let assignees = $derived(item.assignees || []);
</script>

<button class="card" {onclick} type="button">
  <div class="card-title">{item.title}</div>
  {#if item.labels.length > 0}
    <div class="card-labels">
      {#each item.labels as label}
        <span class="label-pill">{label}</span>
      {/each}
    </div>
  {/if}
  {#if 'bugCount' in item && item.bugCount > 0}
    <span class="bug-badge">{item.bugCount} bug{item.bugCount > 1 ? 's' : ''}</span>
  {/if}
  {#if progress > 0}
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
  {/if}
  {#if assignees.length > 0}
    <div class="card-assignees">
      {#each assignees as assignee}
        <span class="avatar" title={assignee}>{assignee.charAt(0).toUpperCase()}</span>
      {/each}
    </div>
  {/if}
</button>

<style>
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
    text-align: left;
    width: 100%;
    font-family: inherit;
    font-size: inherit;
    color: var(--text);
  }

  .card:hover {
    background: var(--bg-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .card-title {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .card-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .label-pill {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--bg-hover);
    color: var(--accent);
    border: 1px solid var(--border);
  }

  .bug-badge {
    display: inline-block;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    margin-bottom: 8px;
  }

  .progress-bar {
    height: 4px;
    background: var(--bg-hover);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s;
  }

  .card-assignees {
    display: flex;
    gap: 4px;
  }

  .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--purple);
    color: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
  }
</style>
