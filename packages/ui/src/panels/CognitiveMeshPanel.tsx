import { useStore } from '../bridge/useStore'
import type { AgentTask, CognitiveMeshHealth } from '../bridge/types'
import { useBridge } from '../bridge/useBridge'

const CM_ACTIVE = new Set(['submitted', 'accepted', 'working'])

function HealthBadge({ health }: { health: CognitiveMeshHealth | null }) {
  if (!health || health.status === 'unconfigured') {
    return <span className="cm-health cm-health--unconfigured">not configured</span>
  }
  if (health.status === 'connected') {
    return <span className="cm-health cm-health--connected">{health.latencyMs}ms</span>
  }
  if (health.status === 'degraded') {
    return <span className="cm-health cm-health--degraded">degraded {health.latencyMs}ms</span>
  }
  return <span className="cm-health cm-health--unreachable">unreachable</span>
}

function StageBar({ stage, total }: { stage: number; total: number }) {
  const pct = total > 0 ? Math.round((stage / total) * 100) : 0
  return (
    <div className="cm-stage-bar" title={`Stage ${stage} of ${total}`}>
      <div className="cm-stage-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

function WorkflowCard({ task, send }: { task: AgentTask; send: (cmd: string) => void }) {
  const isActive = CM_ACTIVE.has(task.status)
  const isFallback = task.status === 'failed' && !!task.fallbackCli
  const elapsed = formatAge(task.updatedAt)

  return (
    <div className={`cm-card cm-card--${task.status}`}>
      <div className="cm-card-header">
        <span className="cm-card-icon">{statusIcon(task.status, isFallback)}</span>
        <span className="cm-card-workflow">{task.workflowName ?? 'cogmesh'}</span>
        <span className="cm-card-age">{elapsed}</span>
      </div>
      <p className="cm-card-goal">{task.title}</p>
      {isActive && task.workflowStage != null && task.workflowTotalStages != null && (
        <div className="cm-stage-row">
          <StageBar stage={task.workflowStage} total={task.workflowTotalStages} />
          <span className="cm-stage-label">
            {task.workflowStage}/{task.workflowTotalStages}
          </span>
        </div>
      )}
      {isFallback && (
        <p className="cm-card-fallback">fell back → {task.fallbackCli}</p>
      )}
      {task.status === 'completed' && task.resultPath && (
        <button
          className="cm-result-link"
          onClick={() => send(`file:open:${task.resultPath}`)}
        >
          view result ↗
        </button>
      )}
    </div>
  )
}

export function CognitiveMeshPanel() {
  const tasks = useStore((s) => s.tasks)
  const health = useStore((s) => s.cogmeshHealth)
  const bridge = useBridge()

  const cmTasks = tasks.filter((t) => t.escalatedTo === 'cogmesh')
  const active = cmTasks.filter((t) => CM_ACTIVE.has(t.status))
  const recent = cmTasks
    .filter((t) => !CM_ACTIVE.has(t.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  const isUnconfigured = !health || health.status === 'unconfigured'

  if (isUnconfigured && cmTasks.length === 0) {
    return (
      <div className="panel-empty">
        <p>No cogmesh endpoint configured — add <code>cogmesh: endpoint:</code> to .retortconfig</p>
      </div>
    )
  }

  function send(msg: string) {
    if (msg.startsWith('file:open:')) {
      bridge.send({ type: 'file:open', path: msg.slice('file:open:'.length) })
    }
  }

  return (
    <div className="panel cm-panel">
      <div className="cm-header">
        <span className="cm-header-label">Cognitive Mesh</span>
        <HealthBadge health={health} />
      </div>

      {active.length > 0 && (
        <section className="cm-section">
          <h3 className="cm-section-title">Active workflows</h3>
          <div className="cm-card-list">
            {active.map((t) => <WorkflowCard key={t.id} task={t} send={send} />)}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="panel-empty" style={{ height: 60 }}>
          No active workflows
        </div>
      )}

      {recent.length > 0 && (
        <section className="cm-section">
          <h3 className="cm-section-title">Recent</h3>
          <div className="cm-card-list">
            {recent.map((t) => <WorkflowCard key={t.id} task={t} send={send} />)}
          </div>
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusIcon(status: AgentTask['status'], isFallback: boolean): string {
  if (isFallback) return '↩'
  switch (status) {
    case 'submitted':
    case 'accepted':  return '○'
    case 'working':   return '▶'
    case 'completed': return '✓'
    case 'failed':    return '✗'
    case 'rejected':  return '⊘'
  }
}

function formatAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}
