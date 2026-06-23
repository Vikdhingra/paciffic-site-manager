import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  fetchProjects,
  saveProject as dbSaveProject,
  deleteProject as dbDeleteProject,
} from '../lib/db'

// Loads all projects once, keeps them in sync via realtime,
// and exposes save/delete helpers with optimistic updates.
export function useProjects(enabled) {
  const [projects, setProjects] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  // Initial load
  useEffect(() => {
    if (!enabled) return
    let active = true
    setLoaded(false)
    setError(null)
    fetchProjects()
      .then((rows) => {
        if (!active) return
        setProjects(rows)
        setLoaded(true)
      })
      .catch((e) => {
        if (!active) return
        console.error('fetchProjects failed:', e)
        setError(e.message || 'Failed to load projects')
        setLoaded(true) // stop the spinner even on error
      })
    return () => {
      active = false
    }
  }, [enabled])

  // Realtime sync
  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel('sc_projects_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sc_projects' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setProjects((prev) => prev.filter((p) => p.id !== payload.old.id))
          } else {
            const u = { ...payload.new.data, id: payload.new.id, _updated: payload.new.updated_at }
            setProjects((prev) => {
              const i = prev.findIndex((p) => p.id === u.id)
              return i >= 0 ? prev.map((p, j) => (j === i ? u : p)) : [u, ...prev]
            })
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled])

  const save = useCallback(async (project) => {
    // optimistic update
    setProjects((prev) => {
      const i = prev.findIndex((p) => p.id === project.id)
      return i >= 0 ? prev.map((p, j) => (j === i ? project : p)) : [project, ...prev]
    })
    try {
      await dbSaveProject(project)
    } catch (e) {
      console.error('saveProject failed:', e)
      throw e
    }
  }, [])

  const remove = useCallback(async (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    try {
      await dbDeleteProject(id)
    } catch (e) {
      console.error('deleteProject failed:', e)
      throw e
    }
  }, [])

  return { projects, loaded, error, save, remove, setProjects }
}
