import type { Anime, AnimeFormat, AnimeListEntry, AnimeListStatus } from '../types/anime'
import type { UserPreferences } from '../types/user'
import { getSupabase } from '../services/supabase'

/** Ancienne clé utilisée par la version HTML d'Otakudex. */
export const LEGACY_STORAGE_KEY = 'otakudex-v3'
const MIGRATION_MARKER = 'anishelf-migration-v1'
const VALID_STATUS = new Set<AnimeListStatus>(['plan', 'watch', 'done', 'drop'])
const VALID_FORMAT = new Set<AnimeFormat>(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'])

type LegacyState = {
  profile?: { name?: string; bio?: string; avatar?: string; showcase?: number[] }
  theme?: { mode?: string; palette?: string }
  opts?: { group?: boolean; tr?: boolean }
  list?: Record<string, { s?: string; sc?: number; ep?: number }>
  meta?: Record<string, { t?: string; img?: string; c?: string; eps?: number; dur?: number; f?: string; y?: number; g?: string[] }>
  playlists?: Array<{ id?: string; name?: string; ids?: number[] }>
}

export interface MigrationReport {
  anime: number
  playlists: number
  playlistItems: number
  profile: boolean
  preferences: boolean
  avatarImported: boolean
}

function asObject(value: unknown): LegacyState {
  if (!value || typeof value !== 'object') throw new Error('La sauvegarde ne contient pas de données valides.')
  const wrapper = value as { app?: string; data?: unknown }
  const raw = wrapper.app === 'otakudex' ? wrapper.data : value
  if (!raw || typeof raw !== 'object') throw new Error('Format de sauvegarde non reconnu.')
  return raw as LegacyState
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

function toAnime(id: number, meta: NonNullable<LegacyState['meta']>[string]): Anime {
  const format = VALID_FORMAT.has(meta?.f as AnimeFormat) ? meta.f as AnimeFormat : null
  const image = typeof meta?.img === 'string' && meta.img.startsWith('https://') ? meta.img : null
  return {
    id,
    title: { romaji: meta?.t || `Anime ${id}`, english: null, native: null },
    coverImage: { large: image, extraLarge: image, color: meta?.c || null },
    format,
    status: null,
    episodes: safeNumber(meta?.eps) || null,
    duration: safeNumber(meta?.dur) || null,
    seasonYear: safeNumber(meta?.y) || null,
    averageScore: null,
    genres: Array.isArray(meta?.g) ? meta.g.filter((x): x is string => typeof x === 'string').slice(0, 3) : [],
    description: null,
    siteUrl: `https://anilist.co/anime/${id}`,
  }
}

function convertEntry(id: number, raw: NonNullable<LegacyState['list']>[string], anime: Anime): AnimeListEntry | null {
  if (!VALID_STATUS.has(raw?.s as AnimeListStatus)) return null
  return {
    anilistId: id,
    status: raw.s as AnimeListStatus,
    rating: safeNumber(raw.sc) > 0 ? Math.min(10, safeNumber(raw.sc)) : null,
    episodesWatched: safeNumber(raw.ep),
    notes: '',
    anime,
  }
}

/**
 * Importe une sauvegarde Otakudex dans le compte Supabase connecté.
 * La fonction ne supprime jamais l'ancienne sauvegarde du navigateur.
 */
export async function migrateLegacyBackup(userId: string, input: unknown, force = false): Promise<MigrationReport> {
  if (!force && localStorage.getItem(MIGRATION_MARKER) === userId) {
    throw new Error('Cette sauvegarde a déjà été importée sur ce compte. Utilise force=true uniquement si tu veux relancer l’import.')
  }
  const legacy = asObject(input)
  const supabase = getSupabase()
  const meta = legacy.meta ?? {}
  const rawList = legacy.list ?? {}
  const entries: AnimeListEntry[] = []

  for (const [key, raw] of Object.entries(rawList)) {
    const id = Number(key)
    if (!Number.isSafeInteger(id) || id <= 0) continue
    const anime = toAnime(id, meta[key] ?? {})
    const entry = convertEntry(id, raw, anime)
    if (entry) entries.push(entry)
  }

  const profile = legacy.profile ?? {}
  const showcase = Array.isArray(profile.showcase)
    ? profile.showcase.map(value => safeNumber(value)).filter(id => id > 0).slice(0, 5)
    : []
  let avatarImported = false
  let avatarUrl: string | null = null
  if (typeof profile.avatar === 'string' && profile.avatar.startsWith('data:image/')) {
    try {
      const response = await fetch(profile.avatar)
      const blob = await response.blob()
      if (blob.size <= 5 * 1024 * 1024 && blob.type.startsWith('image/')) {
        const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
        const path = `${userId}/migration-${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: blob.type, upsert: false })
        if (!error) {
          avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
          avatarImported = true
        }
      }
    } catch { /* L'import des autres données continue si l'avatar est invalide. */ }
  } else if (typeof profile.avatar === 'string' && profile.avatar.startsWith('https://')) {
    avatarUrl = profile.avatar
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    username: (profile.name || 'Otaku').trim().slice(0, 24) || 'Otaku',
    bio: (profile.bio || '').slice(0, 500),
    avatar_url: avatarUrl,
    showcase_anime_ids: showcase,
  }, { onConflict: 'id' })
  if (profileError) throw profileError

  const oldTheme = legacy.theme?.mode
  const preferences: UserPreferences = {
    theme: oldTheme === 'dark' ? 'dark' : oldTheme === 'light' ? 'light' : 'system',
    palette: legacy.theme?.palette || 'menthe',
    groupSagas: legacy.opts?.group !== false,
    synopsisLanguage: legacy.opts?.tr === false ? 'original' : 'fr',
  }
  const { error: prefsError } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    theme: preferences.theme,
    palette: preferences.palette,
    group_sagas: preferences.groupSagas,
    synopsis_language: preferences.synopsisLanguage,
  }, { onConflict: 'user_id' })
  if (prefsError) throw prefsError

  if (entries.length) {
    const rows = entries.map(entry => ({
      user_id: userId,
      anilist_id: entry.anilistId,
      status: entry.status,
      rating: entry.rating,
      episodes_watched: entry.episodesWatched,
      notes: entry.notes,
      anime_snapshot: entry.anime,
    }))
    const { error } = await supabase.from('anime_lists').upsert(rows, { onConflict: 'user_id,anilist_id' })
    if (error) throw error
  }

  let playlistCount = 0
  let itemCount = 0
  for (const [position, playlist] of (legacy.playlists ?? []).entries()) {
    if (!playlist || typeof playlist.name !== 'string' || !playlist.name.trim()) continue
    const { data, error } = await supabase.from('playlists').insert({
      user_id: userId,
      name: playlist.name.trim().slice(0, 60),
      description: '',
      position,
    }).select('id').single()
    if (error) throw error
    playlistCount++
    const ids = Array.isArray(playlist.ids) ? [...new Set(playlist.ids.map(value => safeNumber(value)).filter(id => id > 0))] : []
    if (!ids.length) continue
    const rows = ids.map((id, index) => ({
      playlist_id: data.id,
      user_id: userId,
      anilist_id: id,
      position: index,
      anime_snapshot: toAnime(id, meta[String(id)] ?? {}),
    }))
    const { error: itemError } = await supabase.from('playlist_items').upsert(rows, { onConflict: 'playlist_id,anilist_id' })
    if (itemError) throw itemError
    itemCount += rows.length
  }

  localStorage.setItem(MIGRATION_MARKER, userId)
  return {
    anime: entries.length,
    playlists: playlistCount,
    playlistItems: itemCount,
    profile: true,
    preferences: true,
    avatarImported,
  }
}

/** Lit directement la sauvegarde locale de l'ancienne version. */
export function readLegacyLocalBackup(): LegacyState {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) throw new Error('Aucune sauvegarde Otakudex trouvée dans ce navigateur.')
  return asObject(JSON.parse(raw))
}

export function downloadLegacyBackup(): void {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) throw new Error('Aucune sauvegarde locale à exporter.')
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'otakudex-sauvegarde-avant-migration.json'
  link.click()
  URL.revokeObjectURL(url)
}
