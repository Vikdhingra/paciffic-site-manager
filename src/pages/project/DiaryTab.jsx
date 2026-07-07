import { useState, useEffect } from 'react'
import { fetchDiaryEntry, fetchDiaryEntries, saveDiaryEntry, setTaskDone } from '../../lib/api'
import { dayKey, fmtDate, activeStage } from '../../lib/helpers'
import { Spinner, Btn, Card, Tag, Tick, Banner, Field, MicBtn } from '../../components/ui'
import Icon from '../../components/icons'

const WEATHER = ['Fine', 'Cloudy', 'Rain', 'Wind', 'Heat']

const uid = () => Math.random().toString(36).slice(2, 9)

// Open tasks the supervisor CAN pull into today's plan (never auto-added)
function suggestedTasks(p) {
  const today = dayKey()
  const out = []
  const cur = activeStage(p)
  p.stages?.forEach((s) => {
    s.tasks?.forEach((t) => {
      if (t.status === 'done') return
      const due = t.due_date ? dayKey(t.due_date) : null
      if (s.id === cur?.id || (due && due <= today)) out.push(t)
    })
  })
  return out
}

export default function DiaryTab({ p, refresh, profile, user }) {
  const today = dayKey()
  const [entry, setEntry] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [openPast, setOpenPast] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let live = true
    Promise.all([fetchDiaryEntry(p.id, today), fetchDiaryEntries(p.id)])
      .then(([row, rows]) => {
        if (!live) return
        const jobs = row?.jobs || []
        setEntry({
          id: row?.id,
          project_id: p.id,
          entry_date: today,
          supervisor_id: user?.id || null,
          supervisor_name: row?.supervisor_name || profile?.full_name || profile?.email || '',
          weather: row?.weather || '',
          trades: row?.trades || '',
          deliveries: row?.deliveries || '',
          delays: row?.delays || '',
          safety: row?.safety || '',
          summary: row?.summary || '',
          jobs,
          _exists: !!row,
        })
        setHistory(rows.filter((r) => r.entry_date !== today))
      })
      .catch((e) => { if (live) setErr(e.message || 'Could not load the diary') })
      .finally(() => live && setLoading(false))
    return () => (live = false)
  }, [p.id])

  const set = (patch) => { setEntry((en) => ({ ...en, ...patch })); setDirty(true) }

  const jobKey = (j) => j.taskId || j.id
  const toggleJob = async (job) => {
    const nowDone = !job.done
    set({ jobs: entry.jobs.map((j) => (jobKey(j) === jobKey(job) ? { ...j, done: nowDone } : j)) })
    if (job.taskId) {
      await setTaskDone(job.taskId, nowDone).catch(() => {})
      refresh(p.id)
    }
  }
  const removeJob = (job) => set({ jobs: entry.jobs.filter((j) => jobKey(j) !== jobKey(job)) })
  const addCustomJob = (title) => set({ jobs: [...entry.jobs, { id: uid(), taskId: null, title, done: false }] })
  const addTaskJob = (t) => set({ jobs: [...entry.jobs, { taskId: t.id, title: t.title, done: false }] })

  const persist = async () => {
    setSaving(true); setErr('')
    try {
      const saved = await saveDiaryEntry(entry)
      setEntry((en) => ({ ...en, id: saved.id, _exists: true }))
      setDirty(false)
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 44 }}><Spinner /></div>
  if (err && !entry) return <Banner tone="red">{err}</Banner>

  const doneCount = entry.jobs.filter((j) => j.done).length

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div className="overline" style={{ marginBottom: 2 }}>Daily site diary</div>
            <div className="h2" style={{ fontSize: 16 }}>
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <Tag tone={entry._exists && !dirty ? 'green' : 'amber'}>
            {entry._exists && !dirty ? 'Saved' : dirty ? 'Unsaved changes' : 'Not saved yet'}
          </Tag>
        </div>

        <div className="label" style={{ marginBottom: 6 }}>
          Jobs planned today{entry.jobs.length > 0 ? ' · ' + doneCount + '/' + entry.jobs.length + ' done' : ''}
        </div>
        {entry.jobs.length === 0 && (
          <div className="sub" style={{ marginBottom: 8 }}>Write today's plan below, or pull in open tasks.</div>
        )}
        {entry.jobs.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {entry.jobs.map((j, i) => (
              <div key={jobKey(j) || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <Tick done={j.done} onClick={() => toggleJob(j)} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: j.done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: j.done ? 'line-through' : 'none' }}>
                  {j.title}{!j.taskId && <span className="sub" style={{ fontSize: 11 }}> · site note</span>}
                </span>
                <button className="btn btn-ghost btn-icon" title="Remove from today" onClick={() => removeJob(j)} style={{ color: 'var(--ink-3)' }}>
                  <Icon name="close" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <AddJob onAdd={addCustomJob} />
        <SuggestTasks p={p} jobs={entry.jobs} onPick={addTaskJob} />

        <Field label="Weather">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {WEATHER.map((w) => (
              <button key={w} className={['pill', entry.weather === w ? 'on' : ''].join(' ')} onClick={() => set({ weather: entry.weather === w ? '' : w })}>
                {w}
              </button>
            ))}
          </div>
        </Field>

        <Area label="Trades / crew on site" ph="e.g. 2x carpenters, plumber AM" val={entry.trades} on={(v) => set({ trades: v })} />
        <Area label="Deliveries" ph="Materials received or expected" val={entry.deliveries} on={(v) => set({ deliveries: v })} />
        <Area label="Delays / issues" ph="Weather hold-ups, missing materials…" val={entry.delays} on={(v) => set({ delays: v })} />
        <Area label="Safety notes" ph="Incidents, inductions, toolbox talks" val={entry.safety} on={(v) => set({ safety: v })} />
        <Area label="Work summary" ph="What happened on site today" val={entry.summary} on={(v) => set({ summary: v })} tall />

        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}

        <Btn onClick={persist} disabled={saving} size="lg" block variant={dirty || !entry._exists ? 'primary' : 'outline'}>
          {saving ? 'Saving…' : entry._exists ? (dirty ? 'Save diary' : 'Saved') : "Save today's diary"}
        </Btn>
      </Card>

      <div className="h2" style={{ marginBottom: 8 }}>Previous entries</div>
      {history.length === 0 ? (
        <div className="sub">No past entries yet — today's will be the first.</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {history.map((h) => {
            const open = openPast === h.id
            const pj = h.jobs || []
            return (
              <div key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <button
                  onClick={() => setOpenPast(open ? null : h.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Icon name="note" size={16} style={{ color: 'var(--ink-3)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{fmtDate(h.entry_date)}</div>
                    <div className="sub">
                      {h.supervisor_name || 'Site diary'}
                      {pj.length > 0 && ' · ' + pj.filter((j) => j.done).length + '/' + pj.length + ' jobs'}
                      {h.weather && ' · ' + h.weather}
                    </div>
                  </div>
                  <Icon name={open ? 'chevronUp' : 'chevronDown'} size={15} style={{ color: 'var(--ink-3)' }} />
                </button>
                {open && (
                  <div style={{ padding: '0 14px 13px 40px', fontSize: 13 }}>
                    {pj.length > 0 && (
                      <Block label="Jobs">
                        {pj.map((j, i) => (
                          <div key={j.taskId || j.id || i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0', color: j.done ? 'var(--green)' : 'var(--ink-2)' }}>
                            <Icon name={j.done ? 'check' : 'clock'} size={12} /> {j.title}
                          </div>
                        ))}
                      </Block>
                    )}
                    {h.trades && <Block label="Trades">{h.trades}</Block>}
                    {h.deliveries && <Block label="Deliveries">{h.deliveries}</Block>}
                    {h.delays && <Block label="Delays / issues">{h.delays}</Block>}
                    {h.safety && <Block label="Safety">{h.safety}</Block>}
                    {h.summary && <Block label="Summary">{h.summary}</Block>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Area({ label, ph, val, on, tall }) {
  const append = (text) => on(((val || '').trim() ? (val.trim() + (/[.!?]$/.test(val.trim()) ? ' ' : '. ')) : '') + text)
  return (
    <Field label={label}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <textarea className="textarea" style={{ minHeight: tall ? 84 : 56, flex: 1 }} placeholder={ph} value={val || ''} onChange={(e) => on(e.target.value)} />
        <MicBtn onText={append} title={'Dictate ' + label.toLowerCase()} />
      </div>
    </Field>
  )
}

function Block({ label, children }) {
  return (
    <div style={{ marginTop: 9 }}>
      <div className="overline" style={{ fontSize: 10.5, marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  )
}


function AddJob({ onAdd }) {
  const [title, setTitle] = useState('')
  const submit = () => {
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
      <input
        className="input"
        placeholder="Add a job — type or dictate"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <MicBtn onText={(text) => onAdd(text)} title="Dictate jobs — each phrase becomes a job" />
      <Btn variant="outline" onClick={submit} disabled={!title.trim()}>Add</Btn>
    </div>
  )
}

function SuggestTasks({ p, jobs, onPick }) {
  const inPlan = new Set(jobs.map((j) => j.taskId).filter(Boolean))
  const options = suggestedTasks(p).filter((t) => !inPlan.has(t.id))
  if (!options.length) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="sub" style={{ fontSize: 11.5, marginBottom: 5 }}>Pull in from open tasks:</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.slice(0, 10).map((t) => (
          <button key={t.id} className="pill" onClick={() => onPick(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="plus" size={11} /> {t.title}
          </button>
        ))}
      </div>
    </div>
  )
}
