import { useStore } from '../bridge/useStore'
import type { AgentTask } from '../bridge/types'

// Show completed/failed tasks and tasks with a pending handoff (handoffTo set
// but not yet accepted by the target).
function isHandoffItem(task: AgentTask): boolean {
  if (task.status === 'completed' || task.status === 'failed') return true
  if (task.handoffTo && task.status !== 'accepted') return true
  return false
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

export function HandoffFeedPanel() {
  const tasks = useStore((s) => s.tasks)

  const feedItems = tasks
    .filter(isHandoffItem)
    // Newest first by updatedAt
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  if (feedItems.length === 0) {
    return (
      <div className="panel-empty">
        <p>No handoffs yet — tasks will appear here as they complete</p>
      </div>
    )
  }

  return (
    <div className="panel handoff-panel">
      <ul className="handoff-list">
        {feedItems.map((task) => (
          <li key={task.id} className="handoff-item">
            <div className="handoff-title">{task.title}</div>
            <div className="handoff-route">
              {task.assignedTo && (
                <span className="handoff-from">{task.assignedTo}</span>
              )}
              {task.handoffTo && (
                <>
                  <span className="handoff-arrow"> → </span>
                  <span className="handoff-to">{task.handoffTo}</span>
                </>
              )}
            </div>
            <div className="handoff-time">{formatTimestamp(task.updatedAt)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
