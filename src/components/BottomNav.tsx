import { MessageCircle, Hash, Bell, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Page } from '../store/useAppStore'

const items: { label: string; icon: React.ReactNode; page: Page; badge?: number }[] = [
  { label: 'Chats', icon: <MessageCircle size={22} />, page: 'chats', badge: 25 },
  { label: 'Channels', icon: <Hash size={22} />, page: 'channels' },
  { label: 'Activity', icon: <Bell size={22} />, page: 'activity', badge: 3 },
  { label: 'Profile', icon: <User size={22} />, page: 'profile' },
]

export default function BottomNav() {
  const { page, setPage } = useAppStore()

  return (
    <nav className="nav-bar">
      {items.map((item) => {
        const active = page === item.page
        return (
          <button
            key={item.page}
            className="nav-item border-none bg-transparent"
            onClick={() => setPage(item.page)}
          >
            <span className="relative inline-flex" style={{ color: active ? '#84247B' : '#bbb' }}>
              {item.icon}
              {item.badge ? (
                <span className="nav-badge">{item.badge}</span>
              ) : null}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: active ? 700 : 500,
                color: active ? '#84247B' : '#bbb',
              }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
