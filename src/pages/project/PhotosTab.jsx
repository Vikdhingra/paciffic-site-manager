import { useState, useEffect, useRef } from 'react'
import { fetchPhotos, addPhoto, deletePhoto } from '../../lib/db'
import { compressImage } from '../../lib/images'
import { fmtDate } from '../../lib/constants'
import { Spinner, EmptyState } from '../../components/ui'
import Icon from '../../components/icons'

// Site photo gallery for a project — filter by stage, shoot/upload
// straight from the phone, tap to view full screen.
export default function PhotosTab({ p, isAdmin }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [err, setErr] = useState('')
  const fileRef = useRef()

  const load = () => {
    fetchPhotos(p.id)
      .then((rows) => setPhotos(rows.filter((r) => !r.archived)))
      .catch((e) => setErr(e.message || 'Could not load photos'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [p.id])

  const stageName = (id) => p.stages?.find((s) => s.id === id)?.name || 'General'
  const activeStageId = p.stages?.[p.currentStage]?.id

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setErr('')
    try {
      const targetStage = stageFilter === 'all' ? activeStageId : stageFilter
      for (const f of files) {
        const dataUrl = await compressImage(f)
        const row = await addPhoto({ projectId: p.id, stageId: targetStage, dataUrl, caption: '' })
        setPhotos((ph) => [row, ...ph])
      }
    } catch (e2) {
      setErr(e2.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = async (photo) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    try {
      await deletePhoto(photo.id)
      setPhotos((ph) => ph.filter((x) => x.id !== photo.id))
      setViewer(null)
    } catch (e) {
      alert(e.message)
    }
  }

  const shown = stageFilter === 'all' ? photos : photos.filter((x) => x.stage_id === stageFilter)
  const stagesWithPhotos = p.stages?.filter((s) => photos.some((x) => x.stage_id === s.id)) || []

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spinner />
      </div>
    )

  return (
    <div>
      {/* Upload + filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Icon name="plus" size={16} /> {uploading ? 'Uploading…' : 'Add photos'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onFiles}
          style={{ display: 'none' }}
        />
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          {photos.length} photo{photos.length === 1 ? '' : 's'}
          {stageFilter === 'all' && activeStageId ? ' · new photos file under the active stage' : ''}
        </span>
      </div>

      {err && (
        <div className="card" style={{ padding: '10px 14px', marginBottom: 12, background: 'var(--red-soft)', borderColor: '#f0cdc5', color: 'var(--red)', fontSize: 13 }}>
          {err}
        </div>
      )}

      {stagesWithPhotos.length > 0 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
          <button className={['fchip', stageFilter === 'all' ? 'on' : ''].join(' ')} onClick={() => setStageFilter('all')}>
            All
          </button>
          {stagesWithPhotos.map((s) => (
            <button key={s.id} className={['fchip', stageFilter === s.id ? 'on' : ''].join(' ')} onClick={() => setStageFilter(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState icon="projects" title="No photos yet">
          Tap "Add photos" to shoot or upload site pics — they're saved against the current stage.
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {shown.map((ph) => (
            <button
              key={ph.id}
              onClick={() => setViewer(ph)}
              style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#000', aspectRatio: '1' }}
            >
              <img src={ph.data_url} alt={ph.caption || 'Site photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'linear-gradient(transparent, rgba(0,0,0,.65))', padding: '14px 8px 6px', textAlign: 'left' }}>
                <div style={{ color: '#fff', fontSize: 10.5, fontFamily: 'var(--disp)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  {stageName(ph.stage_id)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewer && (
        <div className="modal-veil" style={{ alignItems: 'center', padding: 14 }} onClick={() => setViewer(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: '100%' }}>
            <img src={viewer.data_url} alt={viewer.caption || 'Site photo'} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <div className="card" style={{ marginTop: 10, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 14.5 }}>{stageName(viewer.stage_id)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fmtDate(viewer.taken_at)}{viewer.caption ? ' · ' + viewer.caption : ''}</div>
              </div>
              {isAdmin && (
                <button className="btn btn-danger btn-sm" onClick={() => remove(viewer)}>
                  <Icon name="trash" size={14} /> Delete
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setViewer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
