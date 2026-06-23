// Secure user-management endpoint.
// Runs ON THE SERVER (Netlify) so the Supabase SERVICE ROLE key is never
// exposed to the browser. The caller must send their own access token; we
// verify they are an admin before allowing any action.
//
// Required Netlify environment variables:
//   SUPABASE_URL                 (your project URL)
//   SUPABASE_SERVICE_ROLE_KEY    (Settings → API → service_role secret)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin']

export default async (req) => {
  // CORS / preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: cors() })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: 'Server not configured (missing env vars)' }, 500)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Verify the caller is a logged-in admin ──────────────────
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return json({ error: 'Not authenticated' }, 401)

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)

  const callerId = userData.user.id
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single()

  if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role)) {
    return json({ error: 'Admin access required' }, 403)
  }
  const isSuperAdmin = callerProfile.role === 'super_admin'

  // ── Parse the action ────────────────────────────────────────
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  const { action } = body

  try {
    switch (action) {
      // Invite by email — Supabase emails them a set-password link
      case 'invite': {
        const { email, fullName, role } = body
        if (!email) return json({ error: 'Email required' }, 400)
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName || '', role: role || 'supervisor' },
        })
        if (error) throw error
        await upsertProfile(admin, data.user.id, email, fullName, role || 'supervisor')
        return json({ ok: true, user: data.user })
      }

      // Create with a temporary password (admin shares it manually)
      case 'createWithPassword': {
        const { email, fullName, role, password } = body
        if (!email || !password) return json({ error: 'Email and password required' }, 400)
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName || '', role: role || 'supervisor' },
        })
        if (error) throw error
        await upsertProfile(admin, data.user.id, email, fullName, role || 'supervisor')
        return json({ ok: true, user: data.user })
      }

      // Change a user's role (only super_admin can grant admin)
      case 'setRole': {
        const { userId, role } = body
        if (!userId || !role) return json({ error: 'userId and role required' }, 400)
        if (role === 'super_admin') return json({ error: 'Cannot assign super_admin' }, 403)
        if (role === 'admin' && !isSuperAdmin)
          return json({ error: 'Only a super admin can grant admin' }, 403)
        const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
        if (error) throw error
        return json({ ok: true })
      }

      // Send a password-reset email
      case 'resetPassword': {
        const { email } = body
        if (!email) return json({ error: 'Email required' }, 400)
        const { error } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email,
        })
        if (error) throw error
        return json({ ok: true })
      }

      // Delete a user entirely
      case 'deleteUser': {
        const { userId } = body
        if (!userId) return json({ error: 'userId required' }, 400)
        if (userId === callerId) return json({ error: 'You cannot delete yourself' }, 400)
        // protect super_admins from non-super admins
        const { data: target } = await admin
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
        if (target?.role === 'super_admin' && !isSuperAdmin)
          return json({ error: 'Cannot delete a super admin' }, 403)
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) throw error
        await admin.from('profiles').delete().eq('id', userId)
        return json({ ok: true })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (e) {
    return json({ error: e.message || 'Operation failed' }, 500)
  }
}

async function upsertProfile(admin, id, email, fullName, role) {
  await admin.from('profiles').upsert({
    id,
    email,
    full_name: fullName || email,
    role,
  })
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  })
}
