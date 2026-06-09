<script lang="ts">
  import type { AgentStream } from '$lib/ccpm/types';
  import StreamEntry from './StreamEntry.svelte';

  let { streams }: { streams: AgentStream[] } = $props();

  function statusColor(status: AgentStream['status']): string {
    switch (status) {
      case 'running': return 'var(--accent)';
      case 'completed': return 'var(--green)';
      case 'blocked': return 'var(--red)';
      case 'idle': return 'var(--text-muted)';
    }
  }
</script>

<div class="agent-panel">
  {#each streams as stream (stream.id)}
    <div class="stream-section">
      <div class="stream-header">
        <span class="stream-name">{stream.name}</span>
        <span class="status-badge" style="background: {statusColor(stream.status)}">
          {stream.status}
        </span>
      </div>
      {#if stream.progress > 0}
        <div class="progress-bar">
          <div class="progress-fill" style="width: {stream.progress}%"></div>
        </div>
      {/if}
      <div class="stream-entries">
        {#each stream.entries as entry}
          <StreamEntry {entry} />
        {/each}
      </div>
    </div>
  {/each}
  {#if streams.length === 0}
    <div class="empty">No active agent streams</div>
  {/if}
</div>

<style>
  .agent-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .stream-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
  }

  .stream-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .stream-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .status-badge {
    font-size: 11px;
    padding: 2px 10px;
    border-radius: 10px;
    color: var(--bg);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .progress-bar {
    height: 4px;
    background: var(--bg-hover);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s;
  }

  .stream-entries {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty {
    color: var(--text-muted);
    font-size: 14px;
    text-align: center;
    padding: 32px;
  }
</style>
