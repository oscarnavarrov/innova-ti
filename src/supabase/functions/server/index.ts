import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role_id: number
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role_id: number
        }
        Update: {
          full_name?: string
          role_id?: number
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          permissions: any
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Auth validation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación requerido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Routes
    if (path === '/make-server-2e05cbde/users' && method === 'GET') {
      // Get all users (profiles with auth info)
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select(`
          id,
          full_name,
          role_id,
          created_at,
          roles(id, name, permissions)
        `)
        .order('created_at', { ascending: false })

      if (profilesError) {
        throw profilesError
      }

      // Get user emails from auth.users for each profile
      const usersWithEmails = await Promise.all(
        profiles.map(async (profile: any) => {
          try {
            const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(profile.id)
            
            return {
              id: profile.id,
              email: authUser?.user?.email || 'Sin email',
              full_name: profile.full_name,
              role_id: profile.role_id,
              active: true,
              created_at: profile.created_at,
              last_sign_in_at: authUser?.user?.last_sign_in_at || null,
              roles: profile.roles
            }
          } catch (authError) {
            return {
              id: profile.id,
              email: 'Error obteniendo email',
              full_name: profile.full_name,
              role_id: profile.role_id,
              active: false,
              created_at: profile.created_at,
              last_sign_in_at: null,
              roles: profile.roles
            }
          }
        })
      )

      return new Response(
        JSON.stringify(usersWithEmails),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/make-server-2e05cbde/users' && method === 'POST') {
      // Create new user
      const body = await req.json()
      const { email, password, full_name, role_id } = body

      // Validate required fields
      if (!email || !password || !full_name || !role_id) {
        return new Response(
          JSON.stringify({ error: 'Email, password, full_name y role_id son requeridos' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Error creando usuario: ' + authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: authUser.user.id,
          full_name,
          role_id: parseInt(role_id),
        })
        .select(`
          id,
          full_name,
          role_id,
          created_at,
          roles(id, name, permissions)
        `)
        .single()

      if (profileError) {
        // Clean up auth user if profile creation failed
        await supabaseClient.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ error: 'Error creando perfil de usuario: ' + profileError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const userResponse = {
        id: profile.id,
        email: authUser.user.email,
        full_name: profile.full_name,
        role_id: profile.role_id,
        active: true,
        created_at: profile.created_at,
        last_sign_in_at: null,
        roles: profile.roles
      }

      return new Response(
        JSON.stringify(userResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path.startsWith('/make-server-2e05cbde/users/') && method === 'PUT') {
      // Update user
      const userId = path.split('/').pop()
      const body = await req.json()
      const { email, password, full_name, role_id } = body

      // Validate required fields
      if (!email || !full_name || !role_id) {
        return new Response(
          JSON.stringify({ error: 'Email, full_name y role_id son requeridos' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Update auth user
      const updateData: any = {
        email,
        user_metadata: { full_name },
      }

      if (password) {
        updateData.password = password
      }

      const { error: authError } = await supabaseClient.auth.admin.updateUserById(
        userId!,
        updateData
      )

      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Error actualizando usuario: ' + authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Update profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          full_name,
          role_id: parseInt(role_id),
        })
        .eq('id', userId!)
        .select(`
          id,
          full_name,
          role_id,
          created_at,
          roles(id, name, permissions)
        `)
        .single()

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Error actualizando perfil: ' + profileError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const userResponse = {
        id: profile.id,
        email: email,
        full_name: profile.full_name,
        role_id: profile.role_id,
        active: true,
        created_at: profile.created_at,
        last_sign_in_at: null,
        roles: profile.roles
      }

      return new Response(
        JSON.stringify(userResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/make-server-2e05cbde/roles' && method === 'GET') {
      // Get all roles
      const { data, error } = await supabaseClient
        .from('roles')
        .select('id, name, permissions')
        .order('id', { ascending: true })

      if (error) throw error

      const rolesWithDescription = data.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.permissions?.description || `Rol: ${role.name}`,
        permissions: role.permissions
      }))

      return new Response(
        JSON.stringify(rolesWithDescription),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default 404
    return new Response(
      JSON.stringify({ error: 'Endpoint no encontrado' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})