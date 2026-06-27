import { create } from 'zustand'
import type { Lang } from '../i18n'
import { getT } from '../i18n'

export type Theme = 'light' | 'dark'

interface SettingsStore {
  theme: Theme
  lang: Lang
  t: ReturnType<typeof getT>
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  setLang: (l: Lang) => void
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

const savedTheme = (localStorage.getItem('theme') as Theme | null) ?? 'light'
const savedLang  = (localStorage.getItem('lang')  as Lang  | null) ?? 'en'

applyTheme(savedTheme)

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: savedTheme,
  lang: savedLang,
  t: getT(savedLang),

  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      applyTheme(next)
      return { theme: next }
    }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  setLang: (lang) => {
    localStorage.setItem('lang', lang)
    set({ lang, t: getT(lang) })
  },
}))
