import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Create a singleton Supabase client to avoid multiple instances
const supabase = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export { supabase }