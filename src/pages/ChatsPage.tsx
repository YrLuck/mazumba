import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Plus, Mic, MicOff, Send, Paperclip,
  ChevronLeft, MoreVertical, Edit2, Trash2, Reply,
  Smile, X, Check, CheckCheck,
} from 'lucide-react'
import CreateChatModal from '../components/CreateChatModal'
import { listChats, getMessages, sendMessageRest, markRead } from '../api/chats'
import { editMessage, deleteMessage, addReaction } from '../api/messages'
import { uploadFile } from '../api/files'
import { socket } from '../ws/socket'
import type { ChatSummary, MessagePublic } from '../types/api'
import { useAppStore } from '../store/useAppStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useIsDesktop } from '../hooks/useIsDesktop'

/* ── Helpers ─────────────────────────────────────────────────── */
function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const COLORS = ['#4fc3f7', '#84247B', '#e91e63', '#ff9800', '#4caf50', '#9c27b0']
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

function formatTime(iso: string, t: ReturnType<typeof import('../store/useSettingsStore').useSettingsStore>['t']) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return t.now
  if (diff < 3_600_000) return t.minAgo(Math.floor(diff / 60_000))
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172_800_000) return t.yesterday
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉']

/* ── Typing store (module-level) ─────────────────────────────── */
const typingUsers = new Map<string /* chatId */, Set<string /* userId */>>()
const typingListeners = new Set<() => void>()
function notifyTyping() { typingListeners.forEach((fn) => fn()) }
function setTyping(chatId: string, userId: string, active: boolean) {
  let set = typingUsers.get(chatId)
  if (!set) { set = new Set(); typingUsers.set(chatId, set) }
  if (active) set.add(userId)
  else set.delete(userId)
  notifyTyping()
}
function useTypingUsers(chatId: string | null) {
  const [, tick] = useState(0)
  useEffect(() => {
    const fn = () => tick((n) => n + 1)
    typingListeners.add(fn)
    return () => { typingListeners.delete(fn) }
  }, [])
  if (!chatId) return []
  return Array.from(typingUsers.get(chatId) ?? [])
}

/* ── Reaction bar ────────────────────────────────────────────── */
function ReactionBar({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  return (
    <div className="emoji-picker" style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, zIndex: 20 }}>
      {EMOJIS.map((e) => (
        <button key={e} className="emoji-btn" onClick={() => { addReaction(messageId, e).catch(() => {}); onClose() }}>{e}</button>
      ))}
    </div>
  )
}

/* ── Message bubble ──────────────────────────────────────────── */
function MessageBubble({
  msg, mine, isGroup, replyMsg, onReply, onEdit, onDelete, t,
}: {
  msg: MessagePublic; mine: boolean; isGroup: boolean;
  replyMsg?: MessagePublic | null; onReply: () => void; onEdit: () => void; onDelete: () => void;
  t: ReturnType<typeof import('../store/useSettingsStore').useSettingsStore>['t']
}) {
  const [showCtx, setShowCtx] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCtx && !showEmoji) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowCtx(false); setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showCtx, showEmoji])

  if (msg.deleted_at) {
    return (
      <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', padding: '0.1rem 0' }}>
        <div style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          🗑 {t.deleteMessage}d
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', padding: '0.1rem 0', position: 'relative' }}>
      {!mine && isGroup && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(msg.sender_id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginRight: '0.4rem', alignSelf: 'flex-end' }}>
          {initials(msg.sender?.display_name ?? null)}
        </div>
      )}

      <div style={{ maxWidth: '72%', position: 'relative' }}>
        {/* Reply preview */}
        {replyMsg && (
          <div style={{ fontSize: '0.75rem', color: mine ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', borderLeft: '2.5px solid', borderColor: mine ? 'rgba(255,255,255,0.5)' : 'var(--primary)', paddingLeft: '0.5rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {replyMsg.text}
          </div>
        )}

        <div
          onClick={() => { setShowCtx(true); setShowEmoji(false) }}
          style={{
            padding: '0.55rem 0.875rem',
            borderRadius: mine ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
            background: mine ? 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)' : 'var(--bubble-other)',
            color: mine ? 'white' : 'var(--bubble-other-text)',
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            wordBreak: 'break-word',
          }}
        >
          {!mine && isGroup && (
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: mine ? 'rgba(255,255,255,0.85)' : 'var(--primary)', marginBottom: '0.15rem' }}>
              {msg.sender?.display_name ?? 'User'}
            </div>
          )}
          {/* Attachment */}
          {msg.attachment_url && (
            <div style={{ marginBottom: '0.3rem' }}>
              {msg.attachment_mime_type?.startsWith('image/') ? (
                <img src={msg.attachment_url} alt={msg.attachment_name ?? ''} style={{ maxWidth: 200, maxHeight: 200, borderRadius: 'var(--radius-xs)', display: 'block' }} />
              ) : (
                <a href={msg.attachment_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', opacity: 0.85, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Paperclip size={12} /> {msg.attachment_name ?? 'File'}
                </a>
              )}
            </div>
          )}
          {msg.text && <div>{msg.text}</div>}
          <div style={{ fontSize: '0.6rem', textAlign: 'right', marginTop: '0.2rem', opacity: 0.65, display: 'flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'flex-end' }}>
            {msg.edited_at && <span style={{ fontStyle: 'italic' }}>edited</span>}
            <span>{formatTime(msg.created_at, t)}</span>
            {mine && <CheckCheck size={10} />}
          </div>
        </div>

        {/* Context menu */}
        {showCtx && (
          <div className="ctx-menu" style={{ right: mine ? 0 : 'auto', left: mine ? 'auto' : 0 }}>
            <button className="ctx-item" onClick={() => { onReply(); setShowCtx(false) }}><Reply size={14} /> {t.reply}</button>
            <button className="ctx-item" onClick={() => { setShowEmoji(true); setShowCtx(false) }}><Smile size={14} /> {t.addReaction}</button>
            {mine && <button className="ctx-item" onClick={() => { onEdit(); setShowCtx(false) }}><Edit2 size={14} /> {t.editMessage}</button>}
            {mine && <button className="ctx-item danger" onClick={() => { onDelete(); setShowCtx(false) }}><Trash2 size={14} /> {t.deleteMessage}</button>}
          </div>
        )}

        {/* Emoji reaction picker */}
        {showEmoji && (
          <div style={{ position: 'absolute', bottom: '100%', [mine ? 'right' : 'left']: 0, marginBottom: 4, zIndex: 20 }}>
            <ReactionBar messageId={msg.id} onClose={() => setShowEmoji(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Chat view (messages + input) ────────────────────────────── */
function ChatView({ chat, onBack, isDesktop }: { chat: ChatSummary; onBack: () => void; isDesktop: boolean }) {
  const { user } = useAppStore()
  const { t } = useSettingsStore()
  const [messages, setMessages] = useState<MessagePublic[]>([])
  const [messagesMap, setMessagesMap] = useState<Map<string, MessagePublic>>(new Map())
  const [message, setMessage] = useState('')
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [replyTo, setReplyTo] = useState<MessagePublic | null>(null)
  const [editingMsg, setEditingMsg] = useState<MessagePublic | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingUserIds = useTypingUsers(chat.id)

  useEffect(() => {
    setLoading(true)
    setMessages([])
    setMessagesMap(new Map())
    setReplyTo(null)
    setEditingMsg(null)
    getMessages(chat.id).then((data) => {
      setMessages(data)
      const m = new Map<string, MessagePublic>()
      data.forEach((msg) => m.set(msg.id, msg))
      setMessagesMap(m)
      if (data.length > 0) markRead(chat.id, data[data.length - 1].id).catch(() => {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [chat.id])

  useEffect(() => {
    const off = socket.on((ev) => {
      if (ev.type === 'message.created') {
        const msg = ev.payload.message as MessagePublic
        if (msg.chat_id !== chat.id) return
        setMessages((prev) => [...prev, msg])
        setMessagesMap((prev) => new Map(prev).set(msg.id, msg))
        markRead(chat.id, msg.id).catch(() => {})
      }
      if (ev.type === 'typing.start') {
        const { chat_id, user_id } = ev.payload as { chat_id: string; user_id: string }
        if (chat_id === chat.id && user_id !== user?.id) setTyping(chat.id, user_id, true)
      }
      if (ev.type === 'typing.stop') {
        const { chat_id, user_id } = ev.payload as { chat_id: string; user_id: string }
        if (chat_id === chat.id) setTyping(chat.id, user_id, false)
      }
    })
    return () => { off(); typingUsers.delete(chat.id); notifyTyping() }
  }, [chat.id, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUserIds.length])

  const handleTyping = () => {
    socket.send('typing.start', { chat_id: chat.id })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socket.send('typing.stop', { chat_id: chat.id })
    }, 3000)
  }

  const handleSend = async () => {
    const text = message.trim()
    if (!text && !editingMsg) return
    if (sending) return

    if (editingMsg) {
      setEditingMsg(null)
      setMessage('')
      editMessage(editingMsg.id, text).then((updated) => {
        setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m))
        setMessagesMap((prev) => new Map(prev).set(updated.id, updated))
      }).catch(() => {})
      return
    }

    setMessage('')
    setSending(true)
    const sent = socket.send('message.send', { chat_id: chat.id, text, type: 'text', reply_to_id: replyTo?.id ?? null })
    setReplyTo(null)
    if (!sent) {
      try {
        const msg = await sendMessageRest(chat.id, text, replyTo?.id)
        setMessages((prev) => [...prev, msg])
        setMessagesMap((prev) => new Map(prev).set(msg.id, msg))
      } catch { setMessage(text) }
    }
    setSending(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const uploaded = await uploadFile(file)
      const sent = socket.send('message.send', {
        chat_id: chat.id, text: '', type: file.type.startsWith('image/') ? 'image' : 'file',
        attachment_url: uploaded.url, attachment_mime_type: uploaded.mime_type,
        attachment_name: uploaded.original_filename, attachment_size: uploaded.size_bytes,
        reply_to_id: null,
      })
      if (!sent) {
        const msg = await sendMessageRest(chat.id, uploaded.original_filename, undefined)
        setMessages((prev) => [...prev, msg])
      }
    } catch { /* silently fail */ }
    finally { setUploading(false) }
  }

  const handleDelete = (msg: MessagePublic) => {
    deleteMessage(msg.id).then(() => {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, deleted_at: new Date().toISOString() } : m))
    }).catch(() => {})
  }

  const startEdit = (msg: MessagePublic) => {
    setEditingMsg(msg)
    setReplyTo(null)
    setMessage(msg.text)
    inputRef.current?.focus()
  }

  const cancelEdit = () => { setEditingMsg(null); setMessage('') }
  const cancelReply = () => setReplyTo(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {!isDesktop && (
          <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
        )}
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarColor(chat.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, overflow: 'hidden' }}>
          {chat.avatar_url ? <img src={chat.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(chat.title)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }} className="truncate">{chat.title ?? 'Chat'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>
            {typingUserIds.length > 0
              ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>typing <span className="typing-dots" style={{ display: 'inline-flex' }}>{[0,1,2].map((i) => <span key={i} className="typing-dot" style={{ display: 'inline-block' }} />)}</span></span>
              : chat.type === 'group' ? `${chat.members_count} ${t.members}` : t.online
            }
          </div>
        </div>
        <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>{t.loadingMessages}</div>}
        {!loading && messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>{t.noMessages}</div>}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            msg={m}
            mine={m.sender_id === user?.id}
            isGroup={chat.type === 'group'}
            replyMsg={m.reply_to_id ? messagesMap.get(m.reply_to_id) : null}
            onReply={() => { setReplyTo(m); setEditingMsg(null); inputRef.current?.focus() }}
            onEdit={() => startEdit(m)}
            onDelete={() => handleDelete(m)}
            t={t}
          />
        ))}

        {/* Typing indicator */}
        {typingUserIds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0.1rem 0' }}>
            <div style={{ padding: '0.5rem 0.875rem', borderRadius: '1rem 1rem 1rem 0.2rem', background: 'var(--bubble-other)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="typing-dots">
                {[0,1,2].map((i) => <span key={i} className="typing-dot" />)}
              </div>
            </div>
          </div>
        )}

        {recording && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ padding: '0.6rem 0.875rem', borderRadius: '1rem 1rem 0.2rem 1rem', background: 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse-ring 1s infinite', display: 'inline-block' }} />
              {t.recording}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {/* Reply / edit bar */}
        {(replyTo || editingMsg) && (
          <div className="reply-bar">
            {replyTo && <><Reply size={14} color="var(--primary)" /><span style={{ flex: 1 }}><strong>{t.replyingTo}:</strong> {replyTo.text}</span></>}
            {editingMsg && <><Edit2 size={14} color="var(--primary)" /><span style={{ flex: 1 }}><strong>{t.editingMessage}</strong></span></>}
            <button onClick={replyTo ? cancelReply : cancelEdit} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem' }}>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <span className="spinner-primary" style={{ width: 18, height: 18 }} /> : <Paperclip size={20} />}
          </button>

          <div style={{ flex: 1, background: 'var(--input-bg)', borderRadius: 'var(--radius-full)', padding: '0.45rem 0.875rem', display: 'flex', alignItems: 'center' }}>
            <input
              ref={inputRef}
              className="input-bare"
              placeholder={t.messagePlaceholder}
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping() }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
          </div>

          {message.trim() || editingMsg ? (
            <button className="voice-btn" onClick={handleSend} disabled={sending}>
              {editingMsg ? <Check size={18} /> : <Send size={18} />}
            </button>
          ) : (
            <button className={`voice-btn${recording ? ' recording' : ''}`} onClick={() => setRecording(!recording)}>
              {recording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Chat list panel ─────────────────────────────────────────── */
function ChatListPanel({ onOpen, openChatId }: { onOpen: (chat: ChatSummary) => void; openChatId: string | null }) {
  const { t } = useSettingsStore()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await listChats()
      setChats(data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const off = socket.on((ev) => {
      if (ev.type === 'message.created') {
        const msg = ev.payload.message as MessagePublic
        setChats((prev) => {
          const updated = prev.map((c) => c.id === msg.chat_id
            ? { ...c, last_message: msg, unread_count: c.id === openChatId ? 0 : c.unread_count + 1, updated_at: msg.created_at }
            : c)
          return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        })
      }
      if (ev.type === 'chat.updated') {
        const chat = ev.payload.chat as ChatSummary
        setChats((prev) => {
          const exists = prev.some((c) => c.id === chat.id)
          const updated = exists ? prev.map((c) => c.id === chat.id ? chat : c) : [chat, ...prev]
          return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        })
      }
    })
    return off
  }, [openChatId])

  const filtered = chats.filter((c) => (c.title ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1rem 0.75rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{t.chats}</h1>
          <button onClick={() => setShowModal(true)} style={{ border: 'none', background: 'var(--gradient)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <Plus size={18} />
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder={t.searchChats} value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', padding: '0.6rem 0.75rem 0.6rem 2.25rem', fontSize: '0.875rem' }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '1rem' }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={28} color="var(--text-muted)" /></div>
            <span style={{ fontSize: '0.85rem' }}>{t.noChatsYet}</span>
          </div>
        )}
        {filtered.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onOpen(chat)}
            style={{
              width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: openChatId === chat.id ? 'rgba(132,36,123,0.06)' : 'var(--surface)',
              border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
              transition: 'background var(--duration) var(--ease)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarColor(chat.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
              {chat.avatar_url ? <img src={chat.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(chat.title)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }} className="truncate">{chat.title ?? 'Chat'}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {chat.last_message ? formatTime(chat.last_message.created_at, useSettingsStore.getState().t) : ''}
                </span>
              </div>
              <div className="truncate" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                {chat.last_message?.text ?? t.noMessages}
              </div>
            </div>
            {chat.unread_count > 0 && (
              <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: 'var(--gradient)', color: 'white', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </div>
            )}
          </button>
        ))}
      </div>

      {showModal && <CreateChatModal onClose={() => { setShowModal(false); load() }} />}
    </div>
  )
}

/* ── Main ChatsPage ──────────────────────────────────────────── */
export default function ChatsPage() {
  const { openChatId, setOpenChat } = useAppStore()
  const { t } = useSettingsStore()
  const isDesktop = useIsDesktop()
  const [localChat, setLocalChat] = useState<ChatSummary | null>(null)

  const openChat = localChat

  const handleOpen = (chat: ChatSummary) => {
    setLocalChat(chat)
    setOpenChat(chat.id)
  }

  const handleBack = () => {
    setLocalChat(null)
    setOpenChat(null)
  }

  /* Desktop: split view */
  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)' }}>
          <ChatListPanel onOpen={handleOpen} openChatId={openChatId} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {openChat ? (
            <ChatView chat={openChat} onBack={handleBack} isDesktop={true} />
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">
                <div style={{ background: 'var(--gradient)', borderRadius: 'var(--radius-full)', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{t.selectChat}</p>
              <p style={{ fontSize: '0.85rem' }}>{t.noChatsYet}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* Mobile: switch between list and chat */
  if (openChat) {
    return <ChatView chat={openChat} onBack={handleBack} isDesktop={false} />
  }

  return <ChatListPanel onOpen={handleOpen} openChatId={null} />
}
