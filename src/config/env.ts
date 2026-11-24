function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}. Copie .env.example vers .env et renseigne-la.`)
  return value
}

// À importer uniquement dans la partie Supabase (partie 3).
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
}

export function getSupabaseEnv() {
  return {
    url: required('VITE_SUPABASE_URL', env.supabaseUrl),
    anonKey: required('VITE_SUPABASE_ANON_KEY', env.supabaseAnonKey),
  }
}
