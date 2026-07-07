import { useState, useEffect, useRef } from 'react'
import { fetchPhotos, addPhoto, deletePhoto } from '../../lib/api'
import { compressImage } from '../../lib/images'
import { fmtDate } from '../../lib/helpers'
import { Spinner, Empty, Banner } from '../../components/ui'
import Icon from '../../components/icons'

export default function PhotosTab({ p, isAdmin, user }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [err, setErr] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    fetchPhotos(p.id)
      .then(setPhotos)
      .catch((e) => setErr(e.message || 'Could not load photos'))
      .finally(() => setLoading(false))
  }, [p.id])

  const stageName = (id) => p.stages?.find((s) => s.id === id)?.name || 'General'
  const activeId = p.stages?.find((s) => s.status === 'active')?.id || null

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true); setErr('')
    try {
      const target = stageFilter === 'all' ? activeId : stageFilter
      for (const f of files) {
        const dataUrl = await compressImage(f)
        const row = await addPhoto({ projectId: p.id, stageId: target, dataUrl, createdBy: user?.id })
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
    if (!confirm('Delete this photo?')) return
    try {
      await deletePhoto(photo.id)
      setPhotos((ph) => ph.filter((x) => x.id !== photo.id))
      setViewer(null)
    } catch (e) { alert(e.message) }
  }

  const shown = stageFilter === 'all' ? photos : photos.filter((x) => x.stage_id === stageFilter)
  const stagesWith = p.stages?.filter((s) => photos.some((x) => x.stage_id === s.id)) || []

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 44 }}><Spinner /></div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Icon name="plus" size={15} /> {uploading ? 'Uploading…' : 'Add photos'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple onChange={onFiles} style={{ display: 'none' }} />
        <span className="sub">{photos.length} photo{photos.length === 1 ? '' : 's'}</span>
      </div>

      {err && <Banner tone="red">{err}</Banner>}

      {stagesWith.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className={['pill', stageFilter === 'all' ? 'on' : ''].join(' ')} onClick={() => setStageFilter('all')}>All</button>
          {stagesWith.map((s) => (
            <button key={s.id} className={['pill', stageFilter === s.id ? 'on' : ''].join(' ')} onClick={() => setStageFilter(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <Empty icon="projects" title="No photos yet">
          Shoot or upload site pics — they file under the active stage.
        </Empty>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {shown.map((ph) => (
            <button key={ph.id} onClick={() => setViewer(ph)}
              style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#000', aspectRatio: '1' }}>
              <img src={ph.data_url} alt="Site" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div className="veil" style={{ alignItems: 'center', padding: 14 }} onClick={() => setViewer(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, width: '100%' }}>
            <img src={viewer.data_url} alt="Site" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <div className="card" style={{ marginTop: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{stageName(viewer.stage_id)}</div>
                <div className="sub">{fmtDate(viewer.taken_at)}</div>
              </div>
              {isAdmin && (
                <button className="btn btn-danger" onClick={() => remove(viewer)}>
                  <Icon name="trash" size={14} /> Delete
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setViewer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
