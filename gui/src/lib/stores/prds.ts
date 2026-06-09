import { writable } from 'svelte/store';
import type { PRD } from '../ccpm/types';
import { LABELS } from '../ccpm/labels';
import { issueToPRD } from '../ccpm/mapper';
import { getClient } from './client-helper';

function createPrdStore() {
  const prds = writable<PRD[]>([]);
  const loading = writable(false);

  async function refresh() {
    const client = getClient();
    if (!client) return;
    loading.set(true);
    try {
      const issues = await client.listIssues(LABELS.PRD, 'all');
      const epics = await client.listIssues(LABELS.EPIC, 'all');
      const mapped = issues.map((issue) => {
        const epicCount = epics.filter((e) =>
          e.body?.includes(`PRD: #${issue.number}`)
        ).length;
        return issueToPRD(issue, epicCount);
      });
      prds.set(mapped);
    } catch (err) {
      console.error('Failed to load PRDs:', err);
    } finally {
      loading.set(false);
    }
  }

  return { prds, loading, refresh };
}

export const prdStore = createPrdStore();
