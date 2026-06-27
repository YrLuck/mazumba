import { useEffect, useCallback } from 'react'
import './index.css'
import { useAppStore } from './store/useAppStore'
import { useSettingsStore } from './store/useSettingsStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatsPage from './pages/ChatsPage'
import ChannelsPage from './pages/ChannelsPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import AppearancePage from './pages/settings/AppearancePage'
import NotificationsSettingsPage from './pages/settings/NotificationsSettingsPage'
import PrivacySettingsPage from './pages/settings/PrivacySettingsPage'
import BlockedUsersPage from './pages/settings/BlockedUsersPage'
import BottomNav from './components/BottomNav'
import { getTokens } from './api/client'
import { getMe } from './api/users'
import { socket } from './ws/socket'
import { listNotifications } from './api/notifications'
import type { Page } from './store/useAppStore'
import { MessageCircle, Hash, Bell, User, Sun, Moon } from 'lucide-react'
import { useIsDesktop } from './hooks/useIsDesktop'

const AUTH_PAGES: Page[] = ['login', 'register']
const MAIN_TABS: Page[] = ['chats', 'channels', 'activity', 'profile']

const NAV_ITEMS: { page: Page; icon: React.ReactNode; labelKey: 'chats' | 'channels' | 'activity' | 'profile' }[] = [
  { page: 'chats',    icon: <MessageCircle size={22} />, labelKey: 'chats' },
  { page: 'channels', icon: <Hash size={22} />,          labelKey: 'channels' },
  { page: 'activity', icon: <Bell size={22} />,          labelKey: 'activity' },
  { page: 'profile',  icon: <User size={22} />,          labelKey: 'profile' },
]

function PageRenderer({ page }: { page: Page }) {
  switch (page) {
    case 'login':    return <LoginPage />
    case 'register': return <RegisterPage />
    case 'chats':    return <ChatsPage />
    case 'channels': return <ChannelsPage />
    case 'activity': return <ActivityPage />
    case 'profile':  return <ProfilePage />
    case 'settings-appearance':    return <AppearancePage />
    case 'settings-notifications': return <NotificationsSettingsPage />
    case 'settings-privacy':       return <PrivacySettingsPage />
    case 'settings-blocked':       return <BlockedUsersPage />
  }
}

export default function App() {
  const { page, setPage, setUser, logout, unreadNotifications } = useAppStore()
  const { t, theme, toggleTheme } = useSettingsStore()
  const isDesktop = useIsDesktop()

  const loadUnread = useCallback(async () => {
    try {
      const data = await listNotifications()
      useAppStore.getState().setUnreadNotifications(data.unread_count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const { access } = getTokens()
    if (!access) return
    getMe()
      .then((user) => { setUser(user); socket.connect(); loadUnread() })
      .catch(() => logout())
  }, [setUser, logout, loadUnread])

  useEffect(() => {
    const off = socket.on((ev) => {
      if (ev.type === 'notification.created') {
        const cur = useAppStore.getState().unreadNotifications
        useAppStore.getState().setUnreadNotifications(cur + 1)
      }
    })
    return off
  }, [])

  const isAuthPage = AUTH_PAGES.includes(page)
  const activeTab = MAIN_TABS.includes(page) ? page : 'profile'

  /* ── Auth pages ─────────────────────────────────────────────── */
  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh' as string }}>
        <div key={page} className="page-enter">
          <PageRenderer page={page} />
        </div>
      </div>
    )
  }

  /* ── Mobile layout ──────────────────────────────────────────── */
  if (!isDesktop) {
    return (
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        height: '100vh',
        height: '100dvh' as string,
        background: 'var(--bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        <div key={page} className="page-enter" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PageRenderer page={page} />
        </div>
        <BottomNav />
      </div>
    )
  }

  /* ── Desktop layout ─────────────────────────────────────────── */
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      height: '100dvh' as string,
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Sidebar rail */}
      <nav className="sidebar-nav" style={{ width: 64 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--gradient)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem',
        }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.5px' }}>M</span>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.page
          return (
            <button
              key={item.page}
              className={`sidebar-nav-item${active ? ' active' : ''}`}
              onClick={() => setPage(item.page)}
              title={t[item.labelKey]}
              style={{ position: 'relative' }}
            >
              <span style={{ color: active ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', transition: 'color var(--duration) var(--ease)' }}>
                {item.icon}
              </span>
              {item.page === 'activity' && unreadNotifications > 0 && (
                <span className="nav-badge" style={{ top: 4, right: 4 }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
              {active && (
                <span style={{ position: 'absolute', left: 0, top: '15%', height: '70%', width: 3, borderRadius: '0 3px 3px 0', background: 'var(--primary)' }} />
              )}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        <button className="sidebar-nav-item" onClick={toggleTheme} title={theme === 'dark' ? t.lightMode : t.darkMode}>
          <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </span>
        </button>
      </nav>

      {/* Content area — pages handle their own desktop split layout internally */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div key={page} className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PageRenderer page={page} />
        </div>
      </div>
    </div>
  )
}
