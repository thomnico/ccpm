export const LABELS = {
  PRD: 'prd',
  EPIC: 'epic',
  TASK: 'task',
  ADR: 'adr',
  ADR_PROPOSED: 'adr:proposed',
  ADR_ACCEPTED: 'adr:accepted',
  ADR_SUPERSEDED: 'adr:superseded',
  IN_PROGRESS: 'in-progress',
  DELETED: 'deleted',
  BUG: 'bug',
} as const;

export function epicLabel(name: string): string {
  return `epic:${name}`;
}

export function extractEpicName(labels: string[]): string {
  const label = labels.find((l) => l.startsWith('epic:'));
  return label ? label.slice(5) : '';
}

export function hasLabel(labels: string[], name: string): boolean {
  return labels.some((l) => l === name);
}

export function getStatusFromLabels(
  labels: string[],
  state: 'open' | 'closed'
): 'backlog' | 'in-progress' | 'complete' | 'closed' {
  if (state === 'closed') return 'closed';
  if (hasLabel(labels, LABELS.IN_PROGRESS)) return 'in-progress';
  return 'backlog';
}
