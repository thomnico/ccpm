<script lang="ts">
  import type { BoardColumn, ItemStatus } from '$lib/ccpm/types';
  import Column from './Column.svelte';

  let { columns, onDrop }: {
    columns: BoardColumn[];
    onDrop: (itemId: number, newStatus: ItemStatus) => void;
  } = $props();
</script>

<div class="board">
  {#each columns as col (col.id)}
    <Column
      title={col.title}
      items={col.items}
      status={col.status}
      {onDrop}
    />
  {/each}
</div>

<style>
  .board {
    display: flex;
    gap: 16px;
    padding: 16px;
    overflow-x: auto;
    height: calc(100vh - 48px);
  }
</style>
