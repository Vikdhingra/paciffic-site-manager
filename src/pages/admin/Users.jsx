import { useState, useEffect } from 'react'
import { fetchAllProfiles } from '../../lib/api'
import { isAdminRole, isSuperRole } from '../../lib/helpers'
import { inviteUser, createUserWithPassword, adminSetRole, adminResetPassword, adminDeleteUser } from '../../lib/userAdmin'
import { Spinner, Btn, Card, Tag, Input, Field, Banner, Modal } from '../../components/ui'
import { Avatar } from '../Shell'
import Icon from '../../components/icons'

export default function Users({ profile }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState('')

  const isSuperAdmin = isSuperRole(profile.role)
  const canManage = isAdminRole(profile.role)

  const load = () => {
    setLoading(true)
    fetchAllProfiles().then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  const changeRole = async (u, role) => {
    setBusyId(u.id)
    try {
      await adminSetRole(u.id, role)
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)))
      flash('Role updated for ' + (u.full_name || u.email))
    } catch (e) { alert(e.message) } finally { setBusyId(null) }
  }

  const resetPw = async (u) => {
    setBusyId(u.id)
    try {
      await adminResetPassword(u.email)
      flash('Password reset email sent to ' + u.email)
    } catch (e) { alert(e.message) } finally { setBusyId(null) }
  }

  const removeUser = async (u) => {
    if (!confirm('Delete ' + (u.full_name || u.email) + '? This removes their login and cannot be undone.')) return
    setBusyId(u.id)
    try {
      await adminDeleteUser(u.id)
      setUsers((us) => us.filter((x) => x.id !== u.id))
      flash('User deleted')
    } catch (e) { alert(e.message) } finally { setBusyId(null) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spinner /></div>

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="h1" style={{ flex: 1 }}>Team</h1>
        {canManage && (
          <Btn onClick={() => setAdding(true)}>
            <Icon name="plus" size={15} /> Add user
          </Btn>
        )}
      </div>

      {toast && <Banner tone="green">{toast}</Banner>}

      <div className="card" style={{ overflow: 'hidden' }}>
        {users.map((u) => {
          const me = u.id === profile.id
          const busy = busyId === u.id
          const locked = isSuperRole(u.role)
          return (
            <div key={u.id} className="row" style={{ flexWrap: 'wrap' }}>
              <Avatar name={u.full_name || u.email} size={32} />
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {u.full_name || '—'} {me && <span className="sub">(you)</span>}
                </div>
                <div className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
              </div>

              {canManage && !locked && !me ? (
                <select value={u.role || 'supervisor'} disabled={busy} className="select" style={{ width: 140 }} onChange={(e) => changeRole(u, e.target.value)}>
                  <option value="supervisor">Supervisor</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                </select>
              ) : (
                <Tag tone={isAdminRole(u.role) ? 'accent' : undefined}>{(u.role || 'supervisor').replace('_', ' ')}</Tag>
              )}

              {canManage && !me && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon" title="Send password reset" disabled={busy} onClick={() => resetPw(u)}>
                    <Icon name="key" size={15} />
                  </button>
                  {(!locked || isSuperAdmin) && (
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--ink-3)' }} title="Delete user" disabled={busy || (locked && !isSuperAdmin)} onClick={() => removeUser(u)}>
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {adding && (
        <AddUser
          isSuperAdmin={isSuperAdmin}
          onClose={() => setAdding(false)}
          onDone={(msg) => { setAdding(false); flash(msg); load() }}
        />
      )}
    </div>
  )
}

function AddUser({ isSuperAdmin, onClose, onDone }) {
  const [mode, setMode] = useState('invite') // invite | password
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('supervisor')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const genPw = () => setPassword(Math.random().toString(36).slice(2, 8) + '-' + Math.random().toString(36).slice(2, 8))

  const submit = async () => {
    if (!email.trim()) return setErr('Enter an email')
    setBusy(true); setErr('')
    try {
      if (mode === 'invite') {
        await inviteUser(email.trim(), name.trim(), role)
        onDone('Invite sent to ' + email.trim())
      } else {
        if (!password) return setErr('Enter or generate a password')
        await createUserWithPassword(email.trim(), name.trim(), role, password)
        onDone('User created — share the password with them securely')
      }
    } catch (e) {
      setErr(e.message || 'Failed')
      setBusy(false)
    }
  }

  return (
    <Modal title="Add user" onClose={onClose}>
      <Field label="How?">
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={['pill', mode === 'invite' ? 'on' : ''].join(' ')} onClick={() => setMode('invite')}>Email invite</button>
          <button className={['pill', mode === 'password' ? 'on' : ''].join(' ')} onClick={() => setMode('password')}>Set a password</button>
        </div>
      </Field>
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name" />
      <Field label="Role">
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="supervisor">Supervisor</option>
          {isSuperAdmin && <option value="admin">Admin</option>}
        </select>
      </Field>
      {mode === 'password' && (
        <Field label="Password">
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" />
            <Btn variant="outline" onClick={genPw}>Generate</Btn>
          </div>
        </Field>
      )}
      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn onClick={submit} disabled={busy} size="lg" style={{ flex: 1 }}>
          {busy ? 'Working…' : mode === 'invite' ? 'Send invite' : 'Create user'}
        </Btn>
        <Btn variant="outline" size="lg" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  )
}
