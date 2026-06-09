import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'ccpm-gui-repo';

interface RepoInfo {
  owner: string;
  name: string;
}

function createRepoStore() {
  let initial: RepoInfo = { owner: '', name: '' };
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      initial = JSON.parse(stored);
    } catch {}
  }
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const repoParam = params.get('repo');
  if (repoParam) {
    const [owner, name] = repoParam.split('/');
    if (owner && name) initial = { owner, name };
  }

  const repo = writable<RepoInfo>(initial);
  const repoSlug = derived(repo, ($r) =>
    $r.owner && $r.name ? `${$r.owner}/${$r.name}` : ''
  );

  return {
    repo,
    repoSlug,
    setRepo(owner: string, name: string) {
      const info = { owner, name };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
      repo.set(info);
    },
  };
}

export const repoStore = createRepoStore();
