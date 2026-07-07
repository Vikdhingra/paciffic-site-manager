import { useState, useEffect } from 'react'
import { fmtDate, fmtDateShort } from '../../lib/constants'
import { fetchRequests, addRequest, updateRequest } from '../../lib/db'
import { downloadRequestEvent } from '../../lib/calendar'
import { Spinner, Btn, Card, Input } from '../../components/ui'
import Icon from '../../components/icons'

export const REQUEST_TYPES = [
  { id: 'order', label: 'Order materials' },
  { id: 'provide', label: 'Arrange / provide' },
  { id: 'question', label: 'Question' },
  { id: 'other', label: 'Other' },
]

export const typeLabel = (t) => REQUEST_TYPES.find((x) => x.id === t)?.label || 'Request'

export default function RequestsTab({ p, isAdmin, profile, user }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchRequests(p.id)
      .then(setRows)
      .catch((e) =>
        setErr(
          /relation .*sc_requests/i.test(e.message || '')
            ? 'The requests table has not been created in Supabase yet — run the setup SQL, then reload.'
            : e.message || 'Could not load requests'
        )
      )
      .finally(() => setLoading(false))
  }, [p.id])

  const patch = async (id, changes) => {
    try {
      const updated = await updateRequest(id, changes)
      setRows((rs) => rs.map((r) => (r.id === id ? updated : r)))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spinner />
      </div>
    )

  if (err && rows.length === 0 && !adding)
    return (
      <Card style={{ background: 'var(--red-soft)', borderColor: '#f0cdc5', color: 'var(--red)', fontSize: 13.5 }}>
        {err}
      </Card>
    )

  const open = rows.filter((r) => r.status !== 'done')
  const closed = rows.filter((r) => r.status === 'done')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div className="h-card">Admin support</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Ask the office to order, arrange or answer something.</div>
        </div>
        <Btn size="sm" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> New request
        </Btn>
      </div>

      {adding && (
        <NewRequestForm
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
        <Card style={{ color: 'var(--ink-3)', fontSize: 13.5, marginBottom: 16 }}>
          No open requests. Tap "New request" when you need something from the office.
        </Card>
      )}

      {open.map((r) => (
        <RequestCard key={r.id} r={r} projectName={p.name} isAdmin={isAdmin} onPatch={patch} />
      ))}

      {closed.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Completed · {closed.length}</div>
          {closed.map((r) => (
            <RequestCard key={r.id} r={r} projectName={p.name} isAdmin={isAdmin} onPatch={patch} muted />
          ))}
        </>
      )}
    </div>
  )
}

export function RequestCard({ r, projectName, isAdmin, onPatch, muted, showProject }) {
  const isDone = r.status === 'done'
  const inProg = r.status === 'in_progress'
  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 9, opacity: muted ? 0.75 : 1 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 7 }}>
        <span className="chip chip-navy">{typeLabel(r.type)}</span>
        <span className={['chip', r.priority === 'high' ? 'chip-red' : r.priority === 'low' ? 'chip-green' : 'chip-gold'].join(' ')}>
          {r.priority}
        </span>
        {r.needed_by && (
          <span className="chip">
            <Icon name="clock" size={12} /> by {fmtDateShort(r.needed_by)}
          </span>
        )}
        {inProg && <span className="chip chip-blue">In progress</span>}
        {isDone && <span className="chip chip-green">Done</span>}
      </div>

      <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 16.5, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--ink-3)' : 'var(--ink)' }}>
        {r.title}
      </div>
      {r.details && <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 3, whiteSpace: 'pre-wrap' }}>{r.details}</div>}
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
        {showProject && projectName ? projectName + ' · ' : ''}
        {r.created_by_name || 'Site'} · {fmtDate(r.created_at)}
        {isDone && r.done_by_name ? ' · completed by ' + r.done_by_name : ''}
      </div>
      {r.admin_note && (
        <div style={{ marginTop: 8, background: 'var(--blue-soft)', border: '1px solid #c8daed', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: 'var(--blue)' }}>
          Office: {r.admin_note}
        </div>
      )}

      {!isDone && (
        <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button
                className="btn btn-green btn-sm"
                onClick={() => {
                  const note = prompt('Add a note for the site? (optional)') || r.admin_note || ''
                  onPatch(r.id, { status: 'done', done_at: new Date().toISOString(), done_by_name: 'Office', admin_note: note })
                }}
              >
                <Icon name="check" size={14} /> Mark done
              </button>
              {!inProg && (
                <button className="btn btn-outline btn-sm" onClick={() => onPatch(r.id, { status: 'in_progress' })}>
                  Start
                </button>
              )}
            </>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => downloadRequestEvent(r, projectName || '')}>
            <Icon name="plus" size={13} /> Calendar
          </button>
          {!isAdmin && (
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--red)' }} onClick={() => {
              if (confirm('Cancel this request?')) onPatch(r.id, { status: 'done', done_by_name: r.created_by_name || 'Site', admin_note: 'Cancelled by site' })
            }}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NewRequestForm({ onCancel, onCreate }) {
  const [type, setType] = useState('order')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [priority, setPriority] = useState('medium')
  const [neededBy, setNeededBy] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true)
    setErr('')
    try {
      await onCreate({ type, title: title.trim(), details: details.trim(), priority, needed_by: neededBy || null })
    } catch (e) {
      setErr(e.message || 'Could not send the request')
      setBusy(false)
    }
  }

  return (
    <Card style={{ marginBottom: 16, borderLeft: '4px solid var(--gold)' }}>
      <div className="h-card" style={{ marginBottom: 13 }}>New request to the office</div>

      <label className="field-label">What kind of request?</label>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 13 }}>
        {REQUEST_TYPES.map((t) => (
          <button key={t.id} className={['fchip', type === t.id ? 'on' : ''].join(' ')} onClick={() => setType(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <Input label="What do you need?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order 40 sheets of 13mm plasterboard" style={{ marginBottom: 13 }} />

      <label className="field-label">Details (optional)</label>
      <textarea className="textarea" style={{ minHeight: 70, marginBottom: 13 }} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Sizes, supplier, quantities, context…" />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 15 }}>
        <div style={{ flex: '1 1 160px' }}>
          <label className="field-label">Priority</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['high', 'medium', 'low'].map((pr) => (
              <button key={pr} className={['fchip', priority === pr ? 'on' : ''].join(' ')} style={{ flex: 1 }} onClick={() => setPriority(pr)}>
                {pr}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label className="field-label">Needed by (optional)</label>
          <input type="date" className="input" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
        </div>
      </div>

      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 9 }}>
        <Btn onClick={submit} disabled={busy || !title.trim()} style={{ flex: 1 }}>
          {busy ? 'Sending…' : 'Send to office'}
        </Btn>
        <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
      </div>
    </Card>
  )
}
