import type { AgentTask } from '../bridge/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  task: AgentTask
}

export function TaskCard({ task }: Props) {
  const hasTurns = task.turn !== undefined && task.maxTurns !== undefined
  const progress = hasTurns ? task.turn! / task.maxTurns! : 0

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        <StatusBadge status={task.status} />
      </div>

      {task.assignedTo && (
        <div className="task-meta">
          <span className="task-agent">{task.assignedTo}</span>
        </div>
      )}

      {hasTurns && (
        <div className="task-progress">
          <span className="task-turns">
            {task.turn} / {task.maxTurns} turns
          </span>
          <div className="progress-bar" role="progressbar" aria-valuenow={task.turn} aria-valuemax={task.maxTurns}>
            <div className="progress-fill" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {task.handoffTo && (
        <div className="task-handoff">
          <span className="handoff-arrow">→</span>
          <span className="handoff-target">{task.handoffTo}</span>
        </div>
      )}
    </div>
  )
}
