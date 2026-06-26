import { MessageCircle, Hash, Bell, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Page } from '../store/useAppStore'

const items: { label: string; icon: React.ReactNode; page: Page }[] = [
  { label: 'Chats',    icon: <MessageCircle size={22} />, page: 'chats' },
  { label: 'Channels', icon: <Hash size={22} />,          page: 'channels' },
  { label: 'Activity', icon: <Bell size={22} />,          page: 'activity' },
  { label: 'Profile',  icon: <User size={22} />,          page: 'profile' },
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
            className="nav-item"
            style={{ border: 'none', background: 'transparent' }}
            onClick={() => setPage(item.page)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            {/* Active pill background */}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(132, 36, 123, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  animation: 'fadeIn 0.2s var(--ease) both',
                }}
              />
            )}

            <span
              style={{
                position: 'relative',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'color var(--duration) var(--ease), transform var(--duration) var(--ease-spring)',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                display: 'flex',
              }}
            >
              {item.icon}
            </span>

            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'color var(--duration) var(--ease), font-weight var(--duration) var(--ease)',
                position: 'relative',
              }}
            >
              {item.label}
            </span>

            {/* Active dot */}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: 'fadeUp 0.2s var(--ease) both',
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
