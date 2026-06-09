export type ItemStatus = 'backlog' | 'in-progress' | 'complete' | 'closed';

export interface PRD {
  id: number;
  title: string;
  body: string;
  status: ItemStatus;
  labels: string[];
  epicCount: number;
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface Epic {
  id: number;
  title: string;
  body: string;
  status: ItemStatus;
  labels: string[];
  epicName: string;
  prdNumber: number | null;
  taskCount: number;
  completedTaskCount: number;
  bugCount: number;
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface Task {
  id: number;
  title: string;
  body: string;
  status: ItemStatus;
  labels: string[];
  epicName: string;
  assignees: string[];
  progress: number;
  streams: AgentStream[];
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface AgentStream {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'blocked' | 'idle';
  entries: StreamEntry[];
  progress: number;
}

export interface StreamEntry {
  timestamp: string;
  type: 'progress' | 'completed' | 'blocked' | 'info';
  message: string;
  items: string[];
}

export type AdrStatus = 'proposed' | 'accepted' | 'superseded';

export interface ADR {
  id: number;
  title: string;
  body: string;
  status: ItemStatus;
  adrStatus: AdrStatus;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface Frontmatter {
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface DepsNode {
  type: 'prd' | 'epic' | 'task';
  id: number;
  title: string;
  status: ItemStatus;
  children: DepsNode[];
  bugCount?: number;
}

export interface BoardColumn {
  id: string;
  title: string;
  status: ItemStatus;
  items: (PRD | Epic | Task)[];
}
