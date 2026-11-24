import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env'

let client: SupabaseClient | null = null
if (env.supabaseUrl && env.supabaseAnonKey) {
  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { headers: { 'X-Client-Info': 'anishelf-web' } },
  })
}

export function getSupabase(): SupabaseClient {
  if (!client) throw new Error('Supabase n’est pas configuré. Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.')
  return client
}
export function isSupabaseConfigured(): boolean { return client !== null }
