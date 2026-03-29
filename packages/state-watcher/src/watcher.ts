import chokidar, { FSWatcher } from 'chokidar'
import * as path from 'path'

export type ChangeKind = 'backlog' | 'tasks' | 'teams' | 'session' | 'generic'

export type WatchCallback = (kind: ChangeKind, filePath: string) => void

const WATCH_GLOBS = [
  'AGENT_BACKLOG.md',
  'AGENT_TEAMS.md',
  '.agentkit/spec/**',
  '.claude/state/**',
  '.retortconfig',
]

/**
 * Creates a chokidar watcher scoped to `root` and calls `onChange` with a
 * categorised ChangeKind whenever a watched file is added, changed, or removed.
 *
 * Returns a cleanup function that stops the watcher.
 */
export function createWatcher(root: string, onChange: WatchCallback): () => Promise<void> {
  const patterns = WATCH_GLOBS.map((g) => path.join(root, g))

  const watcher: FSWatcher = chokidar.watch(patterns, {
    // Ignore the initial scan — we load a full snapshot on startup.
    ignoreInitial: true,
    persistent: true,
    // Slight debounce handled by the server layer; chokidar stabilises
    // rapid saves before emitting.
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  })

  const handle = (filePath: string): void => {
    onChange(classify(filePath), filePath)
  }

  watcher.on('add', handle)
  watcher.on('change', handle)
  watcher.on('unlink', handle)

  return () => watcher.close()
}

/** Maps a file path to the most specific ChangeKind. */
function classify(filePath: string): ChangeKind {
  const normalised = filePath.replace(/\\/g, '/')
  if (normalised.endsWith('AGENT_BACKLOG.md')) return 'backlog'
  if (normalised.endsWith('AGENT_TEAMS.md') || normalised.includes('.agentkit/spec')) return 'teams'
  if (normalised.includes('.claude/state/orchestrator')) return 'session'
  if (normalised.includes('.claude/state/tasks')) return 'tasks'
  return 'generic'
}
