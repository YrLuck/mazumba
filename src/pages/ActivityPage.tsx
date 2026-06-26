import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { listNotifications, markAllRead, deleteNotification } from '../api/notifications'
import { socket } from '../ws/socket'
import type { NotificationPublic } from '../types/api'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`
  if (diff < 172_800_000) return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return `${Math.floor(diff / 86_400_000)} days ago`
}

function groupByDate(items: NotificationPublic[]) {
  const today: NotificationPublic[] = []
  const yesterday: NotificationPublic[] = []
  const earlier: NotificationPublic[] = []
  const now = new Date()

  for (const n of items) {
    const d = new Date(n.created_at)
    const diff = now.getTime() - d.getTime()
    if (diff < 86_400_000) today.push(n)
    else if (diff < 172_800_000) yesterday.push(n)
    else earlier.push(n)
  }
  return { today, yesterday, earlier }
}

function NotifItem({ item, onDelete }: { item: NotificationPublic; onDelete: (id: string) => void }) {
  const name = item.actor?.display_name ?? 'System'
  const avatar = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem', background: 'white', borderBottom: '1px solid #f8f6fc' }}>
      <div className="avatar-ring" style={item.is_read ? { background: '#eee', padding: '2.5px' } : {}}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#84247B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{avatar}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{name} </span>
        <span style={{ color: '#666', fontSize: '0.85rem' }}>{item.body}</span>
        <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.2rem' }}>{formatTime(item.created_at)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <button onClick={() => onDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd' }}><Trash2 size={14} /></button>
        {!item.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#84247B' }} />}
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<NotificationPublic[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await listNotifications()
      setNotifications(data.items)
      setUnreadCount(data.unread_count)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const off = socket.on((event) => {
      if (event.type === 'notification.created') {
        const n = event.payload.notification as NotificationPublic
        setNotifications((prev) => [n, ...prev])
        setUnreadCount((c) => c + 1)
      }
    })
    return off
  }, [])

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id).catch(() => {})
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((c) => {
      const deleted = notifications.find((n) => n.id === id)
      return deleted && !deleted.is_read ? c - 1 : c
    })
  }

  const { today, yesterday, earlier } = groupByDate(notifications)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f6fc' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.75rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>Activity</h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#84247B', fontWeight: 600 }}>{unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} style={{ border: '1.5px solid #e5e0f0', borderRadius: '0.875rem', padding: '0.4rem 0.75rem', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: '#84247B', fontFamily: "'Baloo Da 2', sans-serif" }}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button style={{ border: '1.5px solid #e5e0f0', borderRadius: '0.875rem', padding: '0.4rem 0.6rem', background: 'white', cursor: 'pointer', color: '#84247B' }}>
              <Bell size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem', fontSize: '0.9rem' }}>Loading…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '3rem 1.5rem', fontSize: '0.9rem' }}>No notifications yet.</div>
        )}

        {today.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem' }}>
              <span className="section-label" style={{ padding: 0 }}>Today</span>
              {today.filter((n) => !n.is_read).length > 0 && (
                <span style={{ background: 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', color: 'white', fontSize: '0.65rem', fontWeight: 700, borderRadius: '9999px', padding: '2px 8px' }}>
                  {today.filter((n) => !n.is_read).length} new
                </span>
              )}
            </div>
            {today.map((n) => <NotifItem key={n.id} item={n} onDelete={handleDelete} />)}
          </div>
        )}

        {yesterday.length > 0 && (
          <div>
            <span className="section-label" style={{ display: 'block', padding: '0.75rem 1.25rem 0.25rem' }}>Yesterday</span>
            {yesterday.map((n) => <NotifItem key={n.id} item={n} onDelete={handleDelete} />)}
          </div>
        )}

        {earlier.length > 0 && (
          <div>
            <span className="section-label" style={{ display: 'block', padding: '0.75rem 1.25rem 0.25rem' }}>Earlier</span>
            {earlier.map((n) => <NotifItem key={n.id} item={n} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
