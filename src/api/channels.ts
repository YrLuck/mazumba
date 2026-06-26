import { apiFetch } from './client'
import type { ChannelSummary, ChannelDetail } from '../types/api'

export const listChannels = (query?: string) => {
  const params = query ? `?query=${encodeURIComponent(query)}` : ''
  return apiFetch<ChannelSummary[]>(`/channels${params}`)
}

export const createChannel = (params: {
  title: string
  description: string
  slug?: string
  is_public: boolean
}) =>
  apiFetch<ChannelDetail>('/channels', {
    method: 'POST',
    body: JSON.stringify({
      title: params.title,
      description: params.description || params.title,
      slug: params.slug,
      is_public: params.is_public,
    }),
  })

export const getChannel = (channel_id: string) =>
  apiFetch<ChannelDetail>(`/channels/${channel_id}`)

export const subscribeChannel = (channel_id: string) =>
  apiFetch<ChannelDetail>(`/channels/${channel_id}/subscribe`, { method: 'POST' })

export const unsubscribeChannel = (channel_id: string) =>
  apiFetch<ChannelSummary>(`/channels/${channel_id}/subscribe`, { method: 'DELETE' })
