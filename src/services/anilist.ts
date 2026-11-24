import type { Anime, AnimeSearchOptions, AnimeSearchResult } from '../types/anime'

const API_URL = 'https://graphql.anilist.co'
const CACHE_PREFIX = 'anishelf-cache-v1:'
const CACHE_TTL = 6 * 60 * 60 * 1000
const MIN_REQUEST_GAP = 350
const MAX_REQUESTS_PER_MINUTE = 25

const LIGHT_FIELDS = `
  id title { romaji english native } coverImage { large extraLarge color }
  format status episodes duration seasonYear startDate { year month day }
  averageScore popularity genres
`
const SEARCH_QUERY = `query ($page:Int, $perPage:Int, $search:String, $genre:String, $sort:[MediaSort], $formats:[MediaFormat], $year:Int) {
  Page(page:$page, perPage:$perPage) { pageInfo { hasNextPage total }
    media(type:ANIME, isAdult:false, search:$search, genre:$genre, sort:$sort, format_in:$formats, seasonYear:$year, genre_not_in:["Hentai"]) { ${LIGHT_FIELDS} }
  }
}`
const DETAIL_QUERY = `query ($id:Int) { Media(id:$id, type:ANIME) {
  ${LIGHT_FIELDS} siteUrl bannerImage description(asHtml:false)
  studios(isMain:true) { nodes { name } }
  relations { edges { relationType(version:2) node { id type ${LIGHT_FIELDS} } } }
} }`
const GENRES_QUERY = 'query { GenreCollection }'

type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> }
type AniListMedia = Anime
type SearchData = { Page: { pageInfo: { hasNextPage: boolean; total: number }; media: AniListMedia[] } }
type DetailData = { Media: Anime | null }

let lastRequestAt = 0
const requestTimes: number[] = []
const inFlight = new Map<string, Promise<unknown>>()
const memoryCache = new Map<string, unknown>()

function stableKey(query: string, variables: Record<string, unknown>): string {
  return `${query}:${JSON.stringify(variables)}`
}
function readCache<T>(key: string): T | null {
  const memory = memoryCache.get(key)
  if (memory) return memory as T
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const cached = JSON.parse(raw) as { savedAt: number; data: T }
    if (Date.now() - cached.savedAt > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null }
    memoryCache.set(key, cached.data)
    return cached.data
  } catch { return null }
}
function writeCache<T>(key: string, data: T): void {
  memoryCache.set(key, data)
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ savedAt: Date.now(), data })) } catch {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(CACHE_PREFIX)) localStorage.removeItem(k)
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ savedAt: Date.now(), data }))
    } catch { /* Le cache local est facultatif si le stockage est plein ou désactivé. */ }
  }
}
async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  while (requestTimes.length && now - requestTimes[0] >= 60_000) requestTimes.shift()
  const rateWait = requestTimes.length >= MAX_REQUESTS_PER_MINUTE ? 60_000 - (now - requestTimes[0]) : 0
  const gapWait = Math.max(0, MIN_REQUEST_GAP - (now - lastRequestAt))
  const wait = Math.max(rateWait, gapWait)
  if (wait > 0) await new Promise(resolve => window.setTimeout(resolve, wait + 10))
  const stamp = Date.now()
  requestTimes.push(stamp)
  lastRequestAt = stamp
}
async function gql<T>(query: string, variables: Record<string, unknown> = {}, useCache = true): Promise<T> {
  const key = stableKey(query, variables)
  if (useCache) { const cached = readCache<T>(key); if (cached) return cached }
  const pending = inFlight.get(key)
  if (pending) return pending as Promise<T>
  const task = (async () => {
    let lastError: Error | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      await waitForRateLimit()
      let response: Response
      try { response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query, variables }) }) }
      catch { throw new Error('Impossible de joindre AniList. Vérifie ta connexion.') }
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After')) || 60
        lastError = new Error(`AniList limite temporairement les requêtes. Réessaie dans ${retryAfter} secondes.`)
        if (attempt < 2) { await new Promise(resolve => window.setTimeout(resolve, Math.min(retryAfter, 90) * 1000)); continue }
        throw lastError
      }
      const json = await response.json() as GraphQLResponse<T>
      if (!response.ok || json.errors?.length || !json.data) throw new Error(json.errors?.[0]?.message || `Erreur AniList (${response.status}).`)
      if (useCache) writeCache(key, json.data)
      return json.data
    }
    throw lastError ?? new Error('Erreur inconnue AniList.')
  })()
  inFlight.set(key, task)
  try { return await task } finally { inFlight.delete(key) }
}

export async function searchAnime(options: AnimeSearchOptions = {}): Promise<AnimeSearchResult> {
  const variables: Record<string, unknown> = { page: options.page ?? 1, perPage: options.perPage ?? 24, sort: [options.sort ?? (options.search ? 'SEARCH_MATCH' : 'POPULARITY_DESC')] }
  if (options.search?.trim()) variables.search = options.search.trim()
  if (options.genre) variables.genre = options.genre
  if (options.format?.length) variables.formats = options.format
  if (options.year) variables.year = options.year
  const data = await gql<SearchData>(SEARCH_QUERY, variables)
  return { items: data.Page.media, page: variables.page as number, hasNextPage: data.Page.pageInfo.hasNextPage, total: data.Page.pageInfo.total }
}
export async function getAnimeDetails(id: number): Promise<Anime> {
  const data = await gql<DetailData>(DETAIL_QUERY, { id })
  if (!data.Media) throw new Error('Cet anime est introuvable sur AniList.')
  return data.Media
}
export async function getGenres(): Promise<string[]> {
  const data = await gql<{ GenreCollection: string[] }>(GENRES_QUERY)
  return data.GenreCollection.filter(genre => genre.toLowerCase() !== 'hentai').sort((a, b) => a.localeCompare(b))
}
export function clearAniListCache(): void {
  memoryCache.clear()
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith(CACHE_PREFIX)) keys.push(key) }
    keys.forEach(key => localStorage.removeItem(key))
  } catch { /* stockage indisponible */ }
}
