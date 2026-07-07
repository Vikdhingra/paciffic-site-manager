import { useState, useMemo } from 'react'
import { projectPct, isComplete, taskCounts, activeStage } from '../../lib/helpers'
import { deleteProjectById } from '../../lib/api'
import { Meter, Empty, Tag } from '../../components/ui'
import Icon from '../../components/icons'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'complete', label: 'Completed' },
]

export default function Projects({ projects, isAdmin, removeLocal, onOpenProject, onNew }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return projects.filter((p) => {
      if (filter === 'active' && isComplete(p)) return false
      if (filter === 'complete' && !isComplete(p)) return false
      if (!needle) return true
      return [p.name, p.address, p.client].filter(Boolean).some((s) => s.toLowerCase().includes(needle))
    })
  }, [projects, q, filter])

  const remove = async (p) => {
    if (!confirm('Delete "' + p.name + '"? All stages, tasks, diary entries, photos and requests go with it. This cannot be undone.')) return
    try {
      await deleteProjectById(p.id)
      removeLocal(p.id)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="h1" style={{ flex: 1 }}>Projects</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onNew}>
            <Icon name="plus" size={15} /> New project
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button key={f.id} className={['pill', filter === f.id ? 'on' : ''].join(' ')} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty title={projects.length === 0 ? 'No projects yet' : 'Nothing matches'}>
          {projects.length === 0 ? 'Create your first project to get started.' : 'Try a different search or filter.'}
        </Empty>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {shown.map((p) => {
            const pct = projectPct(p)
            const s = activeStage(p)
            const t = taskCounts(p)
            const done = isComplete(p)
            return (
              <div key={p.id} className="row row-tap" onClick={() => onOpenProject(p.id)} style={{ padding: '13px 14px' }}>
                <span className="dot" style={{ background: done ? 'var(--green)' : 'var(--accent)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    {done && <Tag tone="green">Complete</Tag>}
                  </div>
                  <div className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.address || 'No address'}
                    {p.client ? ' · ' + p.client : ''}
                    {!done && s ? ' · ' + s.name : ''}
                    {' · ' + t.done + '/' + t.total + ' tasks'}
                  </div>
                </div>
                <div style={{ width: 140 }} className="hide-m">
                  <Meter pct={pct} done={done} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: done ? 'var(--green)' : 'var(--ink-2)', width: 38, textAlign: 'right' }}>{pct}%</span>
                {isAdmin && (
                  <button
                    className="btn btn-ghost btn-icon"
                    title="Delete project"
                    onClick={(e) => { e.stopPropagation(); remove(p) }}
                    style={{ color: 'var(--ink-3)' }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
