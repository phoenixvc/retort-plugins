/**
 * state-watcher entry point
 *
 * Usage: node dist/index.js <workspaceRoot>
 *
 * Protocol (stdout):
 *   PORT:<number>          — emitted once the WebSocket server is ready
 *   CMD:<json>             — relays command:run messages from WebSocket clients
 *
 * The VS Code extension (StateWatcherProcess) reads these lines and:
 *   - fires onPortReady so the webview can connect
 *   - fires onCommand so the terminal service can run the requested command
 */

import { parseBacklog, parseTasks, parseTeams, parseSession } from './parsers/index.js'
import { createWatcher, type ChangeKind } from './watcher.js'
import { createServer } from './server.js'
import { createCogmeshPoller } from './cogmesh-poller.js'
import type { HostMessage } from './protocol.js'

const workspaceRoot = process.argv[2]

if (!workspaceRoot) {
  process.stderr.write('Usage: state-watcher <workspaceRoot>\n')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Build a full snapshot from disk
// ---------------------------------------------------------------------------

function buildSnapshot(): HostMessage & { type: 'snapshot' } {
  return {
    type: 'snapshot',
    teams: parseTeams(workspaceRoot),
    backlog: parseBacklog(workspaceRoot),
    tasks: parseTasks(workspaceRoot),
    session: parseSession(workspaceRoot),
  }
}

// ---------------------------------------------------------------------------
// Start WebSocket server
// ---------------------------------------------------------------------------

const { broadcast, close } = createServer(
  (port) => {
    // Signal VS Code extension that the server is ready
    process.stdout.write(`PORT:${port}\n`)
  },
  (command, args) => {
    // Relay command:run from UI to the extension via stdout
    process.stdout.write(`CMD:${JSON.stringify({ command, args })}\n`)
  },
)

const cogmeshPoller = createCogmeshPoller(workspaceRoot, (health) => {
  broadcast({ type: 'cogmesh:health:updated', health })
})

// ---------------------------------------------------------------------------
// File watcher — debounce and broadcast targeted updates
// ---------------------------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | undefined
const pendingKinds = new Set<ChangeKind>()

const stopWatcher = createWatcher(workspaceRoot, (kind) => {
  pendingKinds.add(kind)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    flushPending()
    pendingKinds.clear()
  }, 250)
})

function flushPending(): void {
  // .retortconfig change — reload CM config before sending snapshot
  if (pendingKinds.has('generic')) {
    cogmeshPoller.reload()
  }

  // If multiple kinds changed, send a full snapshot rather than many patches —
  // it keeps the protocol simple and avoids ordering issues.
  if (pendingKinds.size > 1 || pendingKinds.has('generic') || pendingKinds.has('session')) {
    broadcast(buildSnapshot())
    return
  }

  const [kind] = pendingKinds

  switch (kind) {
    case 'backlog':
      broadcast({ type: 'backlog:updated', items: parseBacklog(workspaceRoot) })
      break
    case 'tasks': {
      const tasks = parseTasks(workspaceRoot)
      // Broadcast individual updates for tasks so the UI can merge them.
      for (const task of tasks) {
        broadcast({ type: 'task:updated', task })
      }
      break
    }
    case 'teams':
      broadcast({ type: 'teams:updated', teams: parseTeams(workspaceRoot) })
      break
    default:
      broadcast(buildSnapshot())
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(): Promise<void> {
  if (debounceTimer) clearTimeout(debounceTimer)
  cogmeshPoller.stop()
  await stopWatcher()
  close()
}

process.on('SIGTERM', () => { void shutdown() })
process.on('SIGINT', () => { void shutdown() })
