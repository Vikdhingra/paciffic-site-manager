// Compute portfolio-wide stats
export function computeStats(projects) {
  let allTasks = 0
  let doneTasks = 0
  let active = 0
  let completed = 0

  projects.forEach((p) => {
    const sc = p.stages?.length || 0
    const isDone = p.currentStage >= sc - 1 && sc > 0
    if (isDone) completed++
    else active++
    p.stages?.forEach((s) => {
      s.tasks?.forEach((t) => {
        allTasks++
        if (t.status === 'done') doneTasks++
      })
    })
  })

  return {
    total: projects.length,
    active,
    completed,
    allTasks,
    doneTasks,
    pct: allTasks ? Math.round((doneTasks / allTasks) * 100) : 0,
  }
}

// Build the reminders (in-progress / overdue tasks)
export function buildReminders(projects) {
  const items = []
  projects.forEach((p) => {
    p.stages?.forEach((s) => {
      s.tasks?.forEach((t) => {
        if (t.status === 'done') return
        if (t.status === 'doing' || t.actionRequired || t.dueDate) {
          items.push({
            id: p.id + ':' + t.id,
            icon: t.status === 'doing' ? '⏳' : '📌',
            title: t.status === 'doing' ? 'IN PROGRESS' : 'TO DO',
            desc: t.title,
            priority: t.priority,
            dueDate: t.dueDate,
            project: p.name + ' — ' + s.name,
            color: '#0284C7',
            proj: p,
            stage: s,
            task: t,
          })
        }
      })
    })
  })
  return items
}

// Build recent activity (completed tasks / stages)
export function buildActivity(projects) {
  const items = []
  projects.forEach((p) => {
    p.stages?.forEach((s, si) => {
      const allDone = s.tasks?.length > 0 && s.tasks.every((t) => t.status === 'done')
      if (allDone && si < p.currentStage) {
        items.push({
          id: p.id + ':stage:' + s.id,
          icon: '🏆',
          title: 'Stage Complete',
          desc: s.name,
          project: p.name,
          color: '#059669',
          ts: s.notedAt || p._updated || p.createdAt,
        })
      }
      s.tasks?.forEach((t) => {
        if (t.status === 'done') {
          items.push({
            id: p.id + ':task:' + t.id,
            icon: '✓',
            title: 'Task Done',
            desc: t.title,
            project: p.name + ' — ' + s.name,
            color: '#059669',
            ts: t.doneAt || p._updated || p.createdAt,
          })
        }
      })
    })
  })
  items.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0))
  return items
}

// Supervisor notes across projects
export function buildNotes(projects) {
  const items = []
  projects.forEach((p) => {
    p.stages?.forEach((s) => {
      if (s.notedAt && (s.achievements || s.notes || s.nextSteps)) {
        items.push({
          project: p,
          stage: s,
          notedAt: s.notedAt,
          achievements: s.achievements,
          notes: s.notes,
        })
      }
    })
  })
  items.sort((a, b) => new Date(b.notedAt) - new Date(a.notedAt))
  return items
}
