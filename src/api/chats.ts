import { apiFetch } from './client'
import type { ChatSummary, ChatDetail, MessagePublic } from '../types/api'

export const listChats = () =>
  apiFetch<ChatSummary[]>('/chats')

export const createDirectChat = (user_id: string) =>
  apiFetch<ChatDetail>('/chats/direct', {
    method: 'POST',
    body: JSON.stringify({ user_id }),
  })

export const createGroupChat = (title: string, member_ids: string[], avatar_url?: string) =>
  apiFetch<ChatDetail>('/chats/group', {
    method: 'POST',
    body: JSON.stringify({ title, member_ids, avatar_url: avatar_url ?? null }),
  })

export const getChatDetail = (chat_id: string) =>
  apiFetch<ChatDetail>(`/chats/${chat_id}`)

export const getMessages = (chat_id: string, limit = 50, before_message_id?: string) => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before_message_id) params.set('before_message_id', before_message_id)
  return apiFetch<MessagePublic[]>(`/chats/${chat_id}/messages?${params}`)
}

export const sendMessageRest = (chat_id: string, text: string, reply_to_id?: string) =>
  apiFetch<MessagePublic>(`/chats/${chat_id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, type: 'text', reply_to_id: reply_to_id ?? null }),
  })

export const markRead = (chat_id: string, message_id?: string) =>
  apiFetch(`/chats/${chat_id}/read`, {
    method: 'POST',
    body: JSON.stringify({ message_id: message_id ?? null }),
  })
