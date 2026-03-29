import { useStore } from '../bridge/useStore'

export function TeamsPanel() {
  const teams = useStore((s) => s.teams)

  if (teams.length === 0) {
    return (
      <div className="panel-empty">
        <p>No teams configured</p>
      </div>
    )
  }

  return (
    <div className="panel teams-panel">
      <ul className="teams-list">
        {teams.map((team) => (
          <li key={team.id} className="team-card">
            <div className="team-header">
              <span className="team-name">{team.name}</span>
              <span className="team-focus">{team.focus}</span>
            </div>
            {team.scope.length > 0 && (
              <div className="team-scope">
                <span className="team-label">Scope: </span>
                {team.scope.join(', ')}
              </div>
            )}
            {team.accepts.length > 0 && (
              <div className="team-accepts">
                <span className="team-label">Accepts: </span>
                {team.accepts.join(', ')}
              </div>
            )}
            {team.handoffChain.length > 0 && (
              <div className="team-chain">
                <span className="team-label">Chain: </span>
                {team.handoffChain.join(' → ')}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
