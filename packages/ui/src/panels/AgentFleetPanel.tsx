import { useStore } from '../bridge/useStore'
import { TaskCard } from '../components/TaskCard'
import { SystemHealthBar } from '../components/SystemHealthBar'

const ACTIVE_STATUSES = new Set<string>(['submitted', 'accepted', 'working'])

export function AgentFleetPanel() {
  const tasks = useStore((s) => s.tasks)
  const activeTasks = tasks.filter((t) => ACTIVE_STATUSES.has(t.status))

  return (
    <div className="panel fleet-panel">
      <SystemHealthBar />
      {activeTasks.length === 0 ? (
        <div className="panel-empty">
          <p>No active agents — run /orchestrate to start</p>
        </div>
      ) : (
        <div className="task-list">
          {activeTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
