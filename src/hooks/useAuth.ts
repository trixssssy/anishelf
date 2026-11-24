import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getCurrentSession, onAuthStateChange } from '../services/auth'
import { isSupabaseConfigured } from '../services/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return }
    let active = true
    getCurrentSession().then(value => { if (active) setSession(value) }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Erreur de session') }).finally(() => { if (active) setLoading(false) })
    const unsubscribe = onAuthStateChange((_event, value) => { setSession(value); setLoading(false) })
    return () => { active = false; unsubscribe() }
  }, [])
  return { session, user: session?.user ?? null, loading, error, configured: isSupabaseConfigured() }
}
