<script lang="ts">
  let { type, epicNames = [], prdOptions = [], onsubmit, onclose }: {
    type: 'prd' | 'epic' | 'task' | 'adr';
    epicNames?: string[];
    prdOptions?: { number: number; title: string }[];
    onsubmit: (data: { title: string; body: string; epicName?: string; prdNumber?: number }) => void;
    onclose: () => void;
  } = $props();

  let title = $state('');
  let body = $state('');
  let epicName = $state('');
  let selectedPrd = $state<number | null>(null);
  let selectedEpic = $state('');

  function handleSubmit() {
    if (!title.trim()) return;
    const data: { title: string; body: string; epicName?: string; prdNumber?: number } = {
      title: title.trim(),
      body: body.trim(),
    };
    if (type === 'epic') {
      data.epicName = epicName.trim();
      if (selectedPrd !== null) data.prdNumber = selectedPrd;
    }
    if (type === 'task' && selectedEpic) {
      data.epicName = selectedEpic;
    }
    onsubmit(data);
  }

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" onclick={handleBackdropClick} role="presentation">
  <div class="modal">
    <h2 class="modal-title">Create {type.toUpperCase()}</h2>
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <label class="field">
        <span class="field-label">Title</span>
        <input
          type="text"
          class="field-input"
          bind:value={title}
          placeholder="Enter title..."
        />
      </label>

      <label class="field">
        <span class="field-label">Body</span>
        <textarea
          class="field-textarea"
          bind:value={body}
          placeholder="Markdown content..."
          rows="6"
        ></textarea>
      </label>

      {#if type === 'epic'}
        <label class="field">
          <span class="field-label">Epic Name</span>
          <input
            type="text"
            class="field-input"
            bind:value={epicName}
            placeholder="my-epic-name"
          />
        </label>
        {#if prdOptions.length > 0}
          <label class="field">
            <span class="field-label">PRD</span>
            <select class="field-input" bind:value={selectedPrd}>
              <option value={null}>None</option>
              {#each prdOptions as prd}
                <option value={prd.number}>#{prd.number} - {prd.title}</option>
              {/each}
            </select>
          </label>
        {/if}
      {/if}

      {#if type === 'task'}
        {#if epicNames.length > 0}
          <label class="field">
            <span class="field-label">Epic</span>
            <select class="field-input" bind:value={selectedEpic}>
              <option value="">None</option>
              {#each epicNames as name}
                <option value={name}>{name}</option>
              {/each}
            </select>
          </label>
        {/if}
      {/if}

      <div class="modal-actions">
        <button type="button" class="btn-cancel" onclick={onclose}>Cancel</button>
        <button type="submit" class="btn-submit" disabled={!title.trim()}>Create</button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .modal {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-title {
    margin: 0 0 20px;
    font-size: 18px;
    color: var(--text);
  }

  .field {
    display: block;
    margin-bottom: 16px;
  }

  .field-label {
    display: block;
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .field-input,
  .field-textarea {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
  }

  .field-input:focus,
  .field-textarea:focus {
    border-color: var(--accent);
  }

  .field-textarea {
    resize: vertical;
    min-height: 100px;
  }

  select.field-input {
    cursor: pointer;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .btn-cancel {
    padding: 8px 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
  }

  .btn-cancel:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .btn-submit {
    padding: 8px 18px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius);
    color: var(--bg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-submit:hover:not(:disabled) {
    background: var(--accent-hover);
  }
</style>
