import { parseCogmeshConfig } from './parsers/retortconfig.js'
import type { CognitiveMeshHealth } from './protocol.js'

const HEALTH_INTERVAL_MS = 30_000
const HEALTH_TIMEOUT_MS = 5_000

/**
 * Polls the cognitive-mesh `/health` endpoint on a 30s interval.
 * Emits `unconfigured` when no endpoint is set in `.retortconfig`.
 *
 * Returns `reload()` (call when .retortconfig changes) and `stop()`.
 */
export function createCogmeshPoller(
  root: string,
  onHealth: (h: CognitiveMeshHealth) => void,
): { reload: () => void; stop: () => void } {
  let config = parseCogmeshConfig(root)
  let timer: ReturnType<typeof setInterval> | null = null

  async function checkHealth(): Promise<void> {
    if (!config.endpoint) {
      onHealth({ status: 'unconfigured' })
      return
    }

    const url = `${config.endpoint.replace(/\/$/, '')}/health`
    const headers: Record<string, string> = {}
    if (config.secret) headers['Authorization'] = `Bearer ${config.secret}`

    const start = Date.now()
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      const latencyMs = Date.now() - start
      onHealth(res.ok
        ? { status: 'connected', latencyMs }
        : { status: 'degraded', latencyMs },
      )
    } catch {
      onHealth({ status: 'unreachable' })
    }
  }

  function reload(): void {
    config = parseCogmeshConfig(root)
    void checkHealth()
  }

  function stop(): void {
    if (timer) clearInterval(timer)
    timer = null
  }

  // Start immediately, then on interval
  void checkHealth()
  timer = setInterval(() => { void checkHealth() }, HEALTH_INTERVAL_MS)

  return { reload, stop }
}
