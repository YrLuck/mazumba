import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Plus, Mic, MicOff, Send, Smile, Paperclip } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import CreateChatModal from '../components/CreateChatModal'
import { listChats, getMessages, sendMessageRest, markRead } from '../api/chats'
import { socket } from '../ws/socket'
import type { ChatSummary, MessagePublic } from '../types/api'
import { useAppStore } from '../store/useAppStore'

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#4fc3f7', '#84247B', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#ff5722']
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172_800_000) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function ChatsPage() {
  const { user } = useAppStore()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [search, setSearch] = useState('')
  const [openChat, setOpenChat] = useState<ChatSummary | null>(null)
  const [messages, setMessages] = useState<MessagePublic[]>([])
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [recording, setRecording] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadChats = useCallback(async () => {
    try {
      const data = await listChats()
      setChats(data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    } catch {
      // silently fail — user sees empty state
    } finally {
      setLoadingChats(false)
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  useEffect(() => {
    const off = socket.on((event) => {
      if (event.type === 'message.created') {
        const msg = event.payload.message as MessagePublic
        if (openChat && msg.chat_id === openChat.id) {
          setMessages((prev) => [...prev, msg])
          markRead(openChat.id, msg.id).catch(() => {})
        }
        setChats((prev) => {
          const updated = prev.map((c) =>
            c.id === msg.chat_id
              ? { ...c, last_message: msg, unread_count: c.id === openChat?.id ? 0 : c.unread_count + 1, updated_at: msg.created_at }
              : c
          )
          return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        })
      }
      if (event.type === 'chat.updated') {
        const chat = event.payload.chat as ChatSummary
        setChats((prev) => {
          const exists = prev.some((c) => c.id === chat.id)
          const updated = exists ? prev.map((c) => (c.id === chat.id ? chat : c)) : [chat, ...prev]
          return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        })
      }
    })
    return off
  }, [openChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openChatView = async (chat: ChatSummary) => {
    setOpenChat(chat)
    setMessages([])
    setLoadingMsgs(true)
    try {
      const data = await getMessages(chat.id)
      setMessages(data)
      if (data.length > 0) {
        markRead(chat.id, data[data.length - 1].id).catch(() => {})
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread_count: 0 } : c)))
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMsgs(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || !openChat || sending) return
    const text = message.trim()
    setMessage('')
    setSending(true)

    const sent = socket.send('message.send', { chat_id: openChat.id, text, type: 'text', reply_to_id: null })
    if (!sent) {
      try {
        const msg = await sendMessageRest(openChat.id, text)
        setMessages((prev) => [...prev, msg])
      } catch {
        setMessage(text)
      }
    }
    setSending(false)
  }

  const toggleRecording = () => {
    if (recording) {
      setRecording(false)
      if (recTimerRef.current) clearTimeout(recTimerRef.current)
    } else {
      setRecording(true)
      recTimerRef.current = setTimeout(() => setRecording(false), 10_000)
    }
  }

  const filtered = chats.filter((c) =>
    (c.title ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (openChat) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f0eef8' }}>
          <button onClick={() => setOpenChat(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#84247B', lineHeight: 1 }}>←</button>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarColor(openChat.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
            {initials(openChat.title)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{openChat.title ?? 'Chat'}</div>
            <div style={{ fontSize: '0.7rem', color: '#84247B' }}>
              {openChat.type === 'group' ? `${openChat.members_count} members` : 'online'}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f8f6fc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadingMsgs && (
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.85rem', padding: '2rem' }}>Loading…</div>
          )}
          {!loadingMsgs && messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.85rem', padding: '2rem' }}>No messages yet. Say hello!</div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '72%',
                  padding: '0.6rem 0.875rem',
                  borderRadius: mine ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                  background: mine ? 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)' : 'white',
                  color: mine ? 'white' : '#333',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {!mine && openChat.type === 'group' && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#84247B', marginBottom: '0.2rem' }}>
                      {m.sender?.display_name ?? 'Unknown'}
                    </div>
                  )}
                  <div>{m.text}</div>
                  <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '0.2rem', opacity: 0.7 }}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
          {recording && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ padding: '0.6rem 0.875rem', borderRadius: '1rem 1rem 0.2rem 1rem', background: 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse-ring 1s infinite', display: 'inline-block' }} />
                Recording…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ background: 'white', borderTop: '1px solid #f0eef8', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}><Smile size={22} /></button>
          <div style={{ flex: 1, background: '#f4f2f8', borderRadius: '1.5rem', padding: '0.5rem 0.875rem' }}>
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Baloo Da 2', sans-serif", fontSize: '0.9rem', color: '#333' }}
              placeholder="Message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
          </div>
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}><Paperclip size={20} /></button>
          {message.trim() ? (
            <button className="voice-btn" onClick={handleSend} disabled={sending}><Send size={18} /></button>
          ) : (
            <button className={`voice-btn${recording ? ' recording' : ''}`} onClick={toggleRecording}>
              {recording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f6fc' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.75rem', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>Chats</h1>
            <button onClick={() => setShowModal(true)} style={{ border: 'none', background: 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <Plus size={20} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input className="input-field" placeholder="Search chats…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
        </div>

        <div style={{ padding: '0.5rem 0' }}>
          {loadingChats && (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem', fontSize: '0.9rem' }}>Loading chats…</div>
          )}
          {!loadingChats && filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '3rem 1.5rem', fontSize: '0.9rem' }}>
              No chats yet. Start a conversation!
            </div>
          )}
          {filtered.map((chat) => (
            <button key={chat.id} onClick={() => openChatView(chat)} style={{ width: '100%', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'white', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f8f6fc', textAlign: 'left' }}>
              <div className="avatar-ring">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarColor(chat.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                  {initials(chat.title)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{chat.title ?? 'Chat'}</span>
                  <span style={{ fontSize: '0.7rem', color: '#aaa', flexShrink: 0 }}>
                    {chat.last_message ? formatTime(chat.last_message.created_at) : ''}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                  {chat.last_message?.text ?? 'No messages yet'}
                </div>
              </div>
              {chat.unread_count > 0 && (
                <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', color: 'white', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {chat.unread_count}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
      {showModal && <CreateChatModal onClose={() => { setShowModal(false); loadChats() }} />}
    </div>
  )
}
