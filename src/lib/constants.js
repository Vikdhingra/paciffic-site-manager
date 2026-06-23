// ── Brand colours (navy / gold) ──────────────────────────────
export const C = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  amber: '#B8960C',
  amberD: '#9A7D0A',
  green: '#059669',
  blue: '#0284C7',
  red: '#DC2626',
  purple: '#7C3AED',
  t1: '#0D1B3E',
  t2: '#475569',
  t3: '#94A3B8',
  navy: '#0D1B3E',
  gold: '#B8960C',
}

// Priority colours
export const PC = { high: C.red, medium: C.amber, low: C.green }

// Stage accent colours (cycled by index)
export const STAGE_COLORS = [
  '#E63946', '#F4722B', '#F59E0B', '#16A34A', '#2563EB',
  '#9333EA', '#06B6D4', '#EA580C', '#475569', '#92400E',
]
export const stageColor = (i) => STAGE_COLORS[i % STAGE_COLORS.length]

// Default 10-stage construction template
export const DEFAULT_STAGES = [
  'Site Preparation', 'Foundation / Slab Works', 'Structural Frame', 'Roofing & Envelope',
  'Lockup & Rough-Ins', 'Internal Fixing', 'Interior Finishing', 'Exterior & Landscaping',
  'Inspection & Handover', 'Completion',
]

// Roles
export const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin']
export const isAdminRole = (role) => ADMIN_ROLES.includes(role)

// ── Supervisor assignment ────────────────────────────────────
// Returns the list of supervisor IDs for a project, handling both the
// new `supervisorIds` array and the legacy single `supervisorId`.
export function projectSupervisorIds(project) {
  if (Array.isArray(project.supervisorIds)) return project.supervisorIds
  if (project.supervisorId) return [project.supervisorId]
  return []
}

// Is this user assigned to this project?
export function isAssigned(project, userId) {
  return projectSupervisorIds(project).includes(userId)
}

// Small helpers
export const uid = () => Math.random().toString(36).slice(2, 9)

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return days + 'd ago'
  if (hrs > 0) return hrs + 'h ago'
  if (mins > 0) return mins + 'm ago'
  return 'just now'
}
