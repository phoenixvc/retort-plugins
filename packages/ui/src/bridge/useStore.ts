import { create } from 'zustand'
import type { AgentTask, BacklogItem, CognitiveMeshHealth, HostMessage, SessionState, Team } from './types'

export type ActivePanel = 'fleet' | 'backlog' | 'teams' | 'handoff' | 'cogmesh' | 'onboard'

interface SyncStatus {
  state: 'idle' | 'running' | 'error' | 'success'
  message?: string
}

interface RetortStore {
  teams: Team[]
  backlog: BacklogItem[]
  tasks: AgentTask[]
  session: SessionState | null
  syncStatus: SyncStatus
  cogmeshHealth: CognitiveMeshHealth | null
  activePanel: ActivePanel

  setActivePanel: (panel: ActivePanel) => void

  // Called by useBridge on every incoming WebSocket message.
  applyMessage: (msg: HostMessage) => void
}

export const useStore = create<RetortStore>((set) => ({
  teams: [],
  backlog: [],
  tasks: [],
  session: null,
  syncStatus: { state: 'idle' },
  cogmeshHealth: null,
  activePanel: 'fleet',

  setActivePanel: (panel) => set({ activePanel: panel }),

  applyMessage: (msg) => {
    switch (msg.type) {
      case 'snapshot':
        set({
          teams: msg.teams,
          backlog: msg.backlog,
          tasks: msg.tasks,
          session: msg.session,
        })
        break

      case 'task:updated':
        set((s) => {
          const idx = s.tasks.findIndex((t) => t.id === msg.task.id)
          const tasks =
            idx >= 0
              ? s.tasks.map((t, i) => (i === idx ? msg.task : t))
              : [...s.tasks, msg.task]
          return { tasks }
        })
        break

      case 'backlog:updated':
        set({ backlog: msg.items })
        break

      case 'teams:updated':
        set({ teams: msg.teams })
        break

      case 'sync:status':
        set({ syncStatus: { state: msg.state, message: msg.message } })
        break

      case 'cogmesh:health:updated':
        set({ cogmeshHealth: msg.health })
        break
    }
  },
}))
