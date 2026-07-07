import { supabase } from './supabase'
import { STAGE_TEMPLATE, dayKey } from './helpers'

// ═══ AUTH ══════════════════════════════════════════════════
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  if (error) throw error
}
export async function signOut() {
  await supabase.auth.signOut()
}

// ═══ PROFILES ══════════════════════════════════════════════
export async function fetchMyProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data || null
}
export async function fetchAllProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data || []
}

// ═══ PROJECTS (nested load: stages → tasks, assignments) ═══
const PROJECT_SELECT = '*, stages:pm_stages(*, tasks:pm_tasks(*)), assignments:pm_assignments(user_id)'

const shape = (row) => ({
  ...row,
  stages: (row.stages || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ ...s, tasks: (s.tasks || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) })),
  supervisorIds: (row.assignments || []).map((a) => a.user_id),
})

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('pm_projects')
    .select(PROJECT_SELECT)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(shape)
}

export async function fetchProject(id) {
  const { data, error } = await supabase.from('pm_projects').select(PROJECT_SELECT).eq('id', id).single()
  if (error) throw error
  return shape(data)
}

export async function createProject({ name, address, client, supervisorIds, seedTasks = true }) {
  const { data: proj, error } = await supabase
    .from('pm_projects')
    .insert({ name, address: address || '', client: client || '' })
    .select()
    .single()
  if (error) throw error

  const stageRows = STAGE_TEMPLATE.map((st, i) => ({
    project_id: proj.id,
    name: st.name,
    sort_order: i + 1,
    status: i === 0 ? 'active' : 'pending',
  }))
  const { data: stages, error: e2 } = await supabase.from('pm_stages').insert(stageRows).select()
  if (e2) throw e2

  if (seedTasks) {
    const taskRows = []
    STAGE_TEMPLATE.forEach((st) => {
      const stage = (stages || []).find((x) => x.name === st.name)
      if (!stage) return
      st.tasks.forEach((title) => taskRows.push({ project_id: proj.id, stage_id: stage.id, title }))
    })
    if (taskRows.length) {
      const { error: e4 } = await supabase.from('pm_tasks').insert(taskRows)
      if (e4) throw e4
    }
  }

  if (supervisorIds?.length) {
    const { error: e3 } = await supabase
      .from('pm_assignments')
      .insert(supervisorIds.map((uid) => ({ project_id: proj.id, user_id: uid })))
    if (e3) throw e3
  }
  return fetchProject(proj.id)
}

export async function updateProject(id, patch) {
  const { error } = await supabase
    .from('pm_projects')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProjectById(id) {
  const { error } = await supabase.from('pm_projects').delete().eq('id', id)
  if (error) throw error
}

export async function setAssignments(projectId, userIds) {
  const { error } = await supabase.from('pm_assignments').delete().eq('project_id', projectId)
  if (error) throw error
  if (userIds.length) {
    const { error: e2 } = await supabase
      .from('pm_assignments')
      .insert(userIds.map((uid) => ({ project_id: projectId, user_id: uid })))
    if (e2) throw e2
  }
}

// ═══ STAGES ════════════════════════════════════════════════
export async function completeStage(project, stageId) {
  const ordered = project.stages
  const idx = ordered.findIndex((s) => s.id === stageId)
  const { error } = await supabase
    .from('pm_stages')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', stageId)
  if (error) throw error

  // Activate the next incomplete stage; if none remain, the project is done.
  const remaining = ordered.filter((s, i) => s.id !== stageId && s.status !== 'complete')
  const next = remaining.find((s) => ordered.indexOf(s) > idx) || remaining[0]
  if (next) {
    await supabase.from('pm_stages').update({ status: 'active' }).eq('id', next.id)
  } else {
    await updateProject(project.id, { status: 'complete' })
  }
}

export async function reopenStage(project, stageId) {
  // Reopened stage becomes the single active stage
  const others = project.stages.filter((s) => s.id !== stageId && s.status === 'active').map((s) => s.id)
  if (others.length) {
    await supabase.from('pm_stages').update({ status: 'pending' }).in('id', others)
  }
  const { error } = await supabase
    .from('pm_stages')
    .update({ status: 'active', completed_at: null })
    .eq('id', stageId)
  if (error) throw error
  if (project.status === 'complete') await updateProject(project.id, { status: 'active' })
}

export async function setActiveStage(project, stageId) {
  const current = project.stages.filter((s) => s.status === 'active').map((s) => s.id)
  if (current.length) await supabase.from('pm_stages').update({ status: 'pending' }).in('id', current)
  const { error } = await supabase.from('pm_stages').update({ status: 'active' }).eq('id', stageId)
  if (error) throw error
}

// ═══ TASKS ═════════════════════════════════════════════════
export async function addTask({ projectId, stageId, title, priority, dueDate }) {
  const { data, error } = await supabase
    .from('pm_tasks')
    .insert({ project_id: projectId, stage_id: stageId, title, priority: priority || 'medium', due_date: dueDate || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setTaskDone(taskId, done) {
  const { error } = await supabase
    .from('pm_tasks')
    .update({ status: done ? 'done' : 'todo', done_at: done ? new Date().toISOString() : null })
    .eq('id', taskId)
  if (error) throw error
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('pm_tasks').delete().eq('id', taskId)
  if (error) throw error
}

// ═══ PHOTOS ════════════════════════════════════════════════
export async function fetchPhotos(projectId) {
  const { data, error } = await supabase
    .from('pm_photos')
    .select('*')
    .eq('project_id', projectId)
    .order('taken_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function addPhoto({ projectId, stageId, dataUrl, createdBy }) {
  const { data, error } = await supabase
    .from('pm_photos')
    .insert({ project_id: projectId, stage_id: stageId || null, data_url: dataUrl, created_by: createdBy || null })
    .select()
    .single()
  if (error) throw error
  return data
}
export async function deletePhoto(id) {
  const { error } = await supabase.from('pm_photos').delete().eq('id', id)
  if (error) throw error
}

// ═══ DIARY ═════════════════════════════════════════════════
export async function fetchDiaryEntry(projectId, entryDate) {
  const { data, error } = await supabase
    .from('pm_diary')
    .select('*')
    .eq('project_id', projectId)
    .eq('entry_date', entryDate)
    .maybeSingle()
  if (error) throw error
  return data || null
}
export async function fetchDiaryEntries(projectId, limit = 30) {
  const { data, error } = await supabase
    .from('pm_diary')
    .select('*')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
export async function fetchTodayDiaryStatus(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from('pm_diary')
    .select('project_id')
    .eq('entry_date', dayKey())
    .in('project_id', projectIds)
  if (error) throw error
  const map = {}
  ;(data || []).forEach((r) => (map[r.project_id] = true))
  return map
}
export async function saveDiaryEntry(entry) {
  const { data, error } = await supabase
    .from('pm_diary')
    .upsert(
      {
        ...(entry.id ? { id: entry.id } : {}),
        project_id: entry.project_id,
        entry_date: entry.entry_date,
        supervisor_id: entry.supervisor_id || null,
        supervisor_name: entry.supervisor_name || '',
        weather: entry.weather || '',
        trades: entry.trades || '',
        deliveries: entry.deliveries || '',
        delays: entry.delays || '',
        safety: entry.safety || '',
        summary: entry.summary || '',
        jobs: entry.jobs || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,entry_date' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// ═══ REQUESTS ══════════════════════════════════════════════
export async function fetchRequests(projectId) {
  const { data, error } = await supabase
    .from('pm_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function fetchOpenRequests() {
  const { data, error } = await supabase
    .from('pm_requests')
    .select('*')
    .neq('status', 'done')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function fetchOpenRequestCounts(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from('pm_requests')
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
    .from('pm_requests')
    .insert({
      project_id: req.project_id,
      title: req.title,
      details: req.details || '',
      type: req.type || 'other',
      priority: req.priority || 'medium',
      needed_by: req.needed_by || null,
      created_by: req.created_by || null,
      created_by_name: req.created_by_name || '',
    })
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateRequest(id, patch) {
  const { data, error } = await supabase
    .from('pm_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ═══ NOTIFY LOOP: answered requests awaiting site acknowledgement ═══
export async function fetchAnsweredRequests(projectIds) {
  if (!projectIds.length) return []
  const { data, error } = await supabase
    .from('pm_requests')
    .select('*')
    .eq('status', 'done')
    .eq('site_ack', false)
    .in('project_id', projectIds)
    .order('done_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function ackRequest(id) {
  const { error } = await supabase.from('pm_requests').update({ site_ack: true }).eq('id', id)
  if (error) throw error
}

// ═══ GLOBAL PHOTO GALLERY (admin) ═══════════════════════════
export async function fetchNewPhotos(limit = 24) {
  const { data, error } = await supabase
    .from('pm_photos')
    .select('*')
    .eq('archived', false)
    .order('taken_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
export async function archivePhoto(id) {
  const { error } = await supabase.from('pm_photos').update({ archived: true }).eq('id', id)
  if (error) throw error
}

// ═══ ADMIN MORNING VIEW: today's diaries across projects ═══
export async function fetchTodayDiaries(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from('pm_diary')
    .select('*')
    .eq('entry_date', dayKey())
    .in('project_id', projectIds)
  if (error) throw error
  const map = {}
  ;(data || []).forEach((r) => (map[r.project_id] = r))
  return map
}

// ═══ PROJECT FILES (Supabase Storage: pm-files bucket) ══════
export async function fetchFiles(projectId) {
  const { data, error } = await supabase
    .from('pm_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Create a file record — either an uploaded file OR an external link.
export async function createProjectFile({ projectId, name, category, description, file, linkUrl, userId, userName }) {
  let storagePath = null
  let size = 0
  let mime = ''
  if (file) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    storagePath = projectId + '/' + Date.now() + '-' + safe
    const { error: upErr } = await supabase.storage.from('pm-files').upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (upErr) throw upErr
    size = file.size
    mime = file.type || ''
  }
  const { data, error } = await supabase
    .from('pm_files')
    .insert({
      project_id: projectId,
      name,
      category: category || '',
      description: description || '',
      link_url: linkUrl || '',
      size,
      mime,
      storage_path: storagePath,
      uploaded_by: userId || null,
      uploaded_by_name: userName || '',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProjectFile(id, patch) {
  const { data, error } = await supabase.from('pm_files').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export function fileUrl(row) {
  if (row.link_url) return row.link_url
  if (!row.storage_path) return '#'
  const { data } = supabase.storage.from('pm-files').getPublicUrl(row.storage_path)
  return data.publicUrl
}

export async function deleteProjectFile(row) {
  if (row.storage_path) await supabase.storage.from('pm-files').remove([row.storage_path])
  const { error } = await supabase.from('pm_files').delete().eq('id', row.id)
  if (error) throw error
}
