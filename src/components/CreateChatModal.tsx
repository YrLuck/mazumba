import { useState } from 'react'
import { X, Users, Hash, Image, Lock } from 'lucide-react'
import { createGroupChat } from '../api/chats'
import { createChannel } from '../api/channels'

interface Props {
  onClose: () => void
  defaultMode?: 'group' | 'channel'
}

type Mode = 'group' | 'channel'

export default function CreateChatModal({ onClose, defaultMode = 'group' }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setError(null)
    setLoading(true)
    try {
      if (mode === 'group') {
        await createGroupChat(name.trim(), [])
      } else {
        await createChannel({
          title: name.trim(),
          description: description.trim() || name.trim(),
          is_public: !isPrivate,
        })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e' }}>Create New</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#f4f2f8', borderRadius: '0.875rem', padding: '0.25rem' }}>
          {(['group', 'channel'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: "'Baloo Da 2', sans-serif",
                background: mode === m ? 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)' : 'transparent',
                color: mode === m ? 'white' : '#888',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              {m === 'group' ? <Users size={16} /> : <Hash size={16} />}
              {m === 'group' ? 'Group' : 'Channel'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f4f2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #ccc' }}>
            <Image size={28} color="#bbb" />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '0.75rem', padding: '0.6rem 0.875rem', marginBottom: '0.875rem', color: '#c0392b', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
          {mode === 'group'
            ? <Users size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            : <Hash size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />}
          <input
            className="input-field"
            placeholder={mode === 'group' ? 'Group name' : 'Channel name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ background: '#f4f2f8', borderRadius: '0.75rem', border: 'none', padding: '0.875rem 1rem', width: '100%', outline: 'none', fontFamily: "'Baloo Da 2', sans-serif", fontSize: '0.9rem', color: '#333', resize: 'none', minHeight: 72 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#f4f2f8', borderRadius: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color="#84247B" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>Private</span>
          </div>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: isPrivate ? 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)' : '#ccc', position: 'relative', transition: 'background 0.2s' }}
          >
            <span style={{ position: 'absolute', top: 2, left: isPrivate ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
          </button>
        </div>

        <button className="btn-primary" onClick={handleCreate} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating…' : `Create ${mode === 'group' ? 'Group' : 'Channel'}`}
        </button>
      </div>
    </div>
  )
}
