import { useState, useEffect } from 'react'
import { fetchTodayDiaryStatus, fetchOpenRequestCounts } from '../../lib/api'
import { projectPct, isComplete, activeStage, openTasksInActiveStage } from '../../lib/helpers'
import { Meter, Tag, Empty, Banner, Spinner } from '../../components/ui'
import Icon from '../../components/icons'

// Supervisor home: today's diary status, jobs planned, quick actions.
// RLS already limits `projects` to assigned ones for supervisors.
export default function Today({ projects, loaded, error, onOpenProject }) {
  const [diaryDone, setDiaryDone] = useState({})
  const [reqCounts, setReqCounts] = useState({})

  const ids = projects.map((p) => p.id).join(',')
  useEffect(() => {
    if (!projects.length) return
    const pids = projects.map((p) => p.id)
    fetchTodayDiaryStatus(pids).then(setDiaryDone).catch(() => {})
    fetchOpenRequestCounts(pids).then(setReqCounts).catch(() => {})
  }, [ids])

  const active = projects.filter((p) => !isComplete(p))
  const filled = active.filter((p) => diaryDone[p.id]).length
  const dateStr = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div className="sub" style={{ marginBottom: 2 }}>{dateStr}</div>
          <h1 className="h1">Today on site</h1>
        </div>
        {active.length > 0 && (
          <Tag tone={filled === active.length ? 'green' : 'amber'} icon="note">
            {filled}/{active.length} diaries filled
          </Tag>
        )}
      </div>

      {!loaded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }} className="sub">
          <Spinner size={14} /> Syncing…
        </div>
      )}
      {error && <Banner tone="red">{error}</Banner>}

      {loaded && projects.length === 0 ? (
        <Empty icon="hardhat" title="No projects assigned">
          Your admin will assign projects to you — they'll show up here.
        </Empty>
      ) : (
        projects.map((p) => {
          const pct = projectPct(p)
          const done = isComplete(p)
          const s = activeStage(p)
          const jobs = openTasksInActiveStage(p)
          const hasDiary = !!diaryDone[p.id]
          return (
            <div key={p.id} className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
              <button
                onClick={() => onOpenProject(p.id)}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 16px 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em' }}>{p.name}</div>
                    <div className="sub">{p.address || 'No address'}{!done && s ? ' · ' + s.name : done ? ' · Complete' : ''}</div>
                  </div>
                  {!done && (
                    <Tag tone={hasDiary ? 'green' : 'amber'}>{hasDiary ? 'Diary done' : 'Diary due'}</Tag>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Meter pct={pct} done={done} style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: done ? 'var(--green)' : 'var(--ink-2)' }}>{pct}%</span>
                </div>

                {!done && jobs.length > 0 && (
                  <div style={{ paddingBottom: 6 }}>
                    <div className="overline" style={{ fontSize: 10.5, marginBottom: 4 }}>Jobs today · {jobs.length} open</div>
                    {jobs.slice(0, 3).map((t) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 0', fontSize: 13, color: 'var(--ink-2)' }}>
                        <Icon name="clock" size={12} style={{ color: 'var(--amber)' }} /> {t.title}
                      </div>
                    ))}
                    {jobs.length > 3 && <div className="sub" style={{ paddingLeft: 19 }}>+{jobs.length - 3} more</div>}
                  </div>
                )}
              </button>

              <div style={{ borderTop: '1px solid var(--line)', padding: '8px 10px', display: 'flex', gap: 6, marginTop: 6 }}>
                {!done && (
                  <button className={['btn', hasDiary ? 'btn-outline' : 'btn-primary'].join(' ')} onClick={() => onOpenProject(p.id, 'diary')}>
                    <Icon name="note" size={14} /> {hasDiary ? 'Open diary' : 'Fill diary'}
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => onOpenProject(p.id, 'photos')}>
                  <Icon name="plus" size={14} /> Photos
                </button>
                <button className="btn btn-outline" onClick={() => onOpenProject(p.id, 'requests')}>
                  <Icon name="flag" size={14} /> Ask admin{reqCounts[p.id] ? ' (' + reqCounts[p.id] + ')' : ''}
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
