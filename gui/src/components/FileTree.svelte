<script lang="ts">
  import type { GitHubContent } from '$lib/github/types';
  import FileTree from './FileTree.svelte';

  let { files, onselect, depth = 0, selectedPath = '' }: {
    files: GitHubContent[];
    onselect: (file: GitHubContent) => void;
    depth?: number;
    selectedPath?: string;
  } = $props();

  let expanded = $state<Record<string, boolean>>({});

  function toggle(path: string) {
    expanded[path] = !expanded[path];
  }

  let sorted = $derived(
    [...files].sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    })
  );
</script>

<ul class="tree" style="padding-left: {depth * 16}px">
  {#each sorted as file (file.path)}
    <li>
      {#if file.type === 'dir'}
        <button class="tree-item folder" onclick={() => toggle(file.path)} type="button">
          <span class="icon">{expanded[file.path] ? '\u25BE' : '\u25B8'}</span>
          <span class="name">{file.name}</span>
        </button>
        {#if expanded[file.path]}
          <FileTree files={[]} {onselect} depth={depth + 1} {selectedPath} />
        {/if}
      {:else}
        <button
          class="tree-item file"
          class:selected={selectedPath === file.path}
          onclick={() => onselect(file)}
          type="button"
        >
          <span class="icon file-icon">\u2630</span>
          <span class="name">{file.name}</span>
        </button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .tree {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
  }

  .tree-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 10px;
    background: none;
    border: none;
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.12s;
  }

  .tree-item:hover {
    background: var(--bg-hover);
  }

  .tree-item.selected {
    background: var(--bg-hover);
    color: var(--accent);
  }

  .icon {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
  }

  .folder .icon {
    color: var(--yellow);
  }

  .file-icon {
    color: var(--text-muted);
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
