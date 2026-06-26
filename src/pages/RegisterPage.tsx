import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'
import { useAppStore } from '../store/useAppStore'
import { register } from '../api/auth'
import { socket } from '../ws/socket'

export default function RegisterPage() {
  const [email, setEmail]           = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const { setPage, setUser }        = useAppStore()

  const handleRegister = async () => {
    if (!email || !password || !displayName) { setError('Please fill in all required fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(null)
    setLoading(true)
    try {
      const data = await register({ email, password, display_name: displayName, username: username || undefined })
      setUser(data.user)
      socket.connect()
      setPage('chats')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    opts: { icon: React.ReactNode; type?: string; placeholder?: string; optional?: boolean; extra?: React.ReactNode }
  ) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '0.35rem' }}>
        {label} {opts.optional && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>{opts.icon}</span>
        <input
          className="input-field"
          type={opts.type ?? 'text'}
          placeholder={opts.placeholder ?? ''}
          value={value}
          onChange={(e) => set(e.target.value)}
          style={opts.extra ? { paddingRight: '2.75rem' } : {}}
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
        />
        {opts.extra}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh' as string, display: 'flex', flexDirection: 'column' }} className="page-bg">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem 1.5rem' }}>
        <div className="fade-up" style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 'var(--radius-lg)', padding: '0.875rem', marginBottom: '0.75rem', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(132,36,123,0.12)' }}>
          <Logo size={52} />
        </div>
        <h1 className="fade-up" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'white', textShadow: '0 2px 12px rgba(132,36,123,0.25)', animationDelay: '0.05s' }}>MiZumBA</h1>
        <p className="fade-up" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.88rem', marginTop: '0.2rem', animationDelay: '0.1s' }}>Connect. Collaborate. Thrive.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="card fade-up" style={{ borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '2rem 1.5rem', flex: 1, animationDelay: '0.12s' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.3rem' }}>Create account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Join the MiZumBA community</p>

          {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

          {field('Full Name', displayName, setDisplayName, { icon: <User size={16} />, placeholder: 'Your full name' })}
          {field('Username', username, setUsername, { icon: <User size={16} />, placeholder: '@username', optional: true })}
          {field('Email', email, setEmail, { icon: <Mail size={16} />, type: 'email', placeholder: 'you@mizumba.app' })}
          {field('Password', password, setPassword, {
            icon: <Lock size={16} />,
            type: showPw ? 'text' : 'password',
            placeholder: 'Min. 8 characters',
            extra: (
              <button
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ),
          })}

          <div style={{ marginBottom: '1.5rem' }} />

          <button className="btn-primary" onClick={handleRegister} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <button onClick={() => setPage('login')} style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
