import { useState, useEffect } from 'react'
import { C, isAdminRole } from '../../lib/constants'
import { fetchAllProfiles, setUserRole } from '../../lib/db'
import { Card, Label, Spinner } from '../../components/ui'

export default function UsersPage({ profile }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const canEdit = profile.role === 'super_admin'

  useEffect(() => {
    fetchAllProfiles()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const changeRole = async (id, role) => {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)))
    try {
      await setUserRole(id, role)
    } catch (e) {
      alert('Could not update role: ' + e.message)
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
      <Label style={{ fontSize: 20, marginBottom: 18 }}>TEAM &amp; USERS</Label>
      {users.map((u) => (
        <Card key={u.id} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
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
              {u.full_name || '—'}
            </div>
            <div style={{ fontSize: 12, color: C.t3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {u.email}
            </div>
          </div>
          {canEdit && u.role !== 'super_admin' ? (
            <select
              value={u.role}
              onChange={(e) => changeRole(u.id, e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid ' + C.border, borderRadius: 8, fontSize: 13 }}
            >
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
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
        </Card>
      ))}
    </div>
  )
}
