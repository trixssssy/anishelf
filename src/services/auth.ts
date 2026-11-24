import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

export async function signUp(email: string, password: string, username: string) {
  const cleanUsername = username.trim()
  if (cleanUsername.length < 3 || cleanUsername.length > 24) throw new Error('Le pseudo doit contenir entre 3 et 24 caractères.')
  if (!/^[\p{L}\p{N}_-]+$/u.test(cleanUsername)) throw new Error('Le pseudo ne peut contenir que des lettres, chiffres, _ et -.')
  const { data, error } = await getSupabase().auth.signUp({ email: email.trim(), password, options: { data: { username: cleanUsername } } })
  if (error) throw error
  return data
}
export async function signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  return data
}
export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut()
  if (error) throw error
}
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}${window.location.pathname}#/connexion` })
  if (error) throw error
}
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession()
  if (error) throw error
  return data.session
}
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const { data } = getSupabase().auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}
