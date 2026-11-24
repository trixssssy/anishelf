export type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'UNKNOWN'
export type AnimeStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'
export type AnimeListStatus = 'plan' | 'watch' | 'done' | 'drop'

export interface AnimeTitle { romaji: string | null; english: string | null; native: string | null }
export interface AnimeCover { large: string | null; extraLarge?: string | null; color?: string | null }
export interface Anime {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCover;
  format: AnimeFormat | null;
  status: AnimeStatus | null;
  episodes: number | null;
  duration: number | null;
  seasonYear: number | null;
  averageScore: number | null;
  popularity?: number | null;
  genres: string[];
  description?: string | null;
  siteUrl?: string | null;
  bannerImage?: string | null;
  studios?: { nodes: Array<{ name: string }> };
  relations?: { edges: AnimeRelation[] };
}
export interface AnimeRelation { relationType: string; node: Pick<Anime, 'id' | 'title' | 'coverImage' | 'format' | 'status' | 'episodes' | 'duration' | 'seasonYear' | 'averageScore' | 'genres'> & { type?: string } }
export interface AnimeSearchOptions { search?: string; genre?: string; sort?: 'POPULARITY_DESC' | 'TRENDING_DESC' | 'SCORE_DESC' | 'START_DATE_DESC' | 'TITLE_ROMAJI' | 'SEARCH_MATCH'; format?: AnimeFormat[]; year?: number; page?: number; perPage?: number }
export interface AnimeSearchResult { items: Anime[]; page: number; hasNextPage: boolean; total: number }
export interface AnimeListEntry { anilistId: number; status: AnimeListStatus; rating: number | null; episodesWatched: number; notes: string; anime: Anime }
