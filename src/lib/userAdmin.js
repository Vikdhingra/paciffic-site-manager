import { supabase } from './supabase'

// Calls the secure Netlify function, attaching the caller's access token.
async function callManageUsers(payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/.netlify/functions/manage-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session.access_token,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const inviteUser = (email, fullName, role) =>
  callManageUsers({ action: 'invite', email, fullName, role })

export const createUserWithPassword = (email, fullName, role, password) =>
  callManageUsers({ action: 'createWithPassword', email, fullName, role, password })

export const adminSetRole = (userId, role) =>
  callManageUsers({ action: 'setRole', userId, role })

export const adminResetPassword = (email) =>
  callManageUsers({ action: 'resetPassword', email })

export const adminDeleteUser = (userId) =>
  callManageUsers({ action: 'deleteUser', userId })
