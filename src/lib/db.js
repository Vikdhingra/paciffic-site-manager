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

export function newProject({ name, location, client, supervisorId, stages }) {
  const stageNames = stages && stages.length ? stages : DEFAULT_STAGES
  return {
    id: uid(),
    name,
    location: location || '',
    client: client || '',
    supervisorId: supervisorId || null,
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
