import { create } from 'zustand'
import { getTokens, clearTokens } from '../api/client'
import type { UserPublic } from '../types/api'

export type Page = 'login' | 'register' | 'chats' | 'channels' | 'activity' | 'profile'

interface AppStore {
  page: Page
  user: UserPublic | null
  setPage: (p: Page) => void
  setUser: (user: UserPublic | null) => void
  logout: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  page: getTokens().access ? 'chats' : 'login',
  user: null,
  setPage: (page) => set({ page }),
  setUser: (user) => set({ user }),
  logout: () => {
    clearTokens()
    set({ page: 'login', user: null })
  },
}))
