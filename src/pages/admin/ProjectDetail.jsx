import { useState } from 'react'
import { C, uid, stageColor, fmtDateShort } from '../../lib/constants'
import { Card, Label, Btn, Input } from '../../components/ui'

export default function ProjectDetail({ project, save, onBack }) {
  // Work on a local copy; persist via save()
  const [p, setP] = useState(project)
  const [tab, setTab] = useState('overview')

  const update = (next) => {
    setP(next)
    save(next)
  }

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'tasks', label: 'TASKS' },
    { id: 'notes', label: 'NOTES' },
  ]

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: C.blue, cursor: 'pointer', fontSize: 14, marginBottom: 14 }}
      >
        ← Back to projects
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <Label style={{ fontSize: 24 }}>{p.name}</Label>
      </div>
      <div style={{ fontSize: 13, color: C.t2, marginBottom: 16 }}>
        📍 {p.location || '—'} {p.client && ' · 👤 ' + p.client}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid ' + C.border }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: '3px solid ' + (tab === t.id ? C.amber : 'transparent'),
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              color: tab === t.id ? C.t1 : C.t3,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview p={p} update={update} />}
      {tab === 'tasks' && <Tasks p={p} update={update} />}
      {tab === 'notes' && <Notes p={p} update={update} />}
    </div>
  )
}

// ── OVERVIEW ──────────────────────────────────────────────────
function Overview({ p, update }) {
  const [open, setOpen] = useState(p.currentStage)

  const setStageStatus = (idx) => {
    update({ ...p, currentStage: idx })
  }

  return (
    <div>
      {p.stages.map((s, i) => {
        const col = stageColor(i)
        const done = s.tasks?.filter((t) => t.status === 'done').length || 0
        const total = s.tasks?.length || 0
        const pct = total ? Math.round((done / total) * 100) : 0
        const isActive = i === p.currentStage
        const isExpanded = open === i
        return (
          <Card key={s.id} style={{ marginBottom: 10, padding: 0, borderLeft: '4px solid ' + col }}>
            <button
              onClick={() => setOpen(isExpanded ? -1 : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: col,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: C.t1,
                  }}
                >
                  {s.name}
                  {isActive && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: col }}>● ACTIVE</span>
                  )}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.t3 }}>
                  {done}/{total} tasks · {pct}%
                </div>
              </div>
              <span style={{ color: C.t3 }}>{isExpanded ? '▴' : '▾'}</span>
            </button>
            {total > 0 && (
              <div style={{ margin: '0 16px 8px', background: C.border, borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: col }} />
              </div>
            )}
            {isExpanded && (
              <div style={{ padding: '8px 16px 14px', borderTop: '1px solid ' + C.border }}>
                {(s.tasks || []).length === 0 && (
                  <div style={{ color: C.t3, fontSize: 13, padding: '8px 0' }}>No tasks in this stage</div>
                )}
                {(s.tasks || []).map((t) => (
                  <div
                    key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}
                  >
                    <span
                      style={{
                        color: t.status === 'done' ? C.green : C.t3,
                        fontSize: 16,
                      }}
                    >
                      {t.status === 'done' ? '✓' : '○'}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: t.status === 'done' ? C.t3 : C.t1,
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                ))}
                {!isActive && (
                  <Btn variant="outline" onClick={() => setStageStatus(i)} style={{ marginTop: 8 }}>
                    SET AS ACTIVE STAGE
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

// ── TASKS ─────────────────────────────────────────────────────
function Tasks({ p, update }) {
  const [stageId, setStageId] = useState(p.stages[p.currentStage]?.id || p.stages[0]?.id)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const stage = p.stages.find((s) => s.id === stageId) || p.stages[0]

  const addTask = () => {
    if (!title.trim()) return
    const task = {
      id: uid(),
      title: title.trim(),
      status: 'todo',
      priority,
      createdAt: new Date().toISOString(),
    }
    const stages = p.stages.map((s) => (s.id === stageId ? { ...s, tasks: [...(s.tasks || []), task] } : s))
    update({ ...p, stages })
    setTitle('')
  }

  const toggleTask = (tid) => {
    const stages = p.stages.map((s) =>
      s.id === stageId
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === tid
                ? { ...t, status: t.status === 'done' ? 'todo' : 'done', doneAt: new Date().toISOString() }
                : t
            ),
          }
        : s
    )
    update({ ...p, stages })
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Label style={{ fontSize: 14, marginBottom: 12 }}>ADD TASK</Label>
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + C.border, borderRadius: 8, marginBottom: 10, fontSize: 14 }}
        >
          {p.stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task description" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['high', 'medium', 'low'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriority(pr)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: '1px solid ' + (priority === pr ? C.amber : C.border),
                background: priority === pr ? C.amber + '15' : '#fff',
                cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: priority === pr ? C.amberD : C.t3,
              }}
            >
              {pr.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn onClick={addTask} disabled={!title.trim()}>
          ADD TASK
        </Btn>
      </Card>

      <Label style={{ fontSize: 14, marginBottom: 10 }}>{stage?.name?.toUpperCase()} TASKS</Label>
      {(stage?.tasks || []).length === 0 && (
        <div style={{ color: C.t3, fontSize: 13, padding: 16 }}>No tasks yet</div>
      )}
      {(stage?.tasks || []).map((t) => (
        <Card key={t.id} style={{ marginBottom: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => toggleTask(t.id)}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '2px solid ' + (t.status === 'done' ? C.green : C.border),
              background: t.status === 'done' ? C.green : '#fff',
              color: '#fff',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {t.status === 'done' ? '✓' : ''}
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                color: t.status === 'done' ? C.t3 : C.t1,
                textDecoration: t.status === 'done' ? 'line-through' : 'none',
              }}
            >
              {t.title}
            </div>
          </div>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: t.priority === 'high' ? C.red : t.priority === 'medium' ? C.amber : C.green,
            }}
          >
            {(t.priority || 'medium').toUpperCase()}
          </span>
        </Card>
      ))}
    </div>
  )
}

// ── NOTES ─────────────────────────────────────────────────────
function Notes({ p, update }) {
  const stage = p.stages[p.currentStage] || p.stages[0]
  const [local, setLocal] = useState({
    achievements: stage.achievements || '',
    notes: stage.notes || '',
    nextSteps: stage.nextSteps || '',
  })
  const [saved, setSaved] = useState(true)

  const change = (k) => (e) => {
    setLocal((l) => ({ ...l, [k]: e.target.value }))
    setSaved(false)
  }

  const persist = () => {
    const stages = p.stages.map((s) =>
      s.id === stage.id ? { ...s, ...local, notedAt: new Date().toISOString() } : s
    )
    update({ ...p, stages })
    setSaved(true)
  }

  const fields = [
    { k: 'achievements', label: '✅ ACHIEVED', ph: 'Completed work, milestones…' },
    { k: 'notes', label: '🔨 IN PROGRESS', ph: 'Active construction activities…' },
    { k: 'nextSteps', label: '→ NEXT STEPS', ph: 'Upcoming tasks, deliveries…' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Label style={{ fontSize: 14, flex: 1 }}>SITE NOTES — {stage.name?.toUpperCase()}</Label>
        <Btn onClick={persist} variant={saved ? 'outline' : 'primary'}>
          {saved ? 'SAVED' : 'SAVE NOTES'}
        </Btn>
      </div>
      {fields.map((f) => (
        <div key={f.k} style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: C.t2,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            {f.label}
          </div>
          <textarea
            value={local[f.k]}
            onChange={change(f.k)}
            placeholder={f.ph}
            style={{
              width: '100%',
              minHeight: 90,
              padding: '10px 12px',
              border: '1px solid ' + C.border,
              borderRadius: 8,
              fontFamily: "'Barlow', sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>
      ))}
    </div>
  )
}
