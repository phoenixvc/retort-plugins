import type { AgentTask, BacklogItem } from '../bridge/types'

type TaskStatus = AgentTask['status']
type BacklogStatus = BacklogItem['status']
type AnyStatus = TaskStatus | BacklogStatus

const STATUS_COLORS: Record<AnyStatus, string> = {
  // Task statuses
  submitted: 'var(--muted)',
  accepted: 'var(--accent)',
  working: 'var(--warning)',
  completed: 'var(--success)',
  failed: 'var(--error)',
  rejected: 'var(--error)',
  // Backlog statuses
  open: 'var(--muted)',
  'in-progress': 'var(--warning)',
  done: 'var(--success)',
  blocked: 'var(--error)',
}

interface Props {
  status: AnyStatus
}

export function StatusBadge({ status }: Props) {
  const color = STATUS_COLORS[status] ?? 'var(--muted)'
  return (
    <span
      className="status-badge"
      style={{ '--badge-color': color } as React.CSSProperties}
    >
      {status}
    </span>
  )
}
