import { writable } from 'svelte/store';
import type { Task } from '../ccpm/types';
import { LABELS } from '../ccpm/labels';
import { epicLabel } from '../ccpm/labels';
import { issueToTask } from '../ccpm/mapper';
import { getClient } from './client-helper';

function createTaskStore() {
  const tasks = writable<Task[]>([]);
  const loading = writable(false);

  async function refreshByEpic(epicName: string) {
    const client = getClient();
    if (!client) return;
    loading.set(true);
    try {
      const issues = await client.listIssues(
        `${LABELS.TASK},${epicLabel(epicName)}`,
        'all'
      );
      const mapped = await Promise.all(
        issues.map(async (issue) => {
          const comments = await client.getComments(issue.number);
          return issueToTask(issue, comments);
        })
      );
      tasks.set(mapped);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      loading.set(false);
    }
  }

  return { tasks, loading, refreshByEpic };
}

export const taskStore = createTaskStore();
