<script lang="ts">
  import type { PRD, Epic, Task } from '$lib/ccpm/types';
  import { marked } from 'marked';

  let { item, onclose }: {
    item: PRD | Epic | Task;
    onclose: () => void;
  } = $props();

  let renderedBody = $derived(item.body ? marked.parse(item.body) as string : '');

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('detail-overlay')) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="detail-overlay" onclick={handleBackdropClick} role="presentation">
  <div class="detail-panel">
    <button class="close-btn" onclick={onclose} type="button">&times;</button>
    <h2 class="detail-title">{item.title}</h2>

    {#if item.labels.length > 0}
      <div class="detail-labels">
        {#each item.labels as label}
          <span class="label-pill">{label}</span>
        {/each}
      </div>
    {/if}

    {#if item.assignees.length > 0}
      <div class="detail-assignees">
        <span class="detail-label">Assignees:</span>
        {#each item.assignees as assignee}
          <span class="assignee-tag">{assignee}</span>
        {/each}
      </div>
    {/if}

    <div class="detail-body">
      {@html renderedBody}
    </div>

    <a class="gh-link" href={item.htmlUrl} target="_blank" rel="noopener noreferrer">
      View on GitHub
    </a>
  </div>
</div>

<style>
  .detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .detail-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px;
    background: var(--bg-surface);
    border-left: 1px solid var(--border);
    overflow-y: auto;
    padding: 24px;
    z-index: 101;
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .close-btn:hover {
    color: var(--text);
  }

  .detail-title {
    margin: 0 0 16px;
    font-size: 18px;
    color: var(--text);
    padding-right: 32px;
  }

  .detail-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  .label-pill {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 10px;
    background: var(--bg-hover);
    color: var(--accent);
    border: 1px solid var(--border);
  }

  .detail-assignees {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .detail-label {
    font-size: 13px;
    color: var(--text-muted);
  }

  .assignee-tag {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 10px;
    background: var(--purple);
    color: var(--bg);
  }

  .detail-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text);
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-bottom: 16px;
  }

  .detail-body :global(h1),
  .detail-body :global(h2),
  .detail-body :global(h3) {
    color: var(--text);
    margin-top: 16px;
  }

  .detail-body :global(code) {
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  .detail-body :global(pre) {
    background: var(--bg);
    padding: 12px;
    border-radius: var(--radius);
    overflow-x: auto;
  }

  .detail-body :global(a) {
    color: var(--accent);
  }

  .gh-link {
    display: inline-block;
    color: var(--accent);
    font-size: 13px;
    text-decoration: none;
  }

  .gh-link:hover {
    text-decoration: underline;
  }
</style>
