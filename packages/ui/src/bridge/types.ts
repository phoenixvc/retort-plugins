// Protocol types shared between state-watcher and the UI.
// Keep this file in sync with packages/state-watcher/src/protocol.ts.

export type HostMessage =
  | { type: 'snapshot'; teams: Team[]; backlog: BacklogItem[]; tasks: AgentTask[]; session: SessionState | null }
  | { type: 'task:updated'; task: AgentTask }
  | { type: 'backlog:updated'; items: BacklogItem[] }
  | { type: 'teams:updated'; teams: Team[] }
  | { type: 'sync:status'; state: 'idle' | 'running' | 'error' | 'success'; message?: string }

export type ClientMessage =
  | { type: 'ready' }
  | { type: 'command:run'; command: string; args?: string[] }
  | { type: 'file:open'; path: string }

export interface Team {
  id: string
  name: string
  focus: string
  scope: string[]
  accepts: string[]
  handoffChain: string[]
}

export interface BacklogItem {
  id: string
  title: string
  status: 'open' | 'in-progress' | 'done' | 'blocked'
  team?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface AgentTask {
  id: string
  title: string
  description?: string
  status: 'submitted' | 'accepted' | 'working' | 'completed' | 'failed' | 'rejected'
  assignedTo?: string
  dependsOn?: string[]
  blockedBy?: string[]
  handoffTo?: string
  turn?: number
  maxTurns?: number
  createdAt: string
  updatedAt: string
}

export interface SessionState {
  orchestratorId?: string
  phase?: string
  activeTaskCount: number
  lastUpdated: string
}
