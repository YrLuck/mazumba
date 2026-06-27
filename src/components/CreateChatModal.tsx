import { useState, useEffect, useRef } from 'react'
import { X, Users, Hash, Lock, Search, UserPlus } from 'lucide-react'
import { createGroupChat } from '../api/chats'
import { createChannel } from '../api/channels'
import { searchUsers } from '../api/users'
import type { SearchItem } from '../api/users'
import { useSettingsStore } from '../store/useSettingsStore'

interface Props {
  onClose: () => void
  defaultMode?: 'group' | 'channel'
}

type Mode = 'group' | 'channel'

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function CreateChatModal({ onClose, defaultMode = 'group' }: Props) {
  const { t } = useSettingsStore()
  const [mode, setMode]               = useState<Mode>(defaultMode)
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Member search state
  const [memberQuery, setMemberQuery]     = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [searching, setSearching]         = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<SearchItem[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (mode !== 'group' || memberQuery.length < 2) {
      setSearchResults([])
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchUsers(memberQuery)
        const filtered = res.users.filter((u) => !selectedMembers.some((s) => s.id === u.id))
        setSearchResults(filtered)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [memberQuery, mode, selectedMembers])

  const addMember = (item: SearchItem) => {
    setSelectedMembers((prev) => [...prev, item])
    setSearchResults([])
    setMemberQuery('')
  }

  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError(t.nameRequired); return }
    if (mode === 'group' && selectedMembers.length === 0) {
      setError(t.membersRequired)
      return
    }
    setError(null)
    setLoading(true)
    try {
      if (mode === 'group') {
        await createGroupChat(name.trim(), selectedMembers.map((m) => m.id))
      } else {
        await createChannel({ title: name.trim(), description: description.trim() || name.trim(), is_public: !isPrivate })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.createFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>{t.createNew}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={22} />
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
          {(['group', 'channel'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-xs)', border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Baloo Da 2', sans-serif",
                background: mode === m ? 'var(--gradient)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}
            >
              {m === 'group' ? <Users size={16} /> : <Hash size={16} />}
              {m === 'group' ? t.group : t.channel}
            </button>
          ))}
        </div>

        {error && <div className="error-banner" style={{ marginBottom: '0.875rem' }}>{error}</div>}

        {/* Name input */}
        <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
          {mode === 'group'
            ? <Users size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            : <Hash size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          }
          <input
            className="input-field"
            placeholder={mode === 'group' ? t.groupName : t.channelName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>

        {/* Group-specific: member search */}
        {mode === 'group' && (
          <div style={{ marginBottom: '0.875rem' }}>
            {/* Selected member chips */}
            {selectedMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {selectedMembers.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    background: 'rgba(132,36,123,0.1)', borderRadius: 'var(--radius-full)',
                    padding: '0.25rem 0.5rem 0.25rem 0.35rem',
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.55rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                      {m.url ? <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(m.title)}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{m.title}</span>
                    <button onClick={() => removeMember(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Member search input */}
            <div style={{ position: 'relative' }}>
              <UserPlus size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="input-field"
                placeholder={t.searchMembers}
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                autoComplete="off"
              />
              {searching && (
                <span className="spinner-primary" style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} />
              )}
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '0.35rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto', boxShadow: 'var(--shadow-card)' }}>
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addMember(u)}
                    style={{
                      width: '100%', padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                      border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid var(--border)', fontFamily: "'Baloo Da 2', sans-serif",
                      transition: 'background var(--duration) var(--ease)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--input-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                      {u.url ? <img src={u.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(u.title)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{u.title}</div>
                      {u.subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.subtitle}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {memberQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <div style={{ marginTop: '0.35rem', padding: '0.6rem 0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {t.noUsersFound}
              </div>
            )}
          </div>
        )}

        {/* Channel-specific: description + private toggle */}
        {mode === 'channel' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                placeholder={t.descriptionOptional}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', border: 'none', padding: '0.875rem 1rem', width: '100%', outline: 'none', fontFamily: "'Baloo Da 2', sans-serif", fontSize: '0.9rem', color: 'var(--text)', resize: 'none', minHeight: 72 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{t.privateToggle}</span>
              </div>
              <button className={`toggle-track ${isPrivate ? 'on' : 'off'}`} onClick={() => setIsPrivate(!isPrivate)}>
                <span className="toggle-thumb" />
              </button>
            </div>
          </>
        )}

        {mode === 'group' && <div style={{ marginBottom: '1rem' }} />}

        <button className="btn-primary" onClick={handleCreate} disabled={loading}>
          {loading ? <span className="spinner" /> : (mode === 'group' ? t.createGroup : t.createChannel)}
        </button>
      </div>
    </div>
  )
}
