import type { Anime, AnimeListEntry } from '../../types/anime'
import { Plus, Check, Star } from 'lucide-react'
export default function AnimeCard({ anime, entry, onAdd, onOpen }: { anime: Anime; entry?: AnimeListEntry; onAdd: () => void; onOpen: () => void }) {
 const title = anime.title.english || anime.title.romaji || anime.title.native || 'Titre inconnu'
 return <article className="card">
  <button className="open" onClick={onOpen} type="button" aria-label={`Voir ${title}`}>
   <div className="cover">{anime.coverImage.extraLarge || anime.coverImage.large ? <img src={anime.coverImage.extraLarge || anime.coverImage.large || ''} alt={`Affiche de ${title}`} loading="lazy"/> : <span>Pas d'affiche</span>}
    {anime.averageScore && <span className="score"><Star size={12} fill="currentColor"/> {anime.averageScore}%</span>}
   </div>
   <div><h3>{title}</h3><p className="sub">{anime.format || 'Anime'} · {anime.seasonYear || 'Année inconnue'}{anime.episodes ? ` · ${anime.episodes} ép.` : ''}</p></div>
  </button>
  <button className={`quick-add ${entry ? 'added' : ''}`} type="button" onClick={onAdd} title={entry ? 'Déjà dans ma liste' : 'Ajouter à ma liste'}>{entry ? <Check size={16}/> : <Plus size={16}/>}</button>
 </article>
}
