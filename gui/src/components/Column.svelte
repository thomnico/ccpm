<script lang="ts">
  import type { PRD, Epic, Task, ItemStatus } from '$lib/ccpm/types';
  import { dndzone } from 'svelte-dnd-action';
  import Card from './Card.svelte';

  let { title, items, status, onDrop, onCardClick }: {
    title: string;
    items: (PRD | Epic | Task)[];
    status: ItemStatus;
    onDrop: (itemId: number, newStatus: ItemStatus) => void;
    onCardClick?: (item: PRD | Epic | Task) => void;
  } = $props();

  let columnItems = $state<any[]>([]);

  $effect(() => {
    columnItems = items.map((item) => ({ ...item, id: item.id }));
  });

  function handleConsider(e: CustomEvent<{ items: any[] }>) {
    columnItems = e.detail.items;
  }

  function handleFinalize(e: CustomEvent<{ items: any[] }>) {
    columnItems = e.detail.items;
    for (const item of e.detail.items) {
      const original = items.find((i) => i.id === item.id);
      if (!original) {
        onDrop(item.id, status);
      }
    }
  }
</script>

<div class="column">
  <div class="column-header">
    <span class="column-title">{title}</span>
    <span class="column-count">{columnItems.length}</span>
  </div>
  <div
    class="column-body"
    use:dndzone={{ items: columnItems, type: 'card' }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
  >
    {#each columnItems as item (item.id)}
      <Card {item} onclick={() => onCardClick?.(item)} />
    {/each}
  </div>
</div>

<style>
  .column {
    flex: 1;
    min-width: 260px;
    max-width: 340px;
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }

  .column-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .column-count {
    background: var(--bg-hover);
    color: var(--text-muted);
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .column-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 60px;
  }
</style>
