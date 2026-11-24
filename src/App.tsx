import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Catalogue from './pages/Catalogue'
import MaListe from './pages/MaListe'
import Classement from './pages/Classement'
import Profil from './pages/Profil'
import Reglages from './pages/Reglages'
import Connexion from './pages/Connexion'
import { LibraryProvider, useLibrary } from './hooks/useLibrary'

function SyncNotice() {
  const { syncError } = useLibrary()
  return syncError ? <p className="notice error sync-notice" role="status">Synchronisation : {syncError}</p> : null
}

export default function App() {
  return (
    <LibraryProvider>
      <Header />
      <div className="wrap"><SyncNotice /></div>
      <main className="wrap" id="contenu">
        <Routes>
          <Route path="/" element={<Catalogue />} />
          <Route path="/ma-liste" element={<MaListe />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/reglages" element={<Reglages />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </LibraryProvider>
  )
}
