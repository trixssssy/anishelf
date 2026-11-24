import type { AnimeListEntry } from '../types/anime'
import type { Playlist, UserPreferences, UserProfile } from '../types/user'
import { getSupabase } from './supabase'

export async function saveProfile(profile: Pick<UserProfile, 'id' | 'username' | 'bio' | 'avatarUrl' | 'showcaseAnimeIds'>) {
  const { error } = await getSupabase().from('profiles').upsert({ id: profile.id, username: profile.username, bio: profile.bio, avatar_url: profile.avatarUrl, showcase_anime_ids: profile.showcaseAnimeIds }, { onConflict: 'id' })
  if (error) throw error
}
export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await getSupabase().from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, username: data.username, bio: data.bio ?? '', avatarUrl: data.avatar_url, showcaseAnimeIds: data.showcase_anime_ids ?? [] }
}
export async function saveAnimeEntry(userId: string, entry: AnimeListEntry) {
  const { error } = await getSupabase().from('anime_lists').upsert({ user_id: userId, anilist_id: entry.anilistId, status: entry.status, rating: entry.rating, episodes_watched: entry.episodesWatched, notes: entry.notes, anime_snapshot: entry.anime }, { onConflict: 'user_id,anilist_id' })
  if (error) throw error
}
export async function removeAnimeEntry(userId: string, anilistId: number) {
  const { error } = await getSupabase().from('anime_lists').delete().eq('user_id', userId).eq('anilist_id', anilistId)
  if (error) throw error
}
export async function loadAnimeEntries(userId: string): Promise<AnimeListEntry[]> {
  const { data, error } = await getSupabase().from('anime_lists').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({ anilistId: row.anilist_id, status: row.status, rating: row.rating, episodesWatched: row.episodes_watched, notes: row.notes ?? '', anime: row.anime_snapshot })) as AnimeListEntry[]
}
export async function savePreferences(userId: string, preferences: UserPreferences) {
  const { error } = await getSupabase().from('user_preferences').upsert({ user_id: userId, theme: preferences.theme, palette: preferences.palette, group_sagas: preferences.groupSagas, synopsis_language: preferences.synopsisLanguage }, { onConflict: 'user_id' })
  if (error) throw error
}
export async function loadPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await getSupabase().from('user_preferences').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { theme: data.theme, palette: data.palette, groupSagas: data.group_sagas, synopsisLanguage: data.synopsis_language }
}
export async function createPlaylist(userId: string, playlist: Pick<Playlist, 'name' | 'description' | 'position'>) {
  const { data, error } = await getSupabase().from('playlists').insert({ user_id: userId, ...playlist }).select('id,name,description,position').single()
  if (error) throw error
  return data as Playlist
}
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit être une image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('L’image ne doit pas dépasser 5 Mo.')
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const supabase = getSupabase()
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function loadPlaylists(userId: string): Promise<Playlist[]> {
  const { data, error } = await getSupabase().from('playlists').select('id,name,description,position').eq('user_id', userId).order('position', { ascending: true })
  if (error) throw error
  const playlists = (data ?? []) as Playlist[]
  if (!playlists.length) return []
  const { data: items, error: itemError } = await getSupabase().from('playlist_items').select('playlist_id,anilist_id').eq('user_id', userId)
  if (itemError) throw itemError
  return playlists.map(playlist => ({ ...playlist, animeIds: (items ?? []).filter(item => item.playlist_id === playlist.id).map(item => item.anilist_id) }))
}

export async function addPlaylistItem(userId: string, playlistId: string, anime: AnimeListEntry['anime'], position: number) {
  const { error } = await getSupabase().from('playlist_items').upsert({ playlist_id: playlistId, user_id: userId, anilist_id: anime.id, position, anime_snapshot: anime }, { onConflict: 'playlist_id,anilist_id' })
  if (error) throw error
}
