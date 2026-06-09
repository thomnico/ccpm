import type { GitHubIssue, GitHubComment } from '../github/types';
import type { PRD, Epic, Task, ADR, AdrStatus, AgentStream, StreamEntry } from './types';
import { getStatusFromLabels, extractEpicName, LABELS } from './labels';
import { extractPrdReference } from './parser';

export function issueToPRD(issue: GitHubIssue, epicCount: number): PRD {
  const labels = issue.labels.map((l) => l.name);
  return {
    id: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    status: getStatusFromLabels(labels, issue.state),
    labels,
    epicCount,
    assignees: issue.assignees.map((a) => a.login),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
  };
}

export function issueToEpic(
  issue: GitHubIssue,
  taskCount: number,
  completedCount: number,
  bugCount: number = 0
): Epic {
  const labels = issue.labels.map((l) => l.name);
  return {
    id: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    status: getStatusFromLabels(labels, issue.state),
    labels,
    epicName: extractEpicName(labels),
    prdNumber: extractPrdReference(issue.body ?? ''),
    taskCount,
    completedTaskCount: completedCount,
    bugCount,
    assignees: issue.assignees.map((a) => a.login),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
  };
}

export function issueToADR(issue: GitHubIssue): ADR {
  const labels = issue.labels.map((l) => l.name);
  let adrStatus: AdrStatus = 'proposed';
  if (labels.includes(LABELS.ADR_ACCEPTED)) adrStatus = 'accepted';
  else if (labels.includes(LABELS.ADR_SUPERSEDED)) adrStatus = 'superseded';
  return {
    id: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    status: getStatusFromLabels(labels, issue.state),
    adrStatus,
    labels,
    assignees: issue.assignees.map((a) => a.login),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
  };
}

export function issueToTask(
  issue: GitHubIssue,
  comments: GitHubComment[]
): Task {
  const labels = issue.labels.map((l) => l.name);
  const streams = parseAgentStreams(comments);
  const progress = computeProgress(streams, issue.body ?? '');
  return {
    id: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    status: getStatusFromLabels(labels, issue.state),
    labels,
    epicName: extractEpicName(labels),
    assignees: issue.assignees.map((a) => a.login),
    progress,
    streams,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
  };
}

function computeProgress(streams: AgentStream[], body: string): number {
  if (streams.length > 0) {
    const total = streams.reduce((sum, s) => sum + s.progress, 0);
    return Math.round(total / streams.length);
  }
  const progressMatch = body.match(/Progress:\s*(\d+)%/);
  return progressMatch ? parseInt(progressMatch[1], 10) : 0;
}

export function parseAgentStreams(comments: GitHubComment[]): AgentStream[] {
  const streamMap = new Map<string, AgentStream>();

  for (const comment of comments) {
    const body = comment.body;
    const entries: StreamEntry[] = [];

    // Detect stream name
    const streamMatch = body.match(/Stream\s+([\w-]+)/i);
    const streamName = streamMatch ? streamMatch[1] : 'Default';

    // Parse headers to determine entry type
    const isCompleted = /^##\s*Task Completed/m.test(body);
    const isProgress = /^##\s*Progress Update/m.test(body);

    // Parse completed items
    const completedItems: string[] = [];
    const completedRegex = /^- \[x\]\s+(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = completedRegex.exec(body)) !== null) {
      completedItems.push(m[1]);
    }

    // Parse in-progress items
    const inProgressItems: string[] = [];
    const inProgressRegex = /^- \[ \]\s+(.+)$/gm;
    while ((m = inProgressRegex.exec(body)) !== null) {
      inProgressItems.push(m[1]);
    }

    // Parse blockers
    const blockerItems: string[] = [];
    const blockerRegex = /^>\s*Blocker:\s*(.+)$/gm;
    while ((m = blockerRegex.exec(body)) !== null) {
      blockerItems.push(m[1]);
    }

    // Parse progress percentage
    const progressMatch = body.match(/Progress:\s*(\d+)%/);
    const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;

    // Build entries
    if (completedItems.length > 0) {
      entries.push({
        timestamp: comment.created_at,
        type: 'completed',
        message: isCompleted ? 'Task completed' : 'Items completed',
        items: completedItems,
      });
    }
    if (inProgressItems.length > 0) {
      entries.push({
        timestamp: comment.created_at,
        type: 'progress',
        message: isProgress ? 'Progress update' : 'In progress',
        items: inProgressItems,
      });
    }
    if (blockerItems.length > 0) {
      entries.push({
        timestamp: comment.created_at,
        type: 'blocked',
        message: 'Blocked',
        items: blockerItems,
      });
    }

    // If no structured content, treat as info
    if (entries.length === 0 && body.trim()) {
      entries.push({
        timestamp: comment.created_at,
        type: 'info',
        message: body.slice(0, 200),
        items: [],
      });
    }

    if (entries.length === 0) continue;

    if (!streamMap.has(streamName)) {
      streamMap.set(streamName, {
        id: streamName.toLowerCase().replace(/\s+/g, '-'),
        name: streamName,
        status: 'idle',
        entries: [],
        progress: 0,
      });
    }

    const stream = streamMap.get(streamName)!;
    stream.entries.push(...entries);
    if (progress > stream.progress) stream.progress = progress;

    // Update stream status based on latest entry
    const lastEntry = entries[entries.length - 1];
    if (lastEntry.type === 'blocked') {
      stream.status = 'blocked';
    } else if (lastEntry.type === 'completed' && isCompleted) {
      stream.status = 'completed';
    } else if (lastEntry.type === 'progress' || lastEntry.type === 'completed') {
      stream.status = 'running';
    }
  }

  return Array.from(streamMap.values());
}
