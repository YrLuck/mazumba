import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'
import { useAppStore } from '../store/useAppStore'
import { register } from '../api/auth'
import { socket } from '../ws/socket'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setPage, setUser } = useAppStore()

  const handleRegister = async () => {
    if (!email || !password || !displayName) { setError('Please fill in all required fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(null)
    setLoading(true)
    try {
      const data = await register({
        email,
        password,
        display_name: displayName,
        username: username || undefined,
      })
      setUser(data.user)
      socket.connect()
      setPage('chats')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="page-bg">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem 1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '1.5rem', padding: '0.875rem', marginBottom: '0.75rem', backdropFilter: 'blur(8px)' }}>
          <Logo size={52} />
        </div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'white', textShadow: '0 1px 8px rgba(132,36,123,0.18)' }}>MiZumBA</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Connect. Collaborate. Thrive.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ borderRadius: '2rem 2rem 0 0', padding: '2rem 1.5rem', flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '0.3rem' }}>Create account</h2>
          <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Join the MiZumBA community</p>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c0392b', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '0.4rem' }}>Full Name *</label>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input className="input-field" placeholder="Your full name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '0.4rem' }}>Username <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input className="input-field" placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '0.4rem' }}>Email *</label>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input className="input-field" type="email" placeholder="you@mizumba.app" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '0.4rem' }}>Password *</label>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              className="input-field"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '2.75rem' }}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#aaa' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button className="btn-primary" onClick={handleRegister} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#999', marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <button onClick={() => setPage('login')} style={{ border: 'none', background: 'none', color: '#84247B', fontWeight: 700, cursor: 'pointer', fontFamily: "'Baloo Da 2', sans-serif" }}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  )
}
