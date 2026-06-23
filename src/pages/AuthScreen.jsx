import { useState } from 'react'
import { C } from '../lib/constants'
import { signIn, signUp, sendPasswordReset } from '../lib/db'
import { Btn, Input, Spinner } from '../components/ui'
import { LOGO } from '../logo'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async () => {
    setError('')
    setInfo('')
    if (!email.trim()) return setError('Enter your email')
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Enter your name')
        await signUp(email.trim(), password, name.trim())
        setInfo('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      } else if (mode === 'forgot') {
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.navy,
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <img src={LOGO} alt="Paciffic Homes" style={{ height: 48, marginBottom: 18 }} />
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: C.amber,
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          SITE MANAGER
        </div>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: C.t1,
            marginBottom: 22,
          }}
        >
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </div>

        {mode === 'signup' && (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={{ marginBottom: 12 }}
          />
        )}
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          style={{ marginBottom: 12 }}
        />
        {mode !== 'forgot' && (
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={{ marginBottom: 12 }}
          />
        )}

        {error && (
          <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        {info && (
          <div style={{ color: C.green, fontSize: 13, marginBottom: 12 }}>{info}</div>
        )}

        <Btn
          onClick={submit}
          disabled={busy}
          style={{ width: '100%', padding: '12px', fontSize: 15, marginBottom: 14 }}
        >
          {busy ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Spinner size={16} /> Please wait…
            </span>
          ) : mode === 'login' ? (
            'SIGN IN'
          ) : mode === 'signup' ? (
            'CREATE ACCOUNT'
          ) : (
            'SEND RESET LINK'
          )}
        </Btn>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          {mode === 'login' ? (
            <>
              <button
                onClick={() => setMode('forgot')}
                style={linkStyle}
              >
                Forgot password?
              </button>
              <button onClick={() => setMode('signup')} style={linkStyle}>
                Create account
              </button>
            </>
          ) : (
            <button onClick={() => setMode('login')} style={linkStyle}>
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const linkStyle = {
  background: 'transparent',
  border: 'none',
  color: C.blue,
  cursor: 'pointer',
  fontFamily: "'Barlow', sans-serif",
  fontSize: 13,
  padding: 0,
}
