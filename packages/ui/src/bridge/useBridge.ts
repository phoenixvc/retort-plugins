import { useEffect, useRef, useState, useCallback } from 'react'
import type { ClientMessage, HostMessage } from './types'
import { useStore } from './useStore'

// Derive the WebSocket URL from the page's own origin so this works whether
// state-watcher opened the WebView at port 4523 or any other dynamic port.
// Override via ?port=<n> in the URL for local development against a specific server.
function resolveWsUrl(): string {
  const params = new URLSearchParams(window.location.search)
  const port = params.get('port') ?? window.location.port
  const host = window.location.hostname || 'localhost'
  return `ws://${host}:${port}/ws`
}

export interface BridgeHandle {
  send: (msg: ClientMessage) => void
  connected: boolean
}

export function useBridge(): BridgeHandle {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const applyMessage = useStore((s) => s.applyMessage)

  // Stable send function — queues nothing, silently drops if disconnected.
  // Callers should check `connected` before sending commands that require a response.
  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (cancelled) return

      const url = resolveWsUrl()
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled) { ws.close(); return }
        setConnected(true)
        // Announce readiness so state-watcher sends an initial snapshot.
        ws.send(JSON.stringify({ type: 'ready' } satisfies ClientMessage))
      }

      ws.onmessage = (event: MessageEvent<string>) => {
        let msg: HostMessage
        try {
          msg = JSON.parse(event.data) as HostMessage
        } catch {
          // Ignore malformed frames — state-watcher should only send valid JSON.
          return
        }
        applyMessage(msg)
      }

      ws.onclose = () => {
        if (cancelled) return
        setConnected(false)
        // Reconnect after 2 s — covers transient restarts of state-watcher.
        retryTimeout = setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        // onclose fires after onerror, so reconnect logic lives there.
        ws.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimeout !== null) clearTimeout(retryTimeout)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [applyMessage])

  return { send, connected }
}
