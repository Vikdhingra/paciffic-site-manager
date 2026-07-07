import { useState } from 'react'
import { signIn, signUp, sendPasswordReset } from '../lib/db'
import { Btn, Input } from '../components/ui'
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
        setInfo('Account created. Check your email to confirm, then sign in.')
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

  const titles = { login: 'Sign in', signup: 'Create account', forgot: 'Reset password' }

  return (
    <div className="auth-wrap">
      <div className="card rise" style={{ width: '100%', maxWidth: 400, padding: '30px 28px', boxShadow: 'var(--shadow-pop)' }}>
        <img src={LOGO} alt="Paciffic Homes" style={{ height: 46, marginBottom: 16 }} />
        <div className="eyebrow" style={{ color: 'var(--gold-strong)', marginBottom: 3 }}>Site Manager</div>
        <div className="h-page" style={{ fontSize: 24, marginBottom: 20 }}>{titles[mode]}</div>

        {error && (
          <div style={{ background: 'var(--red-soft)', border: '1px solid #f0cdc5', borderRadius: 9, padding: '10px 13px', color: 'var(--red)', fontSize: 13.5, marginBottom: 14 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: 'var(--green-soft)', border: '1px solid #bfe4cc', borderRadius: 9, padding: '10px 13px', color: 'var(--green)', fontSize: 13.5, marginBottom: 14 }}>
            {info}
          </div>
        )}

        {mode === 'signup' && (
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ marginBottom: 14 }} />
        )}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@paciffichomes.com.au" style={{ marginBottom: 14 }} />
        {mode !== 'forgot' && (
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ marginBottom: 18 }} />
        )}

        <Btn onClick={submit} disabled={busy} size="lg" block style={{ marginBottom: 16 }}>
          {busy ? 'Please wait…' : titles[mode]}
        </Btn>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
          {mode === 'login' ? (
            <>
              <LinkBtn onClick={() => { setMode('signup'); setError(''); setInfo('') }}>Create account</LinkBtn>
              <LinkBtn onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>Forgot password?</LinkBtn>
            </>
          ) : (
            <LinkBtn onClick={() => { setMode('login'); setError(''); setInfo('') }}>← Back to sign in</LinkBtn>
          )}
        </div>
      </div>
    </div>
  )
}

function LinkBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 13.5, padding: 0, fontFamily: 'var(--body)' }}
    >
      {children}
    </button>
  )
}
