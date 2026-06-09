import { writable } from 'svelte/store';
import type { Epic } from '../ccpm/types';
import { LABELS } from '../ccpm/labels';
import { issueToEpic } from '../ccpm/mapper';
import { getClient } from './client-helper';

function createEpicStore() {
  const epics = writable<Epic[]>([]);
  const loading = writable(false);

  async function refreshByPrd(prdNumber: number) {
    const client = getClient();
    if (!client) return;
    loading.set(true);
    try {
      const allEpics = await client.listIssues(LABELS.EPIC, 'all');
      const filtered = allEpics.filter((e) =>
        e.body?.includes(`PRD: #${prdNumber}`)
      );
      const allTasks = await client.listIssues(LABELS.TASK, 'all');
      const mapped = filtered.map((issue) => {
        const epicName =
          issue.labels
            .map((l) => l.name)
            .find((n) => n.startsWith('epic:'))
            ?.slice(5) || '';
        const relatedTasks = allTasks.filter((t) =>
          t.labels.some((l) => l.name === `epic:${epicName}`)
        );
        const completedCount = relatedTasks.filter(
          (t) => t.state === 'closed'
        ).length;
        const bugCount = relatedTasks.filter((t) =>
          t.labels.some((l) => l.name === LABELS.BUG)
        ).length;
        return issueToEpic(issue, relatedTasks.length, completedCount, bugCount);
      });
      epics.set(mapped);
    } catch (err) {
      console.error('Failed to load epics:', err);
    } finally {
      loading.set(false);
    }
  }

  return { epics, loading, refreshByPrd };
}

export const epicStore = createEpicStore();
