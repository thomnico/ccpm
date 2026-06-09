import { writable } from 'svelte/store';
import type { ADR } from '../ccpm/types';
import { LABELS } from '../ccpm/labels';
import { issueToADR } from '../ccpm/mapper';
import { getClient } from './client-helper';

function createAdrStore() {
  const adrs = writable<ADR[]>([]);
  const loading = writable(false);

  async function refresh() {
    const client = getClient();
    if (!client) return;
    loading.set(true);
    try {
      const issues = await client.listIssues(LABELS.ADR, 'all');
      const mapped = issues.map((issue) => issueToADR(issue));
      adrs.set(mapped);
    } catch (err) {
      console.error('Failed to load ADRs:', err);
    } finally {
      loading.set(false);
    }
  }

  return { adrs, loading, refresh };
}

export const adrStore = createAdrStore();
