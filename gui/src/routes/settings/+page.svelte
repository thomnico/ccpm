<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { repoStore } from '$lib/stores/repo';
  import { getClient } from '$lib/stores/client-helper';
  let ownerInput = $state('');
  let nameInput = $state('');
  let tokenValue = $state('');
  let usernameValue = $state('');
  let showTokenInput = $state(false);
  let newToken = $state('');
  let boardInterval = $state(30);
  let commentInterval = $state(15);
  let rateRemaining = $state(5000);
  let rateLimit = $state(5000);

  // Subscribe to stores
  repoStore.repo.subscribe((r) => {
    ownerInput = r.owner;
    nameInput = r.name;
  });

  auth.token.subscribe((t) => {
    tokenValue = t;
  });

  auth.username.subscribe((u) => {
    usernameValue = u;
  });

  $effect(() => {
    // Load polling intervals from localStorage
    const storedBoard = localStorage.getItem('ccpm-poll-board');
    const storedComment = localStorage.getItem('ccpm-poll-comment');
    if (storedBoard) boardInterval = parseInt(storedBoard, 10);
    if (storedComment) commentInterval = parseInt(storedComment, 10);

    // Load rate limit info
    const client = getClient();
    if (client) {
      rateRemaining = client.rateLimit.remaining;
      rateLimit = client.rateLimit.limit;
    }
  });

  function maskedToken(t: string): string {
    if (t.length <= 4) return '****';
    return '****...' + t.slice(-4);
  }

  function saveRepo() {
    repoStore.setRepo(ownerInput.trim(), nameInput.trim());
  }

  function handleChangeToken() {
    showTokenInput = true;
  }

  function handleSaveToken() {
    if (newToken.trim()) {
      auth.setToken(newToken.trim());
      newToken = '';
      showTokenInput = false;
    }
  }

  function handleDisconnect() {
    auth.clearToken();
  }

  function saveBoardInterval() {
    localStorage.setItem('ccpm-poll-board', String(boardInterval));
  }

  function saveCommentInterval() {
    localStorage.setItem('ccpm-poll-comment', String(commentInterval));
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Settings</h1>
  </header>

  <div class="sections">
    <!-- Repository -->
    <section class="card">
      <h2>Repository</h2>
      <div class="field-row">
        <label>
          <span>Owner</span>
          <input type="text" bind:value={ownerInput} placeholder="owner" />
        </label>
        <label>
          <span>Repository</span>
          <input type="text" bind:value={nameInput} placeholder="repo-name" />
        </label>
      </div>
      <div class="btn-row">
        <button class="btn-primary" onclick={saveRepo}>Save</button>
        <button class="btn-secondary" onclick={() => { repoStore.setRepo('', ''); }}>Switch Repo</button>
      </div>
    </section>

    <!-- GitHub Account -->
    <section class="card">
      <h2>GitHub Account</h2>
      {#if tokenValue}
        {#if usernameValue}
          <p class="connected-user">Connected as <strong>{usernameValue}</strong></p>
        {/if}
        <p class="token-display">{maskedToken(tokenValue)}</p>
        {#if showTokenInput}
          <div class="field-row">
            <input type="password" bind:value={newToken} placeholder="ghp_xxxx" />
            <button class="btn-primary" onclick={handleSaveToken}>Save</button>
          </div>
        {:else}
          <div class="btn-row">
            <button class="btn-secondary" onclick={handleChangeToken}>Change token</button>
            <button class="btn-danger" onclick={handleDisconnect}>Disconnect</button>
          </div>
        {/if}
      {:else}
        <p class="text-muted">No token set. Return to login.</p>
      {/if}
    </section>

    <!-- Polling -->
    <section class="card">
      <h2>Polling Intervals</h2>
      <label class="slider-label">
        <span>Board refresh: {boardInterval}s</span>
        <input
          type="range"
          min="10"
          max="120"
          step="5"
          bind:value={boardInterval}
          oninput={saveBoardInterval}
        />
      </label>
      <label class="slider-label">
        <span>Comment refresh: {commentInterval}s</span>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          bind:value={commentInterval}
          oninput={saveCommentInterval}
        />
      </label>
    </section>

    <!-- Rate Limit -->
    <section class="card">
      <h2>Rate Limit</h2>
      <div class="rate-info">
        <span class="rate-value">{rateRemaining}</span>
        <span class="rate-sep">/</span>
        <span class="rate-total">{rateLimit}</span>
        <span class="rate-label">requests remaining</span>
      </div>
      <div class="rate-bar">
        <div
          class="rate-fill"
          style:width="{rateLimit > 0 ? (rateRemaining / rateLimit) * 100 : 0}%"
        ></div>
      </div>
    </section>
  </div>
</div>

<style>
  .page { max-width: 680px; }

  .page-header { margin-bottom: 24px; }
  .page-header h1 { margin: 0; font-size: 24px; color: var(--text); }

  .sections { display: flex; flex-direction: column; gap: 20px; }

  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
  }

  .card h2 {
    margin: 0 0 16px;
    font-size: 16px;
    color: var(--text);
  }

  .field-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .field-row label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-row label span {
    font-size: 12px;
    color: var(--text-muted);
  }

  .field-row input, input[type="password"] {
    padding: 8px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 14px;
    outline: none;
  }

  .field-row input:focus, input[type="password"]:focus {
    border-color: var(--accent);
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

  .btn-secondary {
    padding: 8px 16px;
    background: var(--bg-surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
    cursor: pointer;
  }

  .btn-secondary:hover { background: var(--bg-hover); }

  .btn-danger {
    padding: 8px 16px;
    background: var(--red);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-size: 14px;
    cursor: pointer;
  }

  .btn-danger:hover { opacity: 0.9; }

  .btn-row { display: flex; gap: 8px; }

  .token-display {
    font-family: monospace;
    font-size: 14px;
    color: var(--text-muted);
    margin: 0 0 12px;
  }

  .text-muted { color: var(--text-muted); font-size: 14px; }

  .connected-user {
    font-size: 14px;
    color: var(--text);
    margin: 0 0 8px;
  }

  .slider-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .slider-label span {
    font-size: 13px;
    color: var(--text);
  }

  .slider-label input[type="range"] {
    width: 100%;
    accent-color: var(--accent);
  }

  .rate-info {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 10px;
  }

  .rate-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
  }

  .rate-sep { color: var(--text-muted); font-size: 16px; }
  .rate-total { color: var(--text-muted); font-size: 16px; }
  .rate-label { color: var(--text-muted); font-size: 13px; margin-left: 6px; }

  .rate-bar {
    height: 6px;
    background: var(--bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .rate-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
</style>
