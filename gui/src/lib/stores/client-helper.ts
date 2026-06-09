import { get } from 'svelte/store';
import { GitHubClient } from '../github/client';
import { auth } from './auth';
import { repoStore } from './repo';

let clientInstance: GitHubClient | null = null;
let lastToken = '';
let lastRepo = '';

export function getClient(): GitHubClient | null {
  const token = get(auth.token);
  const repo = get(repoStore.repo);
  const repoKey = `${repo.owner}/${repo.name}`;

  if (!token || !repo.owner || !repo.name) return null;

  if (token !== lastToken || repoKey !== lastRepo) {
    clientInstance = new GitHubClient(token, repo.owner, repo.name);
    lastToken = token;
    lastRepo = repoKey;
  }

  return clientInstance;
}
