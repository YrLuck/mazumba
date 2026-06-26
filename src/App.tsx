import { useEffect } from 'react'
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

export default function App() {
  const { page, setUser, logout } = useAppStore()

  useEffect(() => {
    const { access } = getTokens()
    if (!access) return
    getMe()
      .then((user) => {
        setUser(user)
        socket.connect()
      })
      .catch(() => {
        logout()
      })
  }, [setUser, logout])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
      {page === 'login' && <LoginPage />}
      {page === 'register' && <RegisterPage />}
      {page === 'chats' && <ChatsPage />}
      {page === 'channels' && <ChannelsPage />}
      {page === 'activity' && <ActivityPage />}
      {page === 'profile' && <ProfilePage />}
    </div>
  )
}
