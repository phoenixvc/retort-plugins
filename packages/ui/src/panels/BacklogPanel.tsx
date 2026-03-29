import { useStore } from '../bridge/useStore'
import { StatusBadge } from '../components/StatusBadge'
import type { BacklogItem } from '../bridge/types'

const PRIORITY_ORDER: Record<NonNullable<BacklogItem['priority']>, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function sortBacklog(items: BacklogItem[]): BacklogItem[] {
  return [...items].sort((a, b) => {
    const pa = a.priority !== undefined ? PRIORITY_ORDER[a.priority] : 99
    const pb = b.priority !== undefined ? PRIORITY_ORDER[b.priority] : 99
    return pa - pb
  })
}

export function BacklogPanel() {
  const backlog = useStore((s) => s.backlog)
  const sorted = sortBacklog(backlog)

  if (sorted.length === 0) {
    return (
      <div className="panel-empty">
        <p>Backlog is empty</p>
      </div>
    )
  }

  return (
    <div className="panel backlog-panel">
      <ul className="backlog-list">
        {sorted.map((item) => (
          <li key={item.id} className="backlog-item">
            <div className="backlog-item-header">
              <span className="backlog-title">{item.title}</span>
              <StatusBadge status={item.status} />
            </div>
            <div className="backlog-meta">
              {item.team && <span className="backlog-team">{item.team}</span>}
              {item.priority && (
                <span className={`backlog-priority backlog-priority--${item.priority}`}>
                  {item.priority}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
