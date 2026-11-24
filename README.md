# AniShelf — bibliothèque personnelle d’animes

Application React + TypeScript + Vite, avec AniList pour le catalogue et Supabase pour les comptes et la synchronisation des données personnelles. Le routage utilise `HashRouter` afin de fonctionner sur GitHub Pages. Les listes et réglages restent également disponibles en local via `localStorage`.

> AniShelf est un projet indépendant. AniList fournit les données du catalogue ; AniShelf n’est ni développé ni approuvé par AniList.

> **Guide pas à pas pour GitHub :** consulte [`GUIDE_GITHUB.md`](./GUIDE_GITHUB.md) pour créer le dépôt, envoyer les fichiers, configurer Supabase et publier le site avec GitHub Pages.

## 1. Lancer en local

Prérequis : Node.js 22 ou supérieur et npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Renseigne ensuite les deux variables Supabase dans `.env`. Sans configuration Supabase, les pages publiques peuvent être consultées, mais les fonctions de compte et de synchronisation ne fonctionneront pas.

## 2. Configurer Supabase

1. Crée un projet sur [supabase.com](https://supabase.com/).
2. Dans **Project Settings → API**, copie l’URL du projet et la clé publique `anon` ou `publishable`.
3. Place-les dans `.env` : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
4. Dans **SQL Editor**, exécute le fichier `supabase/schema.sql`.
5. Dans **Authentication → URL Configuration**, ajoute les URL de développement et de production dans les URL autorisées. Pour GitHub Pages, utilise l’URL exacte du site, par exemple `https://UTILISATEUR.github.io/NOM-DU-DEPOT/`.
6. Configure la confirmation des e-mails selon tes besoins.

Le schéma crée les tables `profiles`, `anime_lists`, `playlists`, `playlist_items` et `user_preferences`, active RLS et crée le bucket `avatars`.

### Sécurité

- La clé publique `anon`/`publishable` est destinée au navigateur ; les politiques RLS protègent les données.
- Ne place **jamais** `service_role` dans `.env`, dans le dépôt ou dans les secrets de build du site.
- Les politiques RLS doivent rester activées. Ne les désactive pas pour « régler » une erreur d'accès.
- Les images d’avatar sont limitées à 5 Mo dans le service client et dans le bucket.

## 3. AniList

Les recherches publiques utilisent l’API GraphQL d’AniList. Aucune clé privée n’est requise pour les requêtes publiques. Le service est dans `src/services/anilist.ts`.

## 4. Migrer les anciennes données Otakudex

La migration est dans `src/utils/migration.ts`.

1. Ouvre l’ancienne version d’Otakudex dans le navigateur où tes données sont enregistrées.
2. Dans ses réglages, exporte une sauvegarde JSON. Garde ce fichier intact avant de continuer.
3. Connecte-toi au compte AniShelf qui doit recevoir les données.
4. Dans AniShelf, ouvre **Réglages → Ancienne bibliothèque Otakudex** puis clique sur **Importer Otakudex vers AniShelf**. Tu peux aussi importer directement un fichier JSON Otakudex depuis la zone Importer une sauvegarde.
5. Vérifie le nombre d’entrées, les playlists, le profil et les préférences dans le compte de destination.

Exemple d'utilisation dans un composant déjà connecté (pour une sauvegarde JSON choisie par l’utilisateur, passe son contenu après `JSON.parse`) :

```ts
import { migrateLegacyBackup, readLegacyLocalBackup } from './utils/migration'

const report = await migrateLegacyBackup(user.id, readLegacyLocalBackup())
console.log('Migration terminée', report)
```

La migration importe les statuts, progression par épisodes, notes de score, données d'anime disponibles dans l'ancien cache, playlists et leur ordre, pseudo, bio, avatar, vitrine et préférences. Les anciennes données qui ne correspondent pas au schéma cible (caches de traduction, caches AniList temporaires et éléments de session) ne sont pas importées : elles sont recréées au besoin. Les champs absents de l'ancien cache ne peuvent pas être reconstitués exactement ; les fiches d'anime incomplètes utilisent une fiche minimale AniList.

**Important :** la migration n'efface pas la clé `otakudex-v3` ni le fichier JSON. Elle ajoute un marqueur local pour éviter un double import accidentel. En cas de migration interrompue, vérifie les données avant de relancer ; `force=true` permet de forcer une nouvelle passe, mais peut recréer les playlists.

## 5. Déployer sur GitHub Pages

1. Crée un dépôt GitHub et pousse le contenu de ce dossier sur la branche `main`.
2. Dans **Settings → Secrets and variables → Actions**, ajoute :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (clé publique uniquement)
3. Dans **Settings → Pages**, choisis **GitHub Actions** comme source de publication.
4. Vérifie que le workflow `.github/workflows/deploy.yml` est présent sur `main`.
5. À chaque push sur `main`, GitHub Actions installe les dépendances, construit `dist/` et publie le site.
6. Ajoute l’URL GitHub Pages aux URL autorisées dans Supabase Authentication.

`vite.config.ts` détecte automatiquement le nom du dépôt dans GitHub Actions et règle le préfixe d'URL. En local, le site utilise `/`.


## 6. Fonctionnalités de l'application

- **Catalogue** : recherche AniList, filtres de genre et de format, tri, pagination et fiche détaillée.
- **Ma liste** : statuts À voir / En cours / Terminé / Abandonné, progression d'épisodes, notes personnelles, note sur 10 et suppression.
- **Classement** : classement personnel des animes notés.
- **Profil** : pseudo, bio, avatar Supabase Storage, statistiques et sélection de quatre animes à mettre en avant.
- **Playlists** : création de playlists et ajout d'animes depuis Ma liste. Les playlists et leurs éléments sont synchronisés pour les comptes Supabase.
- **Réglages** : thèmes clair/sombre/système, préférences, export JSON et import de sauvegardes AniShelf ou Otakudex.

Les données de la bibliothèque sont enregistrées localement et synchronisées avec Supabase lorsqu'un compte est connecté et que les variables d'environnement sont configurées. Le regroupement visuel des sagas, la traduction automatique des synopsis et l'édition/réorganisation/suppression des playlists restent à terminer : leurs préférences ou les données héritées peuvent être conservées sans que toutes ces interactions soient encore disponibles.

## 7. Vérifier le projet

```bash
npm run typecheck
npm run build
npm run preview
```

Puis vérifie manuellement :

- la recherche AniList et l'ouverture d'une fiche ;
- inscription, connexion, déconnexion et réinitialisation du mot de passe ;
- lecture/écriture des données personnelles avec deux comptes différents ;
- import d'une sauvegarde Otakudex sur un compte de test ;
- avatar, playlists et ordre des éléments ;
- affichage mobile et liens après publication GitHub Pages.

## 8. Arborescence utile

- `src/pages/` : pages de l'application ;
- `src/components/` : composants React ;
- `src/services/` : AniList, Supabase, authentification et synchronisation ;
- `src/utils/migration.ts` : import de l'ancienne sauvegarde ;
- `supabase/schema.sql` : tables, index, triggers, stockage et politiques RLS ;
- `.github/workflows/deploy.yml` : déploiement automatisé.

## Licence et attribution

Les données de catalogue et certaines images proviennent d'AniList. Respecte les conditions d'utilisation et les règles d'attribution d'AniList lors de la publication.
