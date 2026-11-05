<script lang="ts">
  import type { PRD, Epic, Task, ADR } from '$lib/ccpm/types';
  import { marked } from 'marked';
  import { getClient } from '$lib/stores/client-helper';

  let { item, onclose }: {
    item: PRD | Epic | Task | ADR;
    onclose: () => void;
  } = $props();

  let renderedBody = $derived(item.body ? marked.parse(item.body) as string : '');
  let commentText = $state('');
  let submitting = $state(false);
  let commentError = $state('');

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('detail-overlay')) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    const client = getClient();
    if (!client) return;
    submitting = true;
    commentError = '';
    try {
      await client.createComment(item.id, commentText.trim());
      commentText = '';
    } catch (err) {
      commentError = 'Failed to post comment.';
      console.error(err);
    } finally {
      submitting = false;
    }
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

    <div class="comment-section">
      <h3 class="comment-heading">Add comment</h3>
      <textarea
        class="comment-input"
        bind:value={commentText}
        placeholder="Leave a comment..."
        rows="4"
      ></textarea>
      {#if commentError}
        <div class="comment-error">{commentError}</div>
      {/if}
      <button
        class="btn-comment"
        onclick={submitComment}
        disabled={submitting || !commentText.trim()}
      >
        {submitting ? 'Posting…' : 'Comment'}
      </button>
    </div>
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

  .comment-section {
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .comment-heading {
    margin: 0;
    font-size: 14px;
    color: var(--text);
  }

  .comment-input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    padding: 8px 10px;
    resize: vertical;
    box-sizing: border-box;
  }

  .comment-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .comment-error {
    font-size: 12px;
    color: var(--red, #ef4444);
  }

  .btn-comment {
    align-self: flex-end;
    padding: 7px 16px;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-comment:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-comment:not(:disabled):hover {
    background: var(--accent-hover);
  }
</style>
