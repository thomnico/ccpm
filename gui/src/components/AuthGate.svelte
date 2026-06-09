<script lang="ts">
  import type { Snippet } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { GitHubClient } from '$lib/github/client';
  import { getClientId, requestDeviceCode, pollForToken } from '$lib/github/oauth';
  import type { DeviceCodeResponse } from '$lib/github/oauth';

  let { children }: { children: Snippet } = $props();

  // Auth state
  let tokenValue = $state('');
  auth.token.subscribe((v) => (tokenValue = v));
  let isAuth = $derived(tokenValue.length > 0);

  // OAuth state machine: idle | code_shown | polling | success | error
  let oauthState = $state<'idle' | 'code_shown' | 'polling' | 'success' | 'error'>('idle');
  let deviceData = $state<DeviceCodeResponse | null>(null);
  let oauthError = $state('');

  // PAT fallback
  let showPat = $state(false);
  let tokenInput = $state('');
  let patError = $state('');
  let patLoading = $state(false);

  async function startOAuth() {
    const clientId = getClientId();
    await beginDeviceFlow(clientId);
  }

  async function beginDeviceFlow(clientId: string) {
    oauthError = '';
    try {
      deviceData = await requestDeviceCode(clientId);
      oauthState = 'code_shown';
    } catch (e: any) {
      oauthError = e.message || 'Failed to start OAuth flow';
      oauthState = 'error';
    }
  }

  async function startPolling() {
    if (!deviceData) return;
    oauthState = 'polling';
    const clientId = getClientId();

    for await (const result of pollForToken(clientId, deviceData.device_code, deviceData.interval)) {
      if (result.status === 'success' && result.token) {
        auth.setToken(result.token);
        // Fetch username
        try {
          const client = new GitHubClient(result.token, '', '');
          const valid = await client.validateToken();
          if (valid) {
            // getAuthenticated returns user data — we re-fetch it here
            const res = await fetch('https://api.github.com/user', {
              headers: { Authorization: `Bearer ${result.token}` },
            });
            if (res.ok) {
              const user = await res.json();
              auth.setUsername(user.login);
            }
          }
        } catch {}
        oauthState = 'success';
        return;
      }
      if (result.status === 'expired' || result.status === 'error') {
        oauthError = result.error || 'Authorization failed';
        oauthState = 'error';
        return;
      }
      // pending — keep polling
    }
  }

  function copyCode() {
    if (deviceData?.user_code) {
      navigator.clipboard.writeText(deviceData.user_code);
    }
  }

  async function handlePatConnect() {
    patError = '';
    if (!tokenInput.trim()) {
      patError = 'Token is required';
      return;
    }
    patLoading = true;
    try {
      const client = new GitHubClient(tokenInput.trim(), '', '');
      const valid = await client.validateToken();
      if (valid) {
        auth.setToken(tokenInput.trim());
      } else {
        patError = 'Invalid token. Please check your PAT and try again.';
      }
    } catch (e: any) {
      patError = e.message || 'Failed to validate token';
    } finally {
      patLoading = false;
    }
  }

  function resetOAuth() {
    oauthState = 'idle';
    oauthError = '';
    deviceData = null;
  }
</script>

{#if isAuth}
  {@render children()}
{:else}
  <div class="auth-backdrop">
    <div class="auth-card">
      <h2 class="auth-title">Connect to GitHub</h2>

      {#if showPat}
        <!-- PAT fallback -->
        <p class="auth-desc">Enter a personal access token with repo scope.</p>
        <form onsubmit={(e) => { e.preventDefault(); handlePatConnect(); }}>
          <input
            type="password"
            class="auth-input"
            placeholder="ghp_xxxxxxxxxxxx"
            bind:value={tokenInput}
            disabled={patLoading}
          />
          {#if patError}
            <p class="auth-error">{patError}</p>
          {/if}
          <button type="submit" class="auth-btn" disabled={patLoading}>
            {patLoading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
        <button class="auth-link" onclick={() => { showPat = false; resetOAuth(); }}>
          Sign in with GitHub instead
        </button>

      {:else if oauthState === 'idle'}
        <p class="auth-desc">Sign in with your GitHub account via OAuth.</p>
        <button class="auth-btn" onclick={startOAuth}>Sign in with GitHub</button>
        <button class="auth-link" onclick={() => (showPat = true)}>
          Or use a personal access token
        </button>

      {:else if oauthState === 'code_shown' || oauthState === 'polling'}
        <p class="auth-desc">Enter this code on GitHub:</p>
        <div class="code-display">
          <span class="user-code">{deviceData?.user_code}</span>
          <button class="copy-btn" onclick={copyCode} title="Copy code">Copy</button>
        </div>
        <a
          class="auth-btn gh-link"
          href={deviceData?.verification_uri}
          target="_blank"
          rel="noopener"
          onclick={() => startPolling()}
        >
          Open GitHub
        </a>
        {#if oauthState === 'polling'}
          <p class="auth-status">Waiting for authorization...</p>
        {/if}
        <button class="auth-link" onclick={resetOAuth}>Cancel</button>

      {:else if oauthState === 'error'}
        <p class="auth-error">{oauthError}</p>
        <button class="auth-btn" onclick={resetOAuth}>Try again</button>
        <button class="auth-link" onclick={() => (showPat = true)}>
          Or use a personal access token
        </button>

      {:else if oauthState === 'success'}
        <p class="auth-status">Authenticated! Redirecting...</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .auth-backdrop {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg);
  }

  .auth-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    max-width: 400px;
    width: 100%;
    text-align: center;
  }

  .auth-title {
    margin: 0 0 8px;
    font-size: 20px;
    color: var(--text);
  }

  .auth-desc {
    margin: 0 0 20px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .auth-input {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
  }

  .auth-input:focus {
    border-color: var(--accent);
  }

  .auth-error {
    color: var(--red);
    font-size: 13px;
    margin: 8px 0 0;
  }

  .auth-btn {
    display: inline-block;
    margin-top: 16px;
    width: 100%;
    padding: 10px;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
  }

  .auth-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .gh-link {
    display: block;
  }

  .auth-link {
    display: block;
    margin-top: 16px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
  }

  .auth-link:hover {
    color: var(--text);
  }

  .code-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 16px 0;
  }

  .user-code {
    font-family: monospace;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 4px;
    color: var(--text);
    padding: 12px 20px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .copy-btn {
    padding: 8px 12px;
    background: var(--bg-surface, var(--bg));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }

  .copy-btn:hover {
    color: var(--text);
    border-color: var(--text-muted);
  }

  .auth-status {
    color: var(--text-muted);
    font-size: 13px;
    margin-top: 12px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
