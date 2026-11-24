import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Anime, AnimeListEntry, AnimeListStatus } from '../types/anime'
import type { Playlist, UserPreferences, UserProfile } from '../types/user'
import { useAuth } from './useAuth'
import { loadAnimeEntries, saveAnimeEntry, removeAnimeEntry, loadProfile, saveProfile, loadPreferences, savePreferences, createPlaylist, loadPlaylists, addPlaylistItem } from '../services/sync'

const KEY = 'anishelf-library-v1'
const PREF_KEY = 'anishelf-preferences-v1'
const PROFILE_KEY = 'anishelf-profile-v1'
type LibraryState = { entries: AnimeListEntry[]; playlists: Playlist[] }
type LibraryContextValue = LibraryState & {
  preferences: UserPreferences; profile: UserProfile; ready: boolean; syncError: string | null
  addAnime: (anime: Anime, status?: AnimeListStatus) => void
  updateEntry: (id: number, patch: Partial<Pick<AnimeListEntry, 'status'|'rating'|'episodesWatched'|'notes'>>) => void
  removeAnime: (id: number) => void; updateProfile: (patch: Partial<UserProfile>) => void
  updatePreferences: (patch: Partial<UserPreferences>) => void; addPlaylist: (name: string, description: string) => void; addToPlaylist: (playlistId: string, animeId: number) => void
}
const defaults: UserPreferences = { theme: 'light', palette: 'original', groupSagas: true, synopsisLanguage: 'original' }
const emptyProfile: UserProfile = { id: 'local', username: 'Otaku', bio: '', avatarUrl: null, showcaseAnimeIds: [] }
const Context = createContext<LibraryContextValue | null>(null)
function read<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }
export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [library, setLibrary] = useState<LibraryState>(() => read(KEY, { entries: [], playlists: [] }))
  const [preferences, setPreferences] = useState<UserPreferences>(() => read(PREF_KEY, defaults))
  const [profile, setProfile] = useState<UserProfile>(() => read(PROFILE_KEY, emptyProfile))
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(library)) }, [library])
  useEffect(() => { localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); document.documentElement.dataset.theme = preferences.theme; document.documentElement.dataset.palette = preferences.palette }, [preferences])
  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) }, [profile])
  useEffect(() => {
    let active = true
    if (!user) { setReady(true); return }
    setReady(false)
    Promise.all([loadAnimeEntries(user.id), loadProfile(user.id), loadPreferences(user.id), loadPlaylists(user.id)]).then(([entries, remoteProfile, remotePrefs, remotePlaylists]) => {
      if (!active) return
      setLibrary(current => ({ ...current, entries: entries.length ? entries : current.entries, playlists: remotePlaylists.length ? remotePlaylists : current.playlists }))
      if (remoteProfile) setProfile(remoteProfile)
      if (remotePrefs) setPreferences(remotePrefs)
    }).catch(error => { if (active) setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible.') }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [user?.id])
  const value = useMemo<LibraryContextValue>(() => ({
    ...library, preferences, profile, ready, syncError,
    addAnime(anime, status = 'plan') {
      const entry: AnimeListEntry = { anilistId: anime.id, status, rating: null, episodesWatched: 0, notes: '', anime }
      setLibrary(current => ({ ...current, entries: [entry, ...current.entries.filter(item => item.anilistId !== anime.id)] }))
      if (user) void saveAnimeEntry(user.id, entry).catch(error => setSyncError(error.message))
    },
    updateEntry(id, patch) {
      const changed = library.entries.find(entry => entry.anilistId === id); if (!changed) return
      const updated = { ...changed, ...patch }; setLibrary(current => ({ ...current, entries: current.entries.map(entry => entry.anilistId === id ? updated : entry) }))
      if (user) void saveAnimeEntry(user.id, updated).catch(error => setSyncError(error.message))
    },
    removeAnime(id) { setLibrary(current => ({ ...current, entries: current.entries.filter(entry => entry.anilistId !== id) })); if (user) void removeAnimeEntry(user.id, id).catch(error => setSyncError(error.message)) },
    updateProfile(patch) { const next = { ...profile, ...patch, id: user?.id ?? profile.id }; setProfile(next); if (user) void saveProfile(next).catch(error => setSyncError(error.message)) },
    updatePreferences(patch) { const next = { ...preferences, ...patch }; setPreferences(next); if (user) void savePreferences(user.id, next).catch(error => setSyncError(error.message)) },
    addPlaylist(name, description) { const playlist: Playlist = { id: crypto.randomUUID(), name, description, position: library.playlists.length, animeIds: [] }; setLibrary(current => ({ ...current, playlists: [...current.playlists, playlist] })); if (user) void createPlaylist(user.id, playlist).then(remote => setLibrary(current => ({ ...current, playlists: current.playlists.map(item => item.id === playlist.id ? { ...item, id: remote.id } : item) }))).catch(error => setSyncError(error.message)) },
    addToPlaylist(playlistId, animeId) { const anime = library.entries.find(entry => entry.anilistId === animeId)?.anime; const playlist = library.playlists.find(item => item.id === playlistId); if (!anime || !playlist) return; const position = playlist.animeIds?.length ?? 0; setLibrary(current => ({ ...current, playlists: current.playlists.map(item => item.id === playlistId ? { ...item, animeIds: [...new Set([...(item.animeIds ?? []), animeId])] } : item) })); if (user) void addPlaylistItem(user.id, playlistId, anime, position).catch(error => setSyncError(error.message)) },
  }), [library, preferences, profile, ready, syncError, user])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useLibrary() { const value = useContext(Context); if (!value) throw new Error('useLibrary doit être utilisé dans LibraryProvider'); return value }
