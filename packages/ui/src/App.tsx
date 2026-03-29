import { useBridge } from './bridge/useBridge'
import { useStore } from './bridge/useStore'
import type { ActivePanel } from './bridge/useStore'
import { AgentFleetPanel } from './panels/AgentFleetPanel'
import { BacklogPanel } from './panels/BacklogPanel'
import { TeamsPanel } from './panels/TeamsPanel'
import { HandoffFeedPanel } from './panels/HandoffFeedPanel'
import { OnboardingPanel } from './panels/OnboardingPanel'

interface Tab {
  id: ActivePanel
  label: string
}

const TABS: Tab[] = [
  { id: 'fleet', label: 'Fleet' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'teams', label: 'Teams' },
  { id: 'handoff', label: 'Handoff' },
]

function SyncIndicator() {
  const { state, message } = useStore((s) => s.syncStatus)
  if (state === 'idle') return null
  return (
    <span className={`sync-indicator sync-indicator--${state}`} title={message}>
      {state}
    </span>
  )
}

export function App() {
  const bridge = useBridge()
  const activePanel = useStore((s) => s.activePanel)
  const setActivePanel = useStore((s) => s.setActivePanel)
  const session = useStore((s) => s.session)
  const teams = useStore((s) => s.teams)

  // Show onboarding whenever there's no session and no teams — indicates
  // state-watcher hasn't found a .retortconfig in the workspace.
  const showOnboarding = session === null && teams.length === 0

  function renderPanel() {
    if (showOnboarding) return <OnboardingPanel send={bridge.send} />
    switch (activePanel) {
      case 'fleet':   return <AgentFleetPanel />
      case 'backlog': return <BacklogPanel />
      case 'teams':   return <TeamsPanel />
      case 'handoff': return <HandoffFeedPanel />
      default:        return <AgentFleetPanel />
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <nav className="tab-bar" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              className={`tab-button${activePanel === tab.id && !showOnboarding ? ' tab-button--active' : ''}`}
              aria-selected={activePanel === tab.id && !showOnboarding}
              disabled={showOnboarding}
              onClick={() => setActivePanel(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="header-status">
          <SyncIndicator />
          <span
            className={`connection-dot${bridge.connected ? ' connection-dot--online' : ''}`}
            title={bridge.connected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </header>
      <main className="app-main">{renderPanel()}</main>
    </div>
  )
}
