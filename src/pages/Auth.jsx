import { useState } from 'react'
import { signIn, signUp, sendPasswordReset } from '../lib/api'
import { Btn, Input, Card, Banner } from '../components/ui'

const TITLES = { login: 'Sign in', signup: 'Create account', forgot: 'Reset password' }

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const go = (m) => { setMode(m); setError(''); setInfo('') }

  const submit = async () => {
    setError(''); setInfo('')
    if (!email.trim()) return setError('Enter your email')
    setBusy(true)
    try {
      if (mode === 'login') await signIn(email.trim(), password)
      else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Enter your name')
        await signUp(email.trim(), password, name.trim())
        setInfo('Account created. Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        await sendPasswordReset(email.trim())
        setInfo('Password reset link sent — check your email.')
        setMode('login')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div style={{ width: '100%', maxWidth: 380 }} className="fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <img src="/logo.png" alt="" style={{ height: 34 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Paciffic Supervisors</div>
            <div className="sub">Paciffic Homes</div>
          </div>
        </div>
        <Card pad={22}>
          <div className="h1" style={{ marginBottom: 16 }}>{TITLES[mode]}</div>
          {error && <Banner tone="red">{error}</Banner>}
          {info && <Banner tone="green">{info}</Banner>}
          {mode === 'signup' && (
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          )}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@paciffichomes.com.au" />
          {mode !== 'forgot' && (
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          )}
          <Btn onClick={submit} disabled={busy} size="lg" block style={{ marginTop: 6, marginBottom: 14 }}>
            {busy ? 'Please wait…' : TITLES[mode]}
          </Btn>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            {mode === 'login' ? (
              <>
                <LinkBtn onClick={() => go('signup')}>Create account</LinkBtn>
                <LinkBtn onClick={() => go('forgot')}>Forgot password?</LinkBtn>
              </>
            ) : (
              <LinkBtn onClick={() => go('login')}>← Back to sign in</LinkBtn>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function LinkBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none', color: 'var(--accent-strong)', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500 }}>
      {children}
    </button>
  )
}
