import { useStore } from '../bridge/useStore'
import type { CognitiveMeshHealth } from '../bridge/types'

interface ServiceIndicator {
  label: string
  status: 'ok' | 'warn' | 'error' | 'off'
  detail?: string
}

function cogmeshIndicator(health: CognitiveMeshHealth | null): ServiceIndicator {
  if (!health || health.status === 'unconfigured') {
    return { label: 'CogMesh', status: 'off', detail: 'not configured' }
  }
  if (health.status === 'connected') {
    return { label: 'CogMesh', status: 'ok', detail: `${health.latencyMs}ms` }
  }
  if (health.status === 'degraded') {
    return { label: 'CogMesh', status: 'warn', detail: `degraded ${health.latencyMs}ms` }
  }
  return { label: 'CogMesh', status: 'error', detail: 'unreachable' }
}

function Pill({ indicator }: { indicator: ServiceIndicator }) {
  return (
    <span
      className={`health-pill health-pill--${indicator.status}`}
      title={indicator.detail}
    >
      <span className="health-pill-dot" />
      {indicator.label}
      {indicator.detail && <span className="health-pill-detail">{indicator.detail}</span>}
    </span>
  )
}

/**
 * Compact service-health row shown at the top of the Fleet panel.
 * Hidden entirely when all services are unconfigured (avoids noise on fresh installs).
 */
export function SystemHealthBar() {
  const cogmeshHealth = useStore((s) => s.cogmeshHealth)

  const indicators: ServiceIndicator[] = [
    cogmeshIndicator(cogmeshHealth),
    // Future: baton, mcp-org, sluice, etc.
  ]

  // Don't render the bar if every service is 'off' — no value shown
  if (indicators.every((i) => i.status === 'off')) return null

  return (
    <div className="system-health-bar" role="status" aria-label="Service health">
      {indicators.map((ind) => (
        <Pill key={ind.label} indicator={ind} />
      ))}
    </div>
  )
}
