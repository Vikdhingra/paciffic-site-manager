import { useState, useEffect, useCallback } from 'react'
import { fetchProjects, fetchProject } from '../lib/api'

// Loads the full relational tree; granular mutations call the API
// directly then refresh just the affected project.
export function useProjects(enabled) {
  const [projects, setProjects] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  const loadAll = useCallback(() => {
    setError(null)
    return fetchProjects()
      .then(setProjects)
      .catch((e) => {
        console.error(e)
        setError(
          /relation .*pm_/i.test(e.message || '')
            ? 'Database tables not found — run setup-database.sql in Supabase, then reload.'
            : e.message || 'Failed to load projects'
        )
      })
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (enabled) loadAll()
  }, [enabled, loadAll])

  // Refresh a single project after a mutation
  const refresh = useCallback(async (projectId) => {
    try {
      const fresh = await fetchProject(projectId)
      setProjects((ps) => ps.map((p) => (p.id === projectId ? fresh : p)))
      return fresh
    } catch {
      loadAll()
      return null
    }
  }, [loadAll])

  const addLocal = useCallback((p) => setProjects((ps) => [p, ...ps]), [])
  const removeLocal = useCallback((id) => setProjects((ps) => ps.filter((p) => p.id !== id)), [])

  return { projects, loaded, error, loadAll, refresh, addLocal, removeLocal }
}
