<script lang="ts">
  import type { GitHubContent } from '$lib/github/types';
  import { getClient } from '$lib/stores/client-helper';
  import FileTree from '../../components/FileTree.svelte';
  import CodeEditor from '../../components/CodeEditor.svelte';

  let files: GitHubContent[] = $state([]);
  let selectedPath = $state('');
  let fileContent = $state('');
  let fileSha = $state('');
  let loadingTree = $state(true);
  let loadingFile = $state(false);
  let error = $state('');
  let prUrl = $state('');

  $effect(() => {
    loadFiles();
  });

  async function loadFiles() {
    const client = getClient();
    if (!client) return;
    loadingTree = true;
    error = '';
    try {
      const [commands, agents] = await Promise.allSettled([
        client.getContents('.claude/commands'),
        client.getContents('.claude/agents'),
      ]);
      const result: GitHubContent[] = [];
      if (commands.status === 'fulfilled') result.push(...commands.value);
      if (agents.status === 'fulfilled') result.push(...agents.value);
      files = result;
    } catch (err) {
      console.error('Failed to load files:', err);
      error = 'Failed to load prompt files.';
    } finally {
      loadingTree = false;
    }
  }

  async function handleSelect(path: string) {
    const client = getClient();
    if (!client) return;
    selectedPath = path;
    loadingFile = true;
    error = '';
    try {
      const contents = await client.getContents(path);
      // getContents for a file returns a single object (cast from array)
      const file = Array.isArray(contents) ? contents[0] : contents as unknown as GitHubContent;
      if (file.content && file.encoding === 'base64') {
        fileContent = atob(file.content);
      } else {
        fileContent = file.content || '';
      }
      fileSha = file.sha;
    } catch (err) {
      console.error('Failed to load file:', err);
      error = 'Failed to load file content.';
      fileContent = '';
      fileSha = '';
    } finally {
      loadingFile = false;
    }
  }

  async function handleSave(content: string) {
    const client = getClient();
    if (!client || !selectedPath) return;
    error = '';
    prUrl = '';
    try {
      const defaultBranch = await client.getDefaultBranch();
      const headSha = await client.getRef(defaultBranch);
      const filename = selectedPath.split('/').pop() ?? 'file';
      const ts = Date.now();
      const branchName = `ccpm/update-${filename}-${ts}`;
      await client.createBranch(branchName, headSha);
      await client.updateContents(
        selectedPath,
        content,
        fileSha,
        `Update ${selectedPath} via CCPM GUI`,
        branchName
      );
      const pr = await client.createPullRequest(
        `Update ${selectedPath}`,
        branchName,
        defaultBranch,
        'Updated via CCPM GUI editor.'
      );
      prUrl = pr.html_url;
      // Reload to get new sha from default branch
      await handleSelect(selectedPath);
    } catch (err: any) {
      console.error('Failed to save file:', err);
      error = err.message || 'Failed to save file.';
    }
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Prompt Editor</h1>
  </header>

  {#if prUrl}
    <div class="success-bar">
      PR created: <a href={prUrl} target="_blank" rel="noopener">{prUrl}</a>
      <button class="dismiss-btn" onclick={() => prUrl = ''}>Dismiss</button>
    </div>
  {/if}

  {#if error}
    <div class="error-bar">{error}</div>
  {/if}

  <div class="editor-layout">
    <div class="tree-panel">
      {#if loadingTree}
        <div class="loading-text">Loading files...</div>
      {:else}
        <FileTree {files} onselect={handleSelect} />
      {/if}
    </div>

    <div class="editor-panel">
      {#if loadingFile}
        <div class="loading-text">Loading file...</div>
      {:else if selectedPath}
        <div class="file-path">{selectedPath}</div>
        <CodeEditor content={fileContent} path={selectedPath} sha={fileSha} onsave={handleSave} />
      {:else}
        <div class="empty-state">Select a file from the tree to edit.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .page { max-width: 1400px; }

  .page-header { margin-bottom: 24px; }
  .page-header h1 { margin: 0; font-size: 24px; color: var(--text); }

  .success-bar {
    padding: 10px 14px;
    background: var(--green, #22c55e);
    color: white;
    border-radius: var(--radius);
    margin-bottom: 16px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .success-bar a {
    color: white;
    text-decoration: underline;
  }

  .dismiss-btn {
    margin-left: auto;
    background: none;
    border: 1px solid rgba(255,255,255,0.4);
    color: white;
    padding: 2px 8px;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 12px;
  }

  .error-bar {
    padding: 10px 14px;
    background: var(--red);
    color: white;
    border-radius: var(--radius);
    margin-bottom: 16px;
    font-size: 13px;
  }

  .editor-layout {
    display: flex;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    min-height: calc(100vh - 160px);
  }

  .tree-panel {
    width: 280px;
    flex-shrink: 0;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    padding: 12px 0;
  }

  .editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .file-path {
    padding: 8px 16px;
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    font-family: monospace;
  }

  .loading-text {
    padding: 24px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 14px;
  }
</style>
