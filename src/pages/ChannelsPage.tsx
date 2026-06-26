import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Hash, Users } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import CreateChatModal from '../components/CreateChatModal'
import { listChannels, subscribeChannel, unsubscribeChannel } from '../api/channels'
import type { ChannelSummary } from '../types/api'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 172_800_000) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelSummary[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const loadChannels = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const data = await listChannels(q)
      setChannels(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  useEffect(() => {
    const timeout = setTimeout(() => loadChannels(search || undefined), 400)
    return () => clearTimeout(timeout)
  }, [search, loadChannels])

  const toggleSubscribe = async (ch: ChannelSummary) => {
    setToggling(ch.id)
    try {
      if (ch.is_subscribed) {
        await unsubscribeChannel(ch.id)
        setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, is_subscribed: false, subscribers_count: c.subscribers_count - 1 } : c))
      } else {
        await subscribeChannel(ch.id)
        setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, is_subscribed: true, subscribers_count: c.subscribers_count + 1 } : c))
      }
    } catch {
      // silently fail
    } finally {
      setToggling(null)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f6fc' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.75rem', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>Channels</h1>
            <button onClick={() => setShowModal(true)} style={{ border: 'none', background: 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <Plus size={20} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input className="input-field" placeholder="Search channels…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
        </div>

        <div style={{ padding: '0.5rem 0' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem', fontSize: '0.9rem' }}>Loading channels…</div>
          )}
          {!loading && channels.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '3rem 1.5rem', fontSize: '0.9rem' }}>No channels found.</div>
          )}
          {channels.map((ch) => (
            <div key={ch.id} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'white', borderBottom: '1px solid #f8f6fc' }}>
              <div className="avatar-ring">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#84247B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                  <Hash size={20} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Hash size={13} color="#84247B" />{ch.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#aaa' }}>
                    {ch.last_post ? formatTime(ch.last_post.created_at) : ''}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#bbb', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                  <Users size={11} />{ch.subscribers_count.toLocaleString()} subscribers
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                  {ch.last_post?.text ?? ch.description}
                </div>
              </div>
              <button
                onClick={() => toggleSubscribe(ch)}
                disabled={toggling === ch.id}
                style={{
                  flexShrink: 0,
                  border: ch.is_subscribed ? '1.5px solid #84247B' : 'none',
                  background: ch.is_subscribed ? 'white' : 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)',
                  color: ch.is_subscribed ? '#84247B' : 'white',
                  borderRadius: '0.75rem',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Baloo Da 2', sans-serif",
                  opacity: toggling === ch.id ? 0.6 : 1,
                }}
              >
                {ch.is_subscribed ? 'Leave' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
      {showModal && <CreateChatModal onClose={() => { setShowModal(false); loadChannels(search || undefined) }} defaultMode="channel" />}
    </div>
  )
}
