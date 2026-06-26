import { useEffect, useRef } from 'react'
import './index.css'
import { useAppStore } from './store/useAppStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatsPage from './pages/ChatsPage'
import ChannelsPage from './pages/ChannelsPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import { getTokens } from './api/client'
import { getMe } from './api/users'
import { socket } from './ws/socket'
import type { Page } from './store/useAppStore'

const AUTH_PAGES: Page[] = ['login', 'register']

function PageRenderer({ page }: { page: Page }) {
  switch (page) {
    case 'login':    return <LoginPage />
    case 'register': return <RegisterPage />
    case 'chats':    return <ChatsPage />
    case 'channels': return <ChannelsPage />
    case 'activity': return <ActivityPage />
    case 'profile':  return <ProfilePage />
  }
}

export default function App() {
  const { page, setUser, logout } = useAppStore()
  const prevPageRef = useRef<Page>(page)

  // Restore session on mount
  useEffect(() => {
    const { access } = getTokens()
    if (!access) return
    getMe()
      .then((user) => {
        setUser(user)
        socket.connect()
      })
      .catch(() => logout())
  }, [setUser, logout])

  // Track previous page for transition direction
  useEffect(() => {
    prevPageRef.current = page
  })

  const isAuthPage = AUTH_PAGES.includes(page)

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        minHeight: '100dvh' as string,
        position: 'relative',
        background: isAuthPage ? undefined : 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Page with enter animation — key forces remount on every navigation */}
      <div
        key={page}
        className="page-enter"
        style={{ height: '100%', minHeight: '100vh', minHeight: '100dvh' as string }}
      >
        <PageRenderer page={page} />
      </div>
    </div>
  )
}
