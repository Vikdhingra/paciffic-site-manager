import { useState, useEffect } from 'react'
import { fetchAllProfiles } from '../lib/api'
import { Spinner } from './ui'
import Icon from './icons'

// Multi-select supervisor list. value = array of user ids.
export default function SupervisorPicker({ value = [], onChange }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllProfiles()
      .then((all) => setUsers(all.filter((u) => u.role === 'supervisor' || u.role === 'admin')))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 14 }}>
        <Spinner size={18} />
      </div>
    )

  if (!users.length)
    return <div className="sub">No supervisors yet — they appear here once they sign up.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {users.map((u) => {
        const on = value.includes(u.id)
        return (
          <button
            key={u.id}
            onClick={() => toggle(u.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 11px',
              borderRadius: 'var(--r)',
              border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line-2)'),
              background: on ? 'var(--accent-soft)' : 'var(--surface)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 13.5,
              color: 'var(--ink)',
              transition: 'all 0.12s',
            }}
          >
            <span
              style={{
                width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--line-2)'),
                background: on ? 'var(--accent)' : '#fff',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {on && <Icon name="check" size={11} stroke={3} />}
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.full_name || u.email}
            </span>
            {u.role === 'admin' && <span className="tag">admin</span>}
          </button>
        )
      })}
    </div>
  )
}
