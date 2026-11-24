import { Link, NavLink } from 'react-router-dom'
import { Settings, SunMoon, UserCircle } from 'lucide-react'
import { useLibrary } from '../../hooks/useLibrary'
import { useAuth } from '../../hooks/useAuth'
const links = [{ to: '/', label: 'Catalogue', end: true },{ to: '/ma-liste', label: 'Ma liste' },{ to: '/classement', label: 'Classement' },{ to: '/profil', label: 'Profil' }]
export default function Header() {
 const { preferences, updatePreferences, entries } = useLibrary(); const { user } = useAuth()
 const nextTheme = preferences.theme === 'light' ? 'dark' : 'light'
 return <header className="bar"><div className="bar-in"><Link className="logo" to="/" aria-label="AniShelf, accueil">Ani<b>Shelf</b><small>ANIME LIBRARY</small></Link><nav aria-label="Navigation principale">{links.map(({to,label,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>isActive?'nav-link active':'nav-link'}>{label}{label==='Ma liste'&&<span className="count">{entries.length}</span>}</NavLink>)}</nav><div className="bar-r"><button className="iconbtn" type="button" aria-label="Changer de thème" title="Changer de thème" onClick={()=>updatePreferences({theme:nextTheme})}><SunMoon size={17}/></button><Link className="iconbtn" to="/reglages" aria-label="Réglages"><Settings size={17}/></Link><Link className="iconbtn" to={user?'/profil':'/connexion'} aria-label={user?'Mon profil':'Connexion'}><UserCircle size={17}/></Link></div></div></header>
}
