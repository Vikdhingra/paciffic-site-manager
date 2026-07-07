import { supabase } from './supabase'
import { uid, DEFAULT_STAGES, stageColor } from './constants'

// ── PROJECTS ──────────────────────────────────────────────────
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('sc_projects')
    .select('id,data,updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({ ...r.data, id: r.id, _updated: r.updated_at }))
}

export async function saveProject(p) {
  // Strip photos out of the jsonb blob (photos live in sc_photos)
  const stages = (p.stages || []).map((s) => ({ ...s, photos: [] }))
  const { error } = await supabase
    .from('sc_projects')
    .upsert({ id: p.id, data: { ...p, stages }, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function deleteProject(id) {
  const { error } = await supabase.from('sc_projects').delete().eq('id', id)
  if (error) throw error
}

export function newProject({ name, location, client, supervisorIds, stages }) {
  const stageNames = stages && stages.length ? stages : DEFAULT_STAGES
  return {
    id: uid(),
    name,
    location: location || '',
    client: client || '',
    supervisorIds: supervisorIds || [],
    color: stageColor(Math.floor(Math.random() * 10)),
    currentStage: 0,
    createdAt: new Date().toISOString(),
    stages: stageNames.map((nm, i) => ({
      id: uid(),
      name: nm,
      status: i === 0 ? 'active' : 'pending',
      tasks: [],
      achievements: '',
      notes: '',
      nextSteps: '',
    })),
  }
}

// ── PROFILES ──────────────────────────────────────────────────
export async function fetchMyProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data || null
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data || []
}

export async function setUserRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
}

// ── PHOTOS ────────────────────────────────────────────────────
export async function fetchPhotos(projectId) {
  const { data, error } = await supabase
    .from('sc_photos')
    .select('*')
    .eq('project_id', projectId)
    .order('taken_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchRecentPhotos(limit = 12) {
  const { data, error } = await supabase
    .from('sc_photos')
    .select('*')
    .order('taken_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function addPhoto({ projectId, stageId, dataUrl, caption }) {
  const { data, error } = await supabase
    .from('sc_photos')
    .insert({
      id: uid(),
      project_id: projectId,
      stage_id: stageId,
      data_url: dataUrl,
      caption: caption || '',
      taken_at: new Date().toISOString(),
      archived: false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePhoto(id) {
  const { error } = await supabase.from('sc_photos').delete().eq('id', id)
  if (error) throw error
}

// ── TEMPLATES ─────────────────────────────────────────────────
export async function fetchTemplates() {
  const { data, error } = await supabase.from('sc_templates').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function saveTemplate(t) {
  const { error } = await supabase.from('sc_templates').upsert(t)
  if (error) throw error
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from('sc_templates').delete().eq('id', id)
  if (error) throw error
}

// ── AUTH ──────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email, password, fullName) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'supervisor' } },
  })
  if (error) throw error
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

// ── DAILY SITE DIARY (sc_diary) ───────────────────────────────
// One entry per project per day. `data` holds the diary body:
// { weather, trades, deliveries, delays, safety, summary,
//   plannedJobs: [{ taskId, stageId, title, done }] }

const dayKey = (d = new Date()) => {
  const x = new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
export { dayKey }

export async function fetchDiaryEntries(projectId, limit = 30) {
  const { data, error } = await supabase
    .from('sc_diary')
    .select('*')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function fetchDiaryEntry(projectId, entryDate) {
  const { data, error } = await supabase
    .from('sc_diary')
    .select('*')
    .eq('project_id', projectId)
    .eq('entry_date', entryDate)
    .maybeSingle()
  if (error) throw error
  return data || null
}

// Which of these projects already have a diary entry for today?
export async function fetchTodayDiaryStatus(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from('sc_diary')
    .select('project_id')
    .eq('entry_date', dayKey())
    .in('project_id', projectIds)
  if (error) throw error
  const map = {}
  ;(data || []).forEach((r) => (map[r.project_id] = true))
  return map
}

export async function saveDiaryEntry(entry) {
  const { error } = await supabase.from('sc_diary').upsert(
    {
      id: entry.id,
      project_id: entry.project_id,
      entry_date: entry.entry_date,
      supervisor_id: entry.supervisor_id || null,
      supervisor_name: entry.supervisor_name || '',
      data: entry.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'project_id,entry_date' }
  )
  if (error) throw error
}

// ── SITE REQUESTS — supervisor → admin support (sc_requests) ──
// type: 'order' | 'provide' | 'question' | 'other'
// status: 'open' | 'in_progress' | 'done'

export async function fetchRequests(projectId) {
  const { data, error } = await supabase
    .from('sc_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchOpenRequests() {
  const { data, error } = await supabase
    .from('sc_requests')
    .select('*')
    .neq('status', 'done')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchOpenRequestCounts(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from('sc_requests')
    .select('project_id')
    .neq('status', 'done')
    .in('project_id', projectIds)
  if (error) throw error
  const map = {}
  ;(data || []).forEach((r) => (map[r.project_id] = (map[r.project_id] || 0) + 1))
  return map
}

export async function addRequest(req) {
  const { data, error } = await supabase
    .from('sc_requests')
    .insert({
      id: uid(),
      project_id: req.project_id,
      title: req.title,
      details: req.details || '',
      type: req.type || 'other',
      priority: req.priority || 'medium',
      needed_by: req.needed_by || null,
      status: 'open',
      created_by: req.created_by || null,
      created_by_name: req.created_by_name || '',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRequest(id, patch) {
  const { data, error } = await supabase
    .from('sc_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
