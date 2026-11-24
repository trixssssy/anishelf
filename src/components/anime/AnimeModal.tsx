import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { Anime, AnimeListStatus } from '../../types/anime'
import { getAnimeDetails } from '../../services/anilist'
import { useLibrary } from '../../hooks/useLibrary'
export default function AnimeModal({ anime: initial, onClose }: { anime: Anime; onClose: () => void }) {
 const [anime, setAnime] = useState(initial); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
 const { entries, addAnime, updateEntry } = useLibrary(); const entry = entries.find(item => item.anilistId === anime.id)
 useEffect(() => { let live = true; setLoading(true); getAnimeDetails(initial.id).then(value => { if (live) setAnime(value) }).catch(reason => { if (live) setError(reason instanceof Error ? reason.message : 'Détails indisponibles.') }).finally(() => { if (live) setLoading(false) }); return () => { live = false } }, [initial.id])
 const title = anime.title.english || anime.title.romaji || 'Anime'
 const status = (value: string) => { if (entry) updateEntry(anime.id, { status: value as AnimeListStatus }); else addAnime(anime, value as AnimeListStatus) }
 return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="anime-modal" role="dialog" aria-modal="true" aria-label={title}>
  <button className="modal-close" onClick={onClose} aria-label="Fermer"><X/></button>
  {anime.bannerImage && <div className="modal-banner" style={{ backgroundImage: `linear-gradient(0deg,var(--surface),transparent),url(${anime.bannerImage})` }}/>} 
  <div className="modal-content"><div className="modal-heading">{anime.coverImage.large && <img src={anime.coverImage.large} alt=""/>}<div><h2>{title}</h2><p className="muted">{anime.title.romaji} {anime.seasonYear ? `· ${anime.seasonYear}` : ''} · {anime.format || 'Anime'}</p><p className="muted">{anime.episodes ?? '?'} épisodes · Note AniList : {anime.averageScore ?? '—'}%</p>{anime.siteUrl && <a href={anime.siteUrl} target="_blank" rel="noreferrer">Voir sur AniList <ExternalLink size={13}/></a>}</div></div>
  <p>{loading ? 'Chargement des détails…' : error || (anime.description || 'Aucun synopsis disponible.').replace(/<[^>]*>/g, '')}</p>
  <div className="chips">{anime.genres?.map(genre => <span key={genre}>{genre}</span>)}</div>
  <label className="field-label">Ma liste</label><select value={entry?.status || ''} onChange={event => event.target.value ? status(event.target.value) : undefined}><option value="">Pas dans ma liste</option><option value="plan">À voir</option><option value="watch">En cours</option><option value="done">Terminé</option><option value="drop">Abandonné</option></select>
  </div></section></div>
}
