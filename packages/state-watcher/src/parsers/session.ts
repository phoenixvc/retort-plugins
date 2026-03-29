import * as fs from 'fs'
import * as path from 'path'
import type { SessionState } from '../protocol.js'

/**
 * Reads .claude/state/orchestrator.json and returns the current session
 * state, or null if the file does not exist or cannot be parsed.
 */
export function parseSession(root: string): SessionState | null {
  const statePath = path.join(root, '.claude', 'state', 'orchestrator.json')
  if (!fs.existsSync(statePath)) return null

  let raw: string
  try {
    raw = fs.readFileSync(statePath, 'utf-8')
  } catch {
    return null
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof data !== 'object' || data === null) return null

  const obj = data as Record<string, unknown>

  // Coerce to SessionState — only activeTaskCount and lastUpdated are required.
  const activeTaskCount =
    typeof obj['activeTaskCount'] === 'number' ? obj['activeTaskCount'] : 0

  const lastUpdated =
    typeof obj['lastUpdated'] === 'string'
      ? obj['lastUpdated']
      : new Date().toISOString()

  return {
    orchestratorId: typeof obj['orchestratorId'] === 'string' ? obj['orchestratorId'] : undefined,
    phase: typeof obj['phase'] === 'string' ? obj['phase'] : undefined,
    activeTaskCount,
    lastUpdated,
  }
}
