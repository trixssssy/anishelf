export interface UserProfile { id: string; username: string; bio: string; avatarUrl: string | null; showcaseAnimeIds: number[] }
export interface UserPreferences { theme: 'light' | 'dark' | 'system'; palette: string; groupSagas: boolean; synopsisLanguage: 'original' | 'fr' }
export interface Playlist { id: string; name: string; description: string; position: number; animeIds?: number[] }
