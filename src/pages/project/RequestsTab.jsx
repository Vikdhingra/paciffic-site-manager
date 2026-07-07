import { useState, useEffect } from 'react'
import { fetchRequests, addRequest, updateRequest } from '../../lib/api'
import { fmtDate, fmtShort, REQUEST_TYPES, typeLabel } from '../../lib/helpers'
import { downloadRequestEvent } from '../../lib/calendar'
import { Spinner, Btn, Card, Tag, PriorityTag, Input, Field, Banner } from '../../components/ui'
import Icon from '../../components/icons'

export default function RequestsTab({ p, isAdmin, profile, user }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchRequests(p.id)
      .then(setRows)
      .catch((e) => setErr(e.message || 'Could not load requests'))
      .finally(() => setLoading(false))
  }, [p.id])

  const patch = async (id, changes) => {
    try {
      const updated = await updateRequest(id, changes)
      setRows((rs) => rs.map((r) => (r.id === id ? updated : r)))
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 44 }}><Spinner /></div>

  const open = rows.filter((r) => r.status !== 'done')
  const closed = rows.filter((r) => r.status === 'done')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="h2">Admin support</div>
          <div className="sub">Ask the office to order, arrange or answer something.</div>
        </div>
        <Btn onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> New request
        </Btn>
      </div>

      {err && <Banner tone="red">{err}</Banner>}

      {adding && (
        <NewRequest
          onCancel={() => setAdding(false)}
          onCreate={async (draft) => {
            const row = await addRequest({
              ...draft,
              project_id: p.id,
              created_by: user?.id,
              created_by_name: profile?.full_name || profile?.email || '',
            })
            setRows((rs) => [row, ...rs])
            setAdding(false)
          }}
        />
      )}

      {open.length === 0 && !adding && (
        <Card pad={14} style={{ marginBottom: 14 }}>
          <span className="sub">No open requests. Tap "New request" when you need something from the office.</span>
        </Card>
      )}

      {open.map((r) => <Req key={r.id} r={r} p={p} isAdmin={isAdmin} patch={patch} />)}

      {closed.length > 0 && (
        <>
          <div className="overline" style={{ margin: '16px 0 8px' }}>Completed · {closed.length}</div>
          {closed.map((r) => <Req key={r.id} r={r} p={p} isAdmin={isAdmin} patch={patch} muted />)}
        </>
      )}
    </div>
  )
}

function Req({ r, p, isAdmin, patch, muted }) {
  const done = r.status === 'done'
  return (
    <Card pad={14} style={{ marginBottom: 8, opacity: muted ? 0.7 : 1 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <Tag tone="accent">{typeLabel(r.type)}</Tag>
        <PriorityTag p={r.priority} />
        {r.needed_by && <Tag icon="clock">by {fmtShort(r.needed_by)}</Tag>}
        {r.status === 'in_progress' && <Tag tone="amber">In progress</Tag>}
        {done && <Tag tone="green">Done</Tag>}
      </div>
      <div style={{ fontWeight: 500, fontSize: 14.5, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--ink-3)' : 'var(--ink)' }}>
        {r.title}
      </div>
      {r.details && <div className="sub" style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{r.details}</div>}
      <div className="sub" style={{ marginTop: 5, fontSize: 11.5 }}>
        {r.created_by_name || 'Site'} · {fmtDate(r.created_at)}
        {done && r.done_by_name ? ' · completed by ' + r.done_by_name : ''}
      </div>
      {r.admin_note && (
        <div style={{ marginTop: 7, background: 'var(--accent-soft)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, color: 'var(--accent-strong)' }}>
          Office: {r.admin_note}
        </div>
      )}
      {!done && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button className="btn btn-green" onClick={() => {
                const note = prompt('Note back to site? (optional)') || r.admin_note || ''
                patch(r.id, { status: 'done', done_at: new Date().toISOString(), done_by_name: 'Office', admin_note: note, site_ack: false })
              }}>
                <Icon name="check" size={14} /> Done
              </button>
              {r.status !== 'in_progress' && (
                <button className="btn btn-outline" onClick={() => patch(r.id, { status: 'in_progress' })}>Start</button>
              )}
            </>
          )}
          <button className="btn btn-outline" onClick={() => downloadRequestEvent(r, p.name)}>
            <Icon name="plus" size={13} /> Calendar
          </button>
          {!isAdmin && (
            <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={() => {
              if (confirm('Cancel this request?')) patch(r.id, { status: 'done', done_by_name: r.created_by_name || 'Site', admin_note: 'Cancelled by site', site_ack: true })
            }}>
              Cancel
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

function NewRequest({ onCancel, onCreate }) {
  const [type, setType] = useState('order')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [priority, setPriority] = useState('medium')
  const [neededBy, setNeededBy] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true); setErr('')
    try {
      await onCreate({ type, title: title.trim(), details: details.trim(), priority, needed_by: neededBy || null })
    } catch (e) {
      setErr(e.message || 'Could not send the request')
      setBusy(false)
    }
  }

  return (
    <Card pad={16} style={{ marginBottom: 14 }}>
      <div className="h2" style={{ marginBottom: 12 }}>New request to the office</div>
      <Field label="Type">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {REQUEST_TYPES.map((t) => (
            <button key={t.id} className={['pill', type === t.id ? 'on' : ''].join(' ')} onClick={() => setType(t.id)}>{t.label}</button>
          ))}
        </div>
      </Field>
      <Input label="What do you need?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order 40 sheets of 13mm plasterboard" />
      <Field label="Details (optional)">
        <textarea className="textarea" style={{ minHeight: 60 }} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Sizes, supplier, quantities…" />
      </Field>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Field label="Priority" style={{ flex: '1 1 160px' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['high', 'medium', 'low'].map((pr) => (
              <button key={pr} className={['pill', priority === pr ? 'on' : ''].join(' ')} style={{ flex: 1 }} onClick={() => setPriority(pr)}>{pr}</button>
            ))}
          </div>
        </Field>
        <Field label="Needed by (optional)" style={{ flex: '1 1 150px' }}>
          <input type="date" className="input" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
        </Field>
      </div>
      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={submit} disabled={busy || !title.trim()} style={{ flex: 1 }}>
          {busy ? 'Sending…' : 'Send to office'}
        </Btn>
        <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
      </div>
    </Card>
  )
}
