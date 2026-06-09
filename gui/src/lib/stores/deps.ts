import { writable } from 'svelte/store';
import type { DepsNode } from '../ccpm/types';
import { LABELS, getStatusFromLabels, extractEpicName } from '../ccpm/labels';
import { getClient } from './client-helper';

function createDepsStore() {
  const tree = writable<DepsNode[]>([]);
  const loading = writable(false);

  async function refresh() {
    const client = getClient();
    if (!client) return;
    loading.set(true);
    try {
      const [prdIssues, epicIssues, taskIssues] = await Promise.all([
        client.listIssues(LABELS.PRD, 'all'),
        client.listIssues(LABELS.EPIC, 'all'),
        client.listIssues(LABELS.TASK, 'all'),
      ]);

      const nodes: DepsNode[] = prdIssues.map((prd) => {
        const prdLabels = prd.labels.map((l) => l.name);
        const relatedEpics = epicIssues.filter((e) =>
          e.body?.includes(`PRD: #${prd.number}`)
        );

        const epicChildren: DepsNode[] = relatedEpics.map((epic) => {
          const epicLabels = epic.labels.map((l) => l.name);
          const epicName = extractEpicName(epicLabels);
          const relatedTasks = taskIssues.filter((t) =>
            t.labels.some((l) => l.name === `epic:${epicName}`)
          );
          const bugCount = relatedTasks.filter((t) =>
            t.labels.some((l) => l.name === LABELS.BUG)
          ).length;

          const taskChildren: DepsNode[] = relatedTasks.map((task) => {
            const taskLabels = task.labels.map((l) => l.name);
            return {
              type: 'task' as const,
              id: task.number,
              title: task.title,
              status: getStatusFromLabels(taskLabels, task.state),
              children: [],
            };
          });

          return {
            type: 'epic' as const,
            id: epic.number,
            title: epic.title,
            status: getStatusFromLabels(epicLabels, epic.state),
            children: taskChildren,
            bugCount,
          };
        });

        return {
          type: 'prd' as const,
          id: prd.number,
          title: prd.title,
          status: getStatusFromLabels(prdLabels, prd.state),
          children: epicChildren,
        };
      });

      tree.set(nodes);
    } catch (err) {
      console.error('Failed to load dependency tree:', err);
    } finally {
      loading.set(false);
    }
  }

  return { tree, loading, refresh };
}

export const depsStore = createDepsStore();
