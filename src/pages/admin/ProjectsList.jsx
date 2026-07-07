import { useState, useEffect, useMemo } from 'react'
import { isAdminRole, projectSupervisorIds } from '../../lib/constants'
import { fetchAllProfiles } from '../../lib/db'
import { StageRail, projectPct, projectIsDone, taskCounts, EmptyState } from '../../components/ui'
import Icon from '../../components/icons'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
]

export default function ProjectsList({ projects, profile, remove, onOpenProject, onNewProject }) {
  const [people, setPeople] = useState({})
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAllProfiles()
      .then((all) => {
        const map = {}
        all.forEach((u) => (map[u.id] = u.full_name || u.email))
        setPeople(map)
      })
      .catch(() => {})
  }, [])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return projects.filter((p) => {
      if (filter === 'active' && projectIsDone(p)) return false
      if (filter === 'completed' && !projectIsDone(p)) return false
      if (!needle) return true
      return [p.name, p.location, p.client].filter(Boolean).some((s) => s.toLowerCase().includes(needle))
    })
  }, [projects, q, filter])

  return (
    <div className="rise">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 className="h-page" style={{ flex: 1 }}>Projects</h1>
        <button className="btn btn-primary btn-sm" onClick={onNewProject}>
          <Icon name="plus" size={15} /> New project
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <Icon name="search" size={17} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Search name, address, client"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {FILTERS.map((f) => (
            <button key={f.id} className={['fchip', filter === f.id ? 'on' : ''].join(' ')} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState title={projects.length === 0 ? 'No projects yet' : 'Nothing matches'}>
          {projects.length === 0 ? 'Tap "New project" to create your first build.' : 'Try a different search or filter.'}
        </EmptyState>
      ) : (
        <div className="grid-cards">
          {shown.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              people={people}
              canDelete={isAdminRole(profile.role)}
              onOpen={() => onOpenProject(p)}
              onDelete={() => {
                if (confirm('Delete project "' + p.name + '"? This cannot be undone.')) remove(p.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ p, people, canDelete, onOpen, onDelete }) {
  const pct = projectPct(p)
  const done = projectIsDone(p)
  const t = taskCounts(p)
  const sc = p.stages?.length || 0
  const stageName = p.stages?.[p.currentStage]?.name || ''
  const ids = projectSupervisorIds(p)

  return (
    <div className="card card-tap" onClick={onOpen} style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 18px 14px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 19.5, lineHeight: 1.15 }}>{p.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="pin" size={13} /> {p.location || 'No address'}
            </div>
            {p.client && (
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="person" size={13} /> {p.client}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 24, lineHeight: 1, color: done ? 'var(--green)' : 'var(--navy)' }}>{pct}%</div>
            {done && <span className="chip chip-green" style={{ marginTop: 5 }}>Complete</span>}
          </div>
        </div>

        {/* Stage rail + current stage */}
        <StageRail project={p} style={{ margin: '12px 0 8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow" style={{ fontSize: 10.5, color: 'var(--gold-strong)' }}>
            Stage {Math.min((p.currentStage ?? 0) + 1, sc)}/{sc}
          </span>
          <span style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stageName}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.done}/{t.total} tasks</span>
        </div>

        {ids.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {ids.map((id) => (
              <span key={id} className="chip chip-blue">
                <Icon name="hardhat" size={12} /> {people[id] || 'Supervisor'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--line)', padding: '8px 12px', display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onOpen} style={{ color: 'var(--navy)' }}>
          Open <Icon name="back" size={13} style={{ transform: 'rotate(180deg)' }} />
        </button>
        {canDelete && (
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Icon name="trash" size={14} /> Delete
          </button>
        )}
      </div>
    </div>
  )
}
