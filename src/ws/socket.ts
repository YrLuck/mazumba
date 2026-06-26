import { getTokens } from '../api/client'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/api/v1/ws'

export interface WsEvent {
  type: string
  payload: Record<string, unknown>
}

type Handler = (event: WsEvent) => void

class SocketManager {
  private ws: WebSocket | null = null
  private handlers = new Set<Handler>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = false

  connect() {
    const { access } = getTokens()
    if (!access || this.ws?.readyState === WebSocket.OPEN) return
    this.shouldReconnect = true
    this._open(access)
  }

  private _open(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return
    this.ws = new WebSocket(`${WS_BASE}?token=${token}`)

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as WsEvent
        this.handlers.forEach((h) => h(event))
      } catch {
        // ignore malformed frames
      }
    }

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          const { access } = getTokens()
          if (access) this._open(access)
        }, 3000)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
      return true
    }
    return false
  }

  on(handler: Handler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const socket = new SocketManager()
