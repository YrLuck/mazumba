import { useState } from 'react'
import { X, Users, Hash, Lock } from 'lucide-react'
import { createGroupChat } from '../api/chats'
import { createChannel } from '../api/channels'
import { useSettingsStore } from '../store/useSettingsStore'

interface Props {
  onClose: () => void
  defaultMode?: 'group' | 'channel'
}

type Mode = 'group' | 'channel'

export default function CreateChatModal({ onClose, defaultMode = 'group' }: Props) {
  const { t } = useSettingsStore()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) { setError(t.nameRequired); return }
    setError(null)
    setLoading(true)
    try {
      if (mode === 'group') {
        await createGroupChat(name.trim(), [])
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
              onClick={() => setMode(m)}
              style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Baloo Da 2', sans-serif", background: mode === m ? 'var(--gradient)' : 'transparent', color: mode === m ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {m === 'group' ? <Users size={16} /> : <Hash size={16} />}
              {m === 'group' ? t.group : t.channel}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '0.875rem' }}>{error}</div>
        )}

        <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
          {mode === 'group'
            ? <Users size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            : <Hash size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          }
          <input className="input-field" placeholder={mode === 'group' ? t.groupName : t.channelName} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
        </div>

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

        <button className="btn-primary" onClick={handleCreate} disabled={loading}>
          {loading ? <span className="spinner" /> : (mode === 'group' ? t.createGroup : t.createChannel)}
        </button>
      </div>
    </div>
  )
}
