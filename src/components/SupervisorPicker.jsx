import { useState, useEffect } from 'react'
import { C, projectSupervisorIds } from '../lib/constants'
import { fetchAllProfiles } from '../lib/db'
import { Spinner } from './ui'

// Multi-select supervisor assignment.
// Props:
//   project   – the project being edited
//   onChange  – (newSupervisorIdsArray) => void  (called on every toggle)
//   compact   – smaller styling for inline use
export default function SupervisorPicker({ project, onChange, compact }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllProfiles()
      .then((all) => setUsers(all.filter((u) => u.role === 'supervisor' || u.role === 'admin')))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const assigned = projectSupervisorIds(project)

  const toggle = (id) => {
    const next = assigned.includes(id)
      ? assigned.filter((x) => x !== id)
      : [...assigned, id]
    onChange(next)
  }

  if (loading)
    return (
      <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
        <Spinner size={20} />
      </div>
    )

  if (users.length === 0)
    return (
      <div style={{ fontSize: 13, color: C.t3, padding: '8px 0' }}>
        No supervisors registered yet. They appear here once they sign up.
      </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {users.map((u) => {
        const on = assigned.includes(u.id)
        return (
          <button
            key={u.id}
            onClick={() => toggle(u.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: compact ? '7px 10px' : '9px 12px',
              borderRadius: 8,
              border: '1px solid ' + (on ? C.green : C.border),
              background: on ? '#F0FDF4' : '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: '2px solid ' + (on ? C.green : C.t3),
                background: on ? C.green : '#fff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {on ? '✓' : ''}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: C.t1,
                }}
              >
                {u.full_name || u.email}
              </div>
              <div style={{ fontSize: 11, color: C.t3 }}>
                {u.email}
                {u.role === 'admin' && ' · admin'}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
