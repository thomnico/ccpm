<script lang="ts">
  import type { StreamEntry as StreamEntryType } from '$lib/ccpm/types';

  let { entry }: { entry: StreamEntryType } = $props();

  function iconColor(type: StreamEntryType['type']): string {
    switch (type) {
      case 'progress': return 'var(--accent)';
      case 'completed': return 'var(--green)';
      case 'blocked': return 'var(--red)';
      case 'info': return 'var(--text-muted)';
    }
  }

  function formatTime(ts: string): string {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  }
</script>

<div class="entry">
  <div class="icon-col">
    <span class="icon-circle" style="background: {iconColor(entry.type)}"></span>
  </div>
  <div class="content-col">
    <div class="entry-header">
      <span class="entry-time">{formatTime(entry.timestamp)}</span>
    </div>
    <div class="entry-message">{entry.message}</div>
    {#if entry.items.length > 0}
      <ul class="entry-items">
        {#each entry.items as item}
          <li>{item}</li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .entry {
    display: flex;
    gap: 10px;
  }

  .icon-col {
    flex-shrink: 0;
    padding-top: 4px;
  }

  .icon-circle {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .content-col {
    flex: 1;
    min-width: 0;
  }

  .entry-header {
    margin-bottom: 2px;
  }

  .entry-time {
    font-size: 11px;
    color: var(--text-muted);
  }

  .entry-message {
    font-size: 13px;
    color: var(--text);
    line-height: 1.4;
  }

  .entry-items {
    margin: 4px 0 0;
    padding-left: 16px;
    font-size: 12px;
    color: var(--text-muted);
    list-style: disc;
  }

  .entry-items li {
    margin-bottom: 2px;
  }
</style>
