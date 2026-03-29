import { CommandButton } from '../components/CommandButton'
import type { BridgeHandle } from '../bridge/useBridge'

interface Props {
  send: BridgeHandle['send']
}

export function OnboardingPanel({ send }: Props) {
  return (
    <div className="panel onboarding-panel">
      <div className="onboarding-content">
        <h2 className="onboarding-heading">No Retort configuration detected</h2>
        <p className="onboarding-description">
          Retort coordinates AI agent teams across your project. It tracks tasks,
          manages handoffs between agents, and keeps your backlog in sync — all
          from inside your IDE.
        </p>
        <p className="onboarding-description">
          To get started, run <code>retort init</code> to create a{' '}
          <code>.retortconfig</code> and <code>.agentkit/</code> directory in
          your workspace root.
        </p>
        <div className="onboarding-actions">
          <CommandButton
            label="Run retort init"
            message={{ type: 'command:run', command: 'retort', args: ['init'] }}
            send={send}
            variant="primary"
          />
          <CommandButton
            label="Open .retortconfig"
            message={{ type: 'file:open', path: '.retortconfig' }}
            send={send}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  )
}
