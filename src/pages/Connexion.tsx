import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordReset, signIn, signUp } from '../services/auth'
import { useAuth } from '../hooks/useAuth'

export default function Connexion() {
  const { user, configured, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      if (mode === 'login') await signIn(email, password)
      else { const result = await signUp(email, password, username); setMessage(result.session ? 'Compte créé et connecté.' : 'Compte créé. Vérifie tes e-mails pour confirmer ton adresse.') }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Une erreur est survenue.') }
    finally { setBusy(false) }
  }
  async function reset() {
    if (!email.trim()) { setMessage('Saisis ton adresse e-mail avant de demander la réinitialisation.'); return }
    try { await sendPasswordReset(email); setMessage('E-mail de réinitialisation envoyé si cette adresse possède un compte.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible d’envoyer le lien.') }
  }
  return <section className="intro"><h1>Connexion</h1><p>Connecte ton compte pour synchroniser tes listes et tes préférences.</p>
    {!configured ? <div className="err"><h3>Supabase n’est pas configuré</h3><p>Renseigne les deux variables VITE_SUPABASE dans ton fichier .env puis redémarre Vite.</p></div> : loading ? <p>Chargement de la session…</p> : user ? <div className="set"><h2>Connecté</h2><p>{user.email}</p><p>La session Supabase est active.</p><Link className="btn" to="/profil">Voir mon profil</Link></div> : <form className="set" onSubmit={submit}>
      <div className="seg"><button type="button" aria-pressed={mode === 'login'} onClick={() => setMode('login')}>Connexion</button><button type="button" aria-pressed={mode === 'register'} onClick={() => setMode('register')}>Créer un compte</button></div>
      {mode === 'register' && <label className="fld">Pseudo<input className="txt" value={username} onChange={e => setUsername(e.target.value)} minLength={3} maxLength={24} required /></label>}
      <label className="fld">Adresse e-mail<input className="txt" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label className="fld">Mot de passe<input className="txt" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <button className="btn acc" type="submit" disabled={busy}>{busy ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
      {mode === 'login' && <button className="ghost" type="button" onClick={reset}>Mot de passe oublié ?</button>}
      {message && <p role="status" className="hint">{message}</p>}
    </form>}
  </section>
}
