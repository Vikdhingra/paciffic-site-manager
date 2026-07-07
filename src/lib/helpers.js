export const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin']
export const isAdminRole = (r) => ADMIN_ROLES.includes(r)

// Stage template with starter task checklists (Victorian residential build)
export const STAGE_TEMPLATE = [
  { name: 'Site Preparation', tasks: [
    'Site survey & set-out', 'Temporary fencing & site toilet', 'Services located & marked (DBYD)',
    'Site cut / scrape', 'Crossover protection installed',
  ]},
  { name: 'Foundation / Slab Works', tasks: [
    'Piers / screw piles installed', 'Under-slab plumbing rough-in', 'Termite protection installed',
    'Steel & mesh inspection passed', 'Slab poured & curing',
  ]},
  { name: 'Structural Frame', tasks: [
    'Frame delivered to site', 'Wall frames stood & braced', 'Roof trusses installed',
    'Frame inspection approved', 'Windows delivered',
  ]},
  { name: 'Roofing & Envelope', tasks: [
    'Sarking & roof battens', 'Roof cover installed', 'Fascia & gutter installed',
    'Building wrap complete', 'Brickwork / cladding started',
  ]},
  { name: 'Lockup & Rough-Ins', tasks: [
    'Brickwork / cladding complete', 'External doors & windows secured', 'Electrical rough-in',
    'Plumbing rough-in', 'Heating & cooling ducts run',
  ]},
  { name: 'Internal Fixing', tasks: [
    'Insulation installed & inspected', 'Plaster hung & set', 'Skirting & architraves fitted',
    'Internal doors hung', 'Cabinetry installed',
  ]},
  { name: 'Interior Finishing', tasks: [
    'Waterproofing & tiling complete', 'Painting complete', 'Electrical fit-off',
    'Plumbing fit-off', 'Appliances installed',
  ]},
  { name: 'Exterior & Landscaping', tasks: [
    'Render / external paint', 'Driveway & paths poured', 'Fencing complete',
    'Landscaping done', 'Site clean & rubbish removed',
  ]},
  { name: 'Inspection & Handover', tasks: [
    'Practical completion inspection', 'Defects rectified', 'Occupancy permit received',
    'Final builders clean', 'Handover pack prepared',
  ]},
  { name: 'Completion', tasks: [
    'Keys handed over', 'Warranty documents issued', 'Maintenance period logged', 'Final invoice issued',
  ]},
]
export const DEFAULT_STAGES = STAGE_TEMPLATE.map((s) => s.name)

export const dayKey = (d = new Date()) => {
  const x = new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtShort = (d) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

export const timeAgo = (d) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return days + 'd ago'
  if (hrs > 0) return hrs + 'h ago'
  if (mins > 0) return mins + 'm ago'
  return 'just now'
}

// ── Derived project helpers (relational shape) ──────────────
export const projectPct = (p) => {
  const total = p.stages?.length || 0
  if (!total) return 0
  const done = p.stages.filter((s) => s.status === 'complete').length
  return Math.round((done / total) * 100)
}

export const activeStage = (p) =>
  p.stages?.find((s) => s.status === 'active') ||
  p.stages?.find((s) => s.status !== 'complete') ||
  null

export const isComplete = (p) => p.status === 'complete'

export const taskCounts = (p) => {
  let total = 0, done = 0
  p.stages?.forEach((s) => s.tasks?.forEach((t) => { total++; if (t.status === 'done') done++ }))
  return { total, done }
}

export const openTasksInActiveStage = (p) => {
  const s = activeStage(p)
  return (s?.tasks || []).filter((t) => t.status !== 'done')
}

export const REQUEST_TYPES = [
  { id: 'order', label: 'Order materials' },
  { id: 'provide', label: 'Arrange / provide' },
  { id: 'question', label: 'Question' },
  { id: 'other', label: 'Other' },
]
export const typeLabel = (t) => REQUEST_TYPES.find((x) => x.id === t)?.label || 'Request'
