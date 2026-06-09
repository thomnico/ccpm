<script lang="ts">
  import { marked } from 'marked';

  let { content, path, sha, onsave }: {
    content: string;
    path: string;
    sha: string;
    onsave: (newContent: string) => void;
  } = $props();

  let editedContent = $state('');
  let mode = $state<'edit' | 'preview'>('edit');

  $effect(() => {
    editedContent = content;
  });

  let isDirty = $derived(editedContent !== content);
  let renderedPreview = $derived(marked.parse(editedContent) as string);

  function handleSave() {
    onsave(editedContent);
  }
</script>

<div class="editor">
  <div class="editor-header">
    <span class="file-path">{path}</span>
    <div class="editor-actions">
      <button
        class="mode-btn"
        class:active={mode === 'edit'}
        onclick={() => (mode = 'edit')}
        type="button"
      >Edit</button>
      <button
        class="mode-btn"
        class:active={mode === 'preview'}
        onclick={() => (mode = 'preview')}
        type="button"
      >Preview</button>
      <button
        class="save-btn"
        onclick={handleSave}
        disabled={!isDirty}
        type="button"
      >Save</button>
    </div>
  </div>
  <div class="editor-body">
    {#if mode === 'edit'}
      <textarea
        class="editor-textarea"
        bind:value={editedContent}
        spellcheck="false"
      ></textarea>
    {:else}
      <div class="preview-content">
        {@html renderedPreview}
      </div>
    {/if}
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }

  .file-path {
    font-size: 13px;
    color: var(--text-muted);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .editor-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .mode-btn {
    padding: 5px 12px;
    font-size: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-muted);
    cursor: pointer;
  }

  .mode-btn.active {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--accent);
  }

  .save-btn {
    padding: 5px 14px;
    font-size: 12px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius);
    color: var(--bg);
    font-weight: 600;
    cursor: pointer;
  }

  .save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .editor-body {
    flex: 1;
    overflow: hidden;
  }

  .editor-textarea {
    width: 100%;
    height: 100%;
    padding: 14px;
    background: var(--bg);
    border: none;
    color: var(--text);
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.6;
    resize: none;
    outline: none;
    box-sizing: border-box;
  }

  .preview-content {
    padding: 14px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text);
    overflow-y: auto;
    height: 100%;
  }

  .preview-content :global(h1),
  .preview-content :global(h2),
  .preview-content :global(h3) {
    color: var(--text);
    margin-top: 16px;
  }

  .preview-content :global(code) {
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  .preview-content :global(pre) {
    background: var(--bg);
    padding: 12px;
    border-radius: var(--radius);
    overflow-x: auto;
  }

  .preview-content :global(a) {
    color: var(--accent);
  }
</style>
