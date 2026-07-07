import { useState, useEffect } from 'react'
import { uid, fmtDate } from '../../lib/constants'
import { fetchDiaryEntries, fetchDiaryEntry, saveDiaryEntry, dayKey } from '../../lib/db'
import { Spinner, Btn, Card } from '../../components/ui'
import Icon from '../../components/icons'

const WEATHER = ['Fine', 'Cloudy', 'Rain', 'Wind', 'Heat']

// Build today's planned job list from the project: every open task in the
// active stage, plus open tasks elsewhere that have a due date of today or earlier.
function plannedFromProject(p) {
  const today = dayKey()
  const jobs = []
  p.stages?.forEach((s, i) => {
    s.tasks?.forEach((t) => {
      if (t.status === 'done') return
      const due = t.dueDate ? dayKey(t.dueDate) : null
      if (i === p.currentStage || (due && due <= today)) {
        jobs.push({ taskId: t.id, stageId: s.id, title: t.title, done: false })
      }
    })
  })
  return jobs
}

const emptyData = (p) => ({
  weather: '',
  trades: '',
  deliveries: '',
  delays: '',
  safety: '',
  summary: '',
  plannedJobs: plannedFromProject(p),
})

export default function DiaryTab({ p, update, profile, user }) {
  const today = dayKey()
  const [entry, setEntry] = useState(null) // today's entry (working copy)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [openPast, setOpenPast] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let live = true
    Promise.all([fetchDiaryEntry(p.id, today), fetchDiaryEntries(p.id)])
      .then(([todayRow, rows]) => {
        if (!live) return
        let data
        if (todayRow) {
          data = todayRow.data || emptyData(p)
          // Merge in any open tasks added since the entry was started
          const known = new Set((data.plannedJobs || []).map((j) => j.taskId))
          plannedFromProject(p).forEach((j) => {
            if (!known.has(j.taskId)) data.plannedJobs.push(j)
          })
        } else {
          data = emptyData(p)
        }
        setEntry({
          id: todayRow?.id || uid(),
          project_id: p.id,
          entry_date: today,
          supervisor_id: user?.id || null,
          supervisor_name: todayRow?.supervisor_name || profile?.full_name || profile?.email || '',
          data,
          _exists: !!todayRow,
        })
        setHistory(rows.filter((r) => r.entry_date !== today))
      })
      .catch((e) => {
        if (!live) return
        setErr(
          /relation .*sc_diary/i.test(e.message || '')
            ? 'The diary table has not been created in Supabase yet — run the setup SQL, then reload.'
            : e.message || 'Could not load the diary'
        )
      })
      .finally(() => live && setLoading(false))
    return () => (live = false)
  }, [p.id])

  const setData = (patch) => {
    setEntry((en) => ({ ...en, data: { ...en.data, ...patch } }))
    setDirty(true)
  }

  // Ticking a planned job also completes the real task on the project.
  const toggleJob = (job) => {
    const nowDone = !job.done
    setData({
      plannedJobs: entry.data.plannedJobs.map((j) => (j.taskId === job.taskId ? { ...j, done: nowDone } : j)),
    })
    const stages = p.stages.map((s) =>
      s.id === job.stageId
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === job.taskId
                ? { ...t, status: nowDone ? 'done' : 'todo', doneAt: nowDone ? new Date().toISOString() : null }
                : t
            ),
          }
        : s
    )
    update({ ...p, stages })
  }

  const persist = async () => {
    setSaving(true)
    setErr('')
    try {
      await saveDiaryEntry(entry)
      setEntry((en) => ({ ...en, _exists: true }))
      setDirty(false)
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spinner />
      </div>
    )

  if (err && !entry)
    return (
      <Card style={{ background: 'var(--red-soft)', borderColor: '#f0cdc5', color: 'var(--red)', fontSize: 13.5 }}>
        {err}
      </Card>
    )

  const jobs = entry.data.plannedJobs || []
  const doneCount = jobs.filter((j) => j.done).length

  return (
    <div>
      {/* Today */}
      <Card style={{ marginBottom: 16, borderLeft: '4px solid var(--gold)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow" style={{ color: 'var(--gold-strong)', marginBottom: 2 }}>Daily site diary</div>
            <div className="h-card" style={{ fontSize: 19 }}>
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <span className={['chip', entry._exists && !dirty ? 'chip-green' : 'chip-gold'].join(' ')}>
            {entry._exists && !dirty ? 'Saved' : dirty ? 'Unsaved changes' : 'Not saved yet'}
          </span>
        </div>

        {/* Planned jobs — first up */}
        <div className="eyebrow" style={{ margin: '14px 0 6px' }}>
          Jobs planned today · {doneCount}/{jobs.length} done
        </div>
        {jobs.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', padding: '4px 0 8px' }}>
            No open tasks in the active stage — add tasks in the Tasks tab and they'll appear here.
          </div>
        ) : (
          <div style={{ marginBottom: 6 }}>
            {jobs.map((j) => (
              <div key={j.taskId} className="task-row">
                <button
                  className={['tick', j.done ? 'done' : ''].join(' ')}
                  onClick={() => toggleJob(j)}
                  aria-label={j.done ? 'Reopen job' : 'Mark job done'}
                >
                  {j.done && <Icon name="check" size={15} stroke={2.6} />}
                </button>
                <span style={{ flex: 1, fontSize: 14.5, color: j.done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: j.done ? 'line-through' : 'none' }}>
                  {j.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Conditions & record */}
        <label className="field-label" style={{ marginTop: 12 }}>Weather</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 13 }}>
          {WEATHER.map((w) => (
            <button
              key={w}
              className={['fchip', entry.data.weather === w ? 'on' : ''].join(' ')}
              onClick={() => setData({ weather: entry.data.weather === w ? '' : w })}
            >
              {w}
            </button>
          ))}
        </div>

        <Field label="Trades / crew on site" ph="e.g. 2x carpenters, plumber AM, electrician PM" val={entry.data.trades} on={(v) => setData({ trades: v })} />
        <Field label="Deliveries" ph="Materials received or expected" val={entry.data.deliveries} on={(v) => setData({ deliveries: v })} />
        <Field label="Delays / issues" ph="Weather hold-ups, missing materials, variations…" val={entry.data.delays} on={(v) => setData({ delays: v })} />
        <Field label="Safety notes" ph="Incidents, inductions, toolbox talks" val={entry.data.safety} on={(v) => setData({ safety: v })} />
        <Field label="Work summary" ph="What happened on site today" val={entry.data.summary} on={(v) => setData({ summary: v })} rows={3} />

        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}

        <Btn onClick={persist} disabled={saving} size="lg" block variant={dirty || !entry._exists ? 'primary' : 'outline'}>
          {saving ? 'Saving…' : entry._exists ? (dirty ? 'Save diary' : 'Saved') : "Save today's diary"}
        </Btn>
      </Card>

      {/* History */}
      <div className="h-card" style={{ marginBottom: 10 }}>Previous entries</div>
      {history.length === 0 ? (
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>No past entries yet — today's will be the first.</div>
      ) : (
        history.map((h) => {
          const open = openPast === h.id
          const d = h.data || {}
          const pj = d.plannedJobs || []
          return (
            <Card key={h.id} style={{ marginBottom: 8, padding: 0 }}>
              <button
                onClick={() => setOpenPast(open ? null : h.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <Icon name="note" size={18} style={{ color: 'var(--ink-3)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 15 }}>{fmtDate(h.entry_date)}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {h.supervisor_name || 'Site diary'}
                    {pj.length > 0 && ' · ' + pj.filter((j) => j.done).length + '/' + pj.length + ' jobs done'}
                    {d.weather && ' · ' + d.weather}
                  </div>
                </div>
                <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} style={{ color: 'var(--ink-3)' }} />
              </button>
              {open && (
                <div style={{ padding: '2px 16px 15px', borderTop: '1px solid var(--line)', fontSize: 13.5 }}>
                  {pj.length > 0 && (
                    <PastBlock label="Jobs">
                      {pj.map((j) => (
                        <div key={j.taskId} style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '2px 0', color: j.done ? 'var(--green)' : 'var(--ink-2)' }}>
                          <Icon name={j.done ? 'check' : 'clock'} size={13} /> {j.title}
                        </div>
                      ))}
                    </PastBlock>
                  )}
                  {d.trades && <PastBlock label="Trades on site">{d.trades}</PastBlock>}
                  {d.deliveries && <PastBlock label="Deliveries">{d.deliveries}</PastBlock>}
                  {d.delays && <PastBlock label="Delays / issues">{d.delays}</PastBlock>}
                  {d.safety && <PastBlock label="Safety">{d.safety}</PastBlock>}
                  {d.summary && <PastBlock label="Summary">{d.summary}</PastBlock>}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

function Field({ label, ph, val, on, rows = 2 }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label className="field-label">{label}</label>
      <textarea className="textarea" style={{ minHeight: rows * 26 + 24 }} placeholder={ph} value={val || ''} onChange={(e) => on(e.target.value)} />
    </div>
  )
}

function PastBlock({ label, children }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="eyebrow" style={{ fontSize: 10.5, marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  )
}
