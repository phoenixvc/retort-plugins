import * as http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { HostMessage, ClientMessage } from './protocol.js'
import type { AskResponse, RouterIndex } from '@retort-plugins/router'
import { route } from '@retort-plugins/router'

export type CommandHandler = (command: string, args?: string[]) => void

/**
 * Creates an HTTP + WebSocket server on a random available port.
 *
 * HTTP routes:
 *   GET /api/ask?q=<query>  — semantic team routing
 *   GET /health             — liveness probe
 *
 * WebSocket (ws://localhost:<port>/ws):
 *   Calls `onReady(port)` once listening.
 *   Calls `onCommand` when a client sends a `command:run` message.
 *
 * Returns `broadcast`, `close`, and `setRouterIndex` functions.
 */
export function createServer(
  onReady: (port: number) => void,
  onCommand: CommandHandler,
): {
  broadcast: (msg: HostMessage) => void
  close: () => void
  setRouterIndex: (index: RouterIndex) => void
} {
  let routerIndex: RouterIndex | null = null

  // ---------------------------------------------------------------------------
  // HTTP server — handles /health and /api/ask; upgrades WS connections
  // ---------------------------------------------------------------------------

  const httpServer = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost`)

    // CORS headers so the UI WebView can fetch from the same origin
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')

    if (url.pathname === '/health') {
      res.writeHead(200)
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }

    if (url.pathname === '/api/ask') {
      const q = url.searchParams.get('q') ?? ''
      if (!q.trim()) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'q parameter is required' }))
        return
      }

      if (!routerIndex) {
        // Index not yet built — return empty results rather than 503
        const empty: AskResponse = { results: [], query: q, indexedAt: '' }
        res.writeHead(200)
        res.end(JSON.stringify(empty))
        return
      }

      const response = route(q, routerIndex)
      res.writeHead(200)
      res.end(JSON.stringify(response))
      return
    }

    res.writeHead(404)
    res.end(JSON.stringify({ error: 'not found' }))
  })

  // ---------------------------------------------------------------------------
  // WebSocket server — attached to the same HTTP server
  // ---------------------------------------------------------------------------

  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (data) => {
      let msg: ClientMessage
      try {
        msg = JSON.parse(data.toString()) as ClientMessage
      } catch {
        return
      }

      if (msg.type === 'command:run') {
        onCommand(msg.command, msg.args)
      }
    })
  })

  // port: 0 asks the OS to pick a free port
  httpServer.listen(0, '127.0.0.1', () => {
    const addr = httpServer.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0
    onReady(port)
  })

  const broadcast = (msg: HostMessage): void => {
    const payload = JSON.stringify(msg)
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }

  const close = (): void => {
    wss.close()
    httpServer.close()
  }

  const setRouterIndex = (index: RouterIndex): void => {
    routerIndex = index
  }

  return { broadcast, close, setRouterIndex }
}
