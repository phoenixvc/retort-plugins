import { WebSocketServer, WebSocket } from 'ws'
import type { HostMessage, ClientMessage } from './protocol.js'

export type CommandHandler = (command: string, args?: string[]) => void

/**
 * Creates a WebSocket server on a random available port.
 *
 * - Calls `onReady(port)` once the server is listening.
 * - Calls `onCommand` when a connected client sends a `command:run` message.
 *   The host (VS Code extension) reads these from stdout as `CMD:<json>`.
 *
 * Returns a `broadcast` function and a `close` function.
 */
export function createServer(
  onReady: (port: number) => void,
  onCommand: CommandHandler,
): {
  broadcast: (msg: HostMessage) => void
  close: () => void
} {
  const wss = new WebSocketServer({ port: 0 })

  wss.on('listening', () => {
    const addr = wss.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0
    onReady(port)
  })

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
      // 'ready' and 'file:open' are handled by the UI / extension layer;
      // we only need to relay command:run via stdout.
    })
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
  }

  return { broadcast, close }
}
