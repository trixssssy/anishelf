# AniShelf — Partie 4 : fonctionnalités de l'application

Cette archive contient le projet complet (socle des parties précédentes inclus) avec les écrans React raccordés.

## Fonctionnalités ajoutées

- Catalogue AniList : recherche, genre, format, tri, pagination, cartes et fiche détaillée.
- Bibliothèque : ajout et suppression, statuts, progression des épisodes, note personnelle, score sur 10.
- Classement personnel calculé à partir des notes attribuées.
- Profil : pseudo, bio, avatar Supabase, statistiques et vitrine de cinq titres.
- Playlists : création, ajout d'animes depuis la liste, stockage local et synchronisation Supabase.
- Réglages : thèmes clair/sombre/système, palettes, export et import JSON.
- Migration de sauvegarde Otakudex depuis les réglages ou depuis un fichier JSON, sans effacer la source.
- Affichage des erreurs de synchronisation et mise en page responsive.

## Lancement

```bash
npm install
cp .env.example .env
npm run dev
```

Sans Supabase, le catalogue et la bibliothèque locale restent utilisables. Pour les comptes, les avatars et la synchronisation cloud, renseigner les variables VITE_SUPABASE dans `.env` et exécuter `supabase/schema.sql`.

## Vérification

Les fichiers TypeScript/TSX ont été contrôlés pour les erreurs de syntaxe, et les fichiers JSON ainsi que l'équilibre des accolades CSS ont été vérifiés. La compilation complète `npm run build` n'a pas pu être exécutée ici : l'installation des dépendances a expiré faute d'accès disponible au registre npm. Il faudra donc lancer `npm install` puis `npm run build` sur ta machine avant publication.

## Fonctions avancées encore à terminer

Le regroupement visuel des sagas, la traduction automatique des synopsis et l'édition/réorganisation/suppression des playlists ne sont pas encore reproduits. Les préférences correspondantes et les données de migration sont conservées, mais ces interactions demandent une prochaine passe.
