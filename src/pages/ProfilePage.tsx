import { useState, useEffect } from 'react'
import { ChevronRight, Bell, Shield, Moon, Camera, Pencil, LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useAppStore } from '../store/useAppStore'
import { getMyProfile } from '../api/users'
import { logout as apiLogout } from '../api/auth'
import { socket } from '../ws/socket'
import type { ProfileStats } from '../types/api'

const SETTINGS = [
  { icon: <Bell size={18} color="white" />, iconBg: '#4fc3f7', label: 'Notifications', desc: 'Manage alerts and sounds' },
  { icon: <Shield size={18} color="white" />, iconBg: '#84247B', label: 'Privacy & Security', desc: 'Blocked users, two-factor auth' },
  { icon: <Moon size={18} color="white" />, iconBg: '#7c4dff', label: 'Appearance', desc: 'Dark mode, font size, themes' },
]

export default function ProfilePage() {
  const { user, setUser, logout } = useAppStore()
  const [stats, setStats] = useState<ProfileStats>({ messages_count: 0, groups_count: 0, channels_count: 0 })

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setUser(data.user)
        setStats(data.stats)
      })
      .catch(() => {})
  }, [setUser])

  const handleLogout = async () => {
    await apiLogout()
    socket.disconnect()
    logout()
  }

  const avatarLetters = user?.display_name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f6fc' }}>
        <div style={{ background: 'white', padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>Profile</h1>
          <button style={{ border: '1.5px solid #e5e0f0', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', cursor: 'pointer', color: '#84247B' }}>
            <Pencil size={16} />
          </button>
        </div>

        <div style={{ background: 'white', paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative', marginTop: '1rem' }}>
            <div className="avatar-ring">
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #8EEBF2 0%, #84247B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.5rem', overflow: 'hidden' }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : avatarLetters}
              </div>
            </div>
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'white', border: '2px solid #f0eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#84247B' }}>
              <Camera size={13} />
            </button>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a1a2e' }}>{user?.display_name ?? '…'}</div>
          <div style={{ fontSize: '0.8rem', color: '#84247B', fontWeight: 600 }}>
            {user?.username ? `@${user.username}` : ''}{user?.username && ' · '}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{user?.email ?? ''}</div>
          {user?.bio && (
            <div style={{ fontSize: '0.85rem', color: '#555', textAlign: 'center', padding: '0 1.5rem', lineHeight: 1.5, marginTop: '0.25rem' }}>{user.bio}</div>
          )}
        </div>

        <div style={{ margin: '1rem', background: 'white', borderRadius: '1rem', padding: '1rem', display: 'flex', boxShadow: '0 2px 12px rgba(132,36,123,0.06)' }}>
          {([
            [stats.messages_count.toLocaleString(), 'Messages'],
            [stats.groups_count.toString(), 'Groups'],
            [stats.channels_count.toString(), 'Channels'],
          ] as [string, string][]).map(([val, lbl]) => (
            <div key={lbl} style={{ flex: 1, textAlign: 'center', borderRight: lbl !== 'Channels' ? '1px solid #f0eef8' : 'none' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#84247B' }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 500 }}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ margin: '0 1rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#aaa', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Settings</div>
          <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 12px rgba(132,36,123,0.06)' }}>
            {SETTINGS.map((s, i) => (
              <button key={s.label} style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', border: 'none', background: 'white', cursor: 'pointer', borderBottom: i < SETTINGS.length - 1 ? '1px solid #f8f6fc' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{s.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{s.desc}</div>
                </div>
                <ChevronRight size={16} color="#ccc" />
              </button>
            ))}
          </div>
        </div>

        <div style={{ margin: '0 1rem 1.5rem' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', border: 'none', background: 'white', cursor: 'pointer', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(132,36,123,0.06)', color: '#e53935', fontWeight: 700, fontFamily: "'Baloo Da 2', sans-serif", fontSize: '0.9rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={16} color="#e53935" /></div>
            Log Out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
