import { apiFetch } from './client'
import type { UserPublic, UserProfile } from '../types/api'

export const getMe = () =>
  apiFetch<UserPublic>('/users/me')

export const getMyProfile = () =>
  apiFetch<UserProfile>('/users/me/profile')

export const updateMe = (params: {
  display_name?: string
  username?: string
  bio?: string
  avatar_url?: string
}) =>
  apiFetch<UserPublic>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(params),
  })
