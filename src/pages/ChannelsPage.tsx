import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Hash, Users, ChevronLeft, Send } from 'lucide-react'
import CreateChatModal from '../components/CreateChatModal'
import { listChannels, subscribeChannel, unsubscribeChannel, getChannelPosts, createPost } from '../api/channels'
import type { ChannelSummary, ChannelPostPublic } from '../types/api'
import { useAppStore } from '../store/useAppStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useIsDesktop } from '../hooks/useIsDesktop'

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatTime(iso: string, lang: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172_800_000) return lang === 'ru' ? 'Вчера' : 'Yesterday'
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })
}

/* ── Channel posts view ──────────────────────────────────────── */
function ChannelView({ channel, onBack, isDesktop }: { channel: ChannelSummary; onBack: () => void; isDesktop: boolean }) {
  const { user } = useAppStore()
  const { t, lang } = useSettingsStore()
  const [posts, setPosts] = useState<ChannelPostPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [postText, setPostText] = useState('')
  const [posting, setPosting] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const isOwner = channel.current_user_role === 'owner' || channel.current_user_role === 'admin'

  useEffect(() => {
    setLoading(true)
    setPosts([])
    getChannelPosts(channel.id)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [channel.id])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [posts])

  const handlePost = async () => {
    if (!postText.trim() || posting) return
    const text = postText.trim()
    setPostText('')
    setPosting(true)
    try {
      const post = await createPost(channel.id, text)
      setPosts((prev) => [...prev, post])
    } catch { setPostText(text) }
    finally { setPosting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {!isDesktop && (
          <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
        )}
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
          {channel.cover_url ? <img src={channel.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Hash size={18} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }} className="truncate">#{channel.title}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {channel.subscribers_count.toLocaleString()} {t.subscribers}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{t.loading}</div>}
        {!loading && posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Hash size={28} color="var(--text-muted)" /></div>
            <span style={{ fontSize: '0.85rem' }}>{t.noPosts}</span>
          </div>
        )}
        {posts.filter((p) => !p.deleted_at).map((post) => (
          <div key={post.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, overflow: 'hidden' }}>
                {post.author?.avatar_url
                  ? <img src={post.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(post.author?.display_name ?? 'A')
                }
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{post.author?.display_name ?? 'Author'}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatTime(post.created_at, lang)}</div>
              </div>
            </div>
            {post.image_url && (
              <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius-xs)', marginBottom: '0.5rem', maxHeight: 300, objectFit: 'cover' }} />
            )}
            <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.55 }}>{post.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Post input (owners/admins only) */}
      {isOwner && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ flex: 1, background: 'var(--input-bg)', borderRadius: 'var(--radius-full)', padding: '0.45rem 0.875rem' }}>
            <input className="input-bare" placeholder={t.writePost} value={postText} onChange={(e) => setPostText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()} />
          </div>
          <button className="voice-btn" onClick={handlePost} disabled={posting || !postText.trim()}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Channel list panel ──────────────────────────────────────── */
function ChannelListPanel({ onOpen, openChannelId }: { onOpen: (ch: ChannelSummary) => void; openChannelId: string | null }) {
  const { t } = useSettingsStore()
  const [channels, setChannels] = useState<ChannelSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      setChannels(await listChannels(q))
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const timeout = setTimeout(() => load(search || undefined), 400)
    return () => clearTimeout(timeout)
  }, [search, load])

  const toggle = async (ch: ChannelSummary, e: React.MouseEvent) => {
    e.stopPropagation()
    setToggling(ch.id)
    try {
      if (ch.is_subscribed) {
        await unsubscribeChannel(ch.id)
        setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, is_subscribed: false, subscribers_count: c.subscribers_count - 1 } : c))
      } else {
        await subscribeChannel(ch.id)
        setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, is_subscribed: true, subscribers_count: c.subscribers_count + 1 } : c))
      }
    } catch { /* silently fail */ }
    finally { setToggling(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ padding: '1rem 1rem 0.75rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{t.channels}</h1>
          <button onClick={() => setShowModal(true)} style={{ border: 'none', background: 'var(--gradient)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <Plus size={18} />
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder={t.searchChannels} value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', padding: '0.6rem 0.75rem 0.6rem 2.25rem', fontSize: '0.875rem' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '1rem' }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && channels.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Hash size={28} color="var(--text-muted)" /></div>
            <span style={{ fontSize: '0.85rem' }}>{t.noChannelsFound}</span>
          </div>
        )}
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onOpen(ch)}
            style={{
              width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: openChannelId === ch.id ? 'rgba(132,36,123,0.06)' : 'var(--surface)',
              border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
              transition: 'background var(--duration) var(--ease)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
              {ch.cover_url ? <img src={ch.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Hash size={20} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }} className="truncate">#{ch.title}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {ch.last_post ? formatTime(ch.last_post.created_at, useSettingsStore.getState().lang) : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Users size={10} /> {ch.subscribers_count.toLocaleString()} {t.subscribers}
              </div>
              <div className="truncate" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {ch.last_post?.text ?? ch.description}
              </div>
            </div>
            <button
              onClick={(e) => toggle(ch, e)}
              disabled={toggling === ch.id}
              style={{
                flexShrink: 0, border: ch.is_subscribed ? '1.5px solid var(--primary)' : 'none',
                background: ch.is_subscribed ? 'var(--surface)' : 'var(--gradient)',
                color: ch.is_subscribed ? 'var(--primary)' : 'white',
                borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Baloo Da 2', sans-serif",
                opacity: toggling === ch.id ? 0.6 : 1,
              }}
            >
              {ch.is_subscribed ? t.leave : t.join}
            </button>
          </button>
        ))}
      </div>

      {showModal && <CreateChatModal onClose={() => { setShowModal(false); load() }} defaultMode="channel" />}
    </div>
  )
}

/* ── Main ChannelsPage ───────────────────────────────────────── */
export default function ChannelsPage() {
  const { openChannelId, setOpenChannel } = useAppStore()
  const { t } = useSettingsStore()
  const isDesktop = useIsDesktop()
  const [localChannel, setLocalChannel] = useState<ChannelSummary | null>(null)

  const handleOpen = (ch: ChannelSummary) => {
    setLocalChannel(ch)
    setOpenChannel(ch.id)
  }

  const handleBack = () => {
    setLocalChannel(null)
    setOpenChannel(null)
  }

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)' }}>
          <ChannelListPanel onOpen={handleOpen} openChannelId={openChannelId} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {localChannel ? (
            <ChannelView channel={localChannel} onBack={handleBack} isDesktop={true} />
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">
                <div style={{ background: 'var(--gradient)', borderRadius: 'var(--radius-full)', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hash size={32} color="white" />
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{t.selectChannel}</p>
              <p style={{ fontSize: '0.85rem' }}>{t.searchChannels}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (localChannel) {
    return <ChannelView channel={localChannel} onBack={handleBack} isDesktop={false} />
  }

  return <ChannelListPanel onOpen={handleOpen} openChannelId={null} />
}
