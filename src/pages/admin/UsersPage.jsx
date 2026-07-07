import { useState, useEffect } from 'react'
import { C, isAdminRole, uid } from '../../lib/constants'
import { fetchAllProfiles } from '../../lib/db'
import {
  inviteUser,
  createUserWithPassword,
  adminSetRole,
  adminResetPassword,
  adminDeleteUser,
} from '../../lib/userAdmin'
import { Card, Label, Spinner, Btn, Input } from '../../components/ui'

export default function UsersPage({ profile }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState('')

  const isSuperAdmin = profile.role === 'super_admin'
  const canManage = isAdminRole(profile.role)

  const load = () => {
    setLoading(true)
    fetchAllProfiles()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const changeRole = async (u, role) => {
    setBusyId(u.id)
    try {
      await adminSetRole(u.id, role)
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)))
      flash('Role updated for ' + (u.full_name || u.email))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const resetPw = async (u) => {
    setBusyId(u.id)
    try {
      await adminResetPassword(u.email)
      flash('Password reset email sent to ' + u.email)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const removeUser = async (u) => {
    if (!confirm('Delete ' + (u.full_name || u.email) + '? This removes their login and cannot be undone.'))
      return
    setBusyId(u.id)
    try {
      await adminDeleteUser(u.id)
      setUsers((us) => us.filter((x) => x.id !== u.id))
      flash('User deleted')
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner />
      </div>
    )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <h1 className="h-page" style={{ flex: 1 }}>Team &amp; users</h1>
        {canManage && <Btn size="sm" onClick={() => setAdding(true)}>+ Add user</Btn>}
      </div>

      {toast && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid ' + C.green + '40',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 13,
            color: C.green,
          }}
        >
          {'\u2713 '}{toast}
        </div>
      )}

      {adding && (
        <AddUserForm
          isSuperAdmin={isSuperAdmin}
          onClose={() => setAdding(false)}
          onDone={(msg) => {
            setAdding(false)
            flash(msg)
            load()
          }}
        />
      )}

      {users.map((u) => {
        const me = u.id === profile.id
        const busy = busyId === u.id
        const locked = u.role === 'super_admin'
        return (
          <Card key={u.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: isAdminRole(u.role) ? C.amber : C.blue,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: C.t1 }}>
                  {u.full_name || '\u2014'} {me && <span style={{ fontSize: 11, color: C.t3 }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: C.t3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.email}
                </div>
              </div>

              {canManage && !locked && !me ? (
                <select
                  value={u.role}
                  disabled={busy}
                  onChange={(e) => changeRole(u, e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid ' + C.border, borderRadius: 8, fontSize: 13 }}
                >
                  <option value="supervisor">Supervisor</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                </select>
              ) : (
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: isAdminRole(u.role) ? C.amber : C.blue,
                    background: (isAdminRole(u.role) ? C.amber : C.blue) + '15',
                    borderRadius: 6,
                    padding: '4px 10px',
                  }}
                >
                  {(u.role || 'supervisor').replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            {canManage && !me && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, borderTop: '1px solid ' + C.border, paddingTop: 10 }}>
                <Btn variant="ghost" onClick={() => resetPw(u)} disabled={busy} style={{ color: C.blue, fontSize: 12 }}>
                  {busy ? '\u2026' : '\u2709 RESET PASSWORD'}
                </Btn>
                {!locked && (
                  <Btn
                    variant="ghost"
                    onClick={() => removeUser(u)}
                    disabled={busy}
                    style={{ color: C.red, marginLeft: 'auto', fontSize: 12 }}
                  >
                    DELETE
                  </Btn>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function AddUserForm({ isSuperAdmin, onClose, onDone }) {
  const [method, setMethod] = useState('invite')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('supervisor')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const genPassword = () => setPassword(uid() + uid().slice(0, 3).toUpperCase())

  const submit = async () => {
    setError('')
    if (!email.trim()) return setError('Email required')
    setBusy(true)
    try {
      if (method === 'invite') {
        await inviteUser(email.trim(), name.trim(), role)
        onDone('Invite sent to ' + email)
      } else {
        if (!password) {
          setBusy(false)
          return setError('Set or generate a password')
        }
        await createUserWithPassword(email.trim(), name.trim(), role, password)
        onDone('User created \u2014 password: ' + password)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card style={{ marginBottom: 18, border: '2px solid ' + C.amber }}>
      <Label style={{ fontSize: 16, marginBottom: 12 }}>ADD NEW USER</Label>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { id: 'invite', label: '\u2709 EMAIL INVITE' },
          { id: 'password', label: '\u{1F511} SET PASSWORD' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: '1px solid ' + (method === m.id ? C.amber : C.border),
              background: method === m.id ? C.amber + '15' : '#fff',
              cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: method === m.id ? C.amberD : C.t3,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ marginBottom: 10 }} />
      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" style={{ marginBottom: 10 }} />

      <div style={{ marginBottom: 10 }}>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + C.border, borderRadius: 8, fontSize: 14 }}
        >
          <option value="supervisor">Supervisor</option>
          {isSuperAdmin && <option value="admin">Admin</option>}
        </select>
      </div>

      {method === 'password' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" style={{ flex: 1 }} />
          <Btn variant="outline" onClick={genPassword}>
            GENERATE
          </Btn>
        </div>
      )}

      <div style={{ fontSize: 12, color: C.t2, marginBottom: 12 }}>
        {method === 'invite'
          ? "They'll receive an email with a link to set their own password."
          : 'The account is created instantly. Share the password with them securely.'}
      </div>

      {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={submit} disabled={busy}>
          {busy ? 'WORKING\u2026' : method === 'invite' ? 'SEND INVITE' : 'CREATE USER'}
        </Btn>
        <Btn variant="outline" onClick={onClose}>
          CANCEL
        </Btn>
      </div>
    </Card>
  )
}
