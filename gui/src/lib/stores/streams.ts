import { writable } from 'svelte/store';
import type { AgentStream } from '../ccpm/types';
import { parseAgentStreams } from '../ccpm/mapper';
import { getClient } from './client-helper';

function createStreamStore() {
  const streams = writable<AgentStream[]>([]);
  const loading = writable(false);

  async function refreshForTask(taskNumber: number) {
    const client = getClient();
    if (!client) return;
    loading.set(true);
    try {
      const comments = await client.getComments(taskNumber);
      const parsed = parseAgentStreams(comments);
      streams.set(parsed);
    } catch (err) {
      console.error('Failed to load streams:', err);
    } finally {
      loading.set(false);
    }
  }

  return { streams, loading, refreshForTask };
}

export const streamStore = createStreamStore();
