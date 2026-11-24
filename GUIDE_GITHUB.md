# Guide simple — publier AniShelf sur GitHub Pages

Ce guide part du principe que tu utilises Windows. Tu n'as pas besoin de créer les fichiers un par un : le dossier `anishelf` contient déjà le projet.

## Étape 1 — Préparer le dossier

1. Télécharge l'archive `anishelf-complet.zip`.
2. Fais clic droit dessus → **Extraire tout…**.
3. Ouvre le dossier extrait `anishelf`.
4. Vérifie que tu vois directement `package.json`, `src`, `public`, `supabase`, `.github` et `README.md`.

Attention : il faut envoyer le contenu du dossier `anishelf` à GitHub, pas créer un dépôt qui ne contiendrait qu'une archive ZIP.

## Étape 2 — Créer le dépôt GitHub

1. Va sur <https://github.com/new> et connecte-toi.
2. Dans **Repository name**, écris `anishelf` (ou un autre nom, mais retiens-le : il sera utilisé dans l'adresse du site).
3. Choisis **Public** si tu veux utiliser GitHub Pages gratuitement avec ce dépôt.
4. Laisse décochées les options pour ajouter un README, `.gitignore` ou une licence : ces fichiers sont déjà dans le projet.
5. Clique sur **Create repository**.

Garde l'adresse du dépôt sous la forme `https://github.com/TON-PSEUDO/anishelf`.

## Étape 3 — Envoyer le projet depuis ton PC

Installe Git si nécessaire : <https://git-scm.com/downloads>. Ouvre ensuite un terminal dans le dossier `anishelf` (Explorateur Windows : ouvre le dossier, clique dans la barre d'adresse, tape `cmd`, puis Entrée).

Exécute ces commandes une par une. Remplace `TON-PSEUDO` par ton identifiant GitHub et `anishelf` par le nom réel de ton dépôt si tu l'as changé.

```bash
git init
git add .
git commit -m "Initialisation AniShelf"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/anishelf.git
git push -u origin main
```

Si Git demande ton identité pour le premier commit :

```bash
git config --global user.name "Ton pseudo GitHub"
git config --global user.email "ton-adresse-mail"
```

Puis relance `git commit` et `git push`. Pour les prochaines mises à jour :

```bash
git add .
git commit -m "Mise à jour AniShelf"
git push
```

## Étape 4 — Créer le projet Supabase

1. Va sur <https://supabase.com/> et crée un projet.
2. Dans **Project Settings → API**, récupère l'URL du projet et la clé publique `anon` ou `publishable`.
3. Dans ton dossier local `anishelf`, copie `.env.example` vers `.env`.
   - PowerShell : `Copy-Item .env.example .env`
   - Invite de commandes : `copy .env.example .env`
4. Ouvre `.env` et remplace les valeurs d'exemple :

```env
VITE_SUPABASE_URL=https://TON-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=TA_CLE_PUBLIQUE_ANON_OU_PUBLISHABLE
```

5. Dans Supabase, ouvre **SQL Editor**, crée une requête, copie tout le contenu de `supabase/schema.sql`, puis exécute-le.
6. Enregistre `.env`. Ce fichier est ignoré par Git : ne le publie jamais.

**Sécurité :** utilise uniquement la clé publique `anon`/`publishable` dans l'application. N'utilise jamais `service_role` dans le navigateur, dans `.env` ou dans GitHub Pages.

## Étape 5 — Ajouter les secrets à GitHub

Dans ton dépôt GitHub :

1. Ouvre **Settings → Secrets and variables → Actions**.
2. Clique sur **New repository secret**.
3. Crée le secret `VITE_SUPABASE_URL` et colle l'URL Supabase.
4. Crée le secret `VITE_SUPABASE_ANON_KEY` et colle la clé publique `anon`/`publishable`.

Ces secrets servent à construire le site dans GitHub Actions. La clé publique est intégrée au code livré au navigateur : sa sécurité dépend des règles RLS du schéma SQL. La clé `service_role` ne doit jamais être ajoutée.

## Étape 6 — Activer GitHub Pages

1. Dans le dépôt, ouvre **Settings → Pages**.
2. Dans **Build and deployment → Source**, sélectionne **GitHub Actions**.
3. Va dans l'onglet **Actions**.
4. Le workflow **Déployer AniShelf sur GitHub Pages** doit démarrer après le push sur `main`. Tu peux aussi le lancer avec **Run workflow**.
5. Attends que les étapes de build et de déploiement soient vertes.
6. L'adresse du site sera normalement : `https://TON-PSEUDO.github.io/anishelf/`.

Le fichier `.github/workflows/deploy.yml` est déjà configuré. Le préfixe du dépôt est détecté automatiquement par Vite dans GitHub Actions ; ne change pas `base` au hasard.

## Étape 7 — Autoriser l'adresse du site dans Supabase

Dans Supabase, ouvre **Authentication → URL Configuration** :

- **Site URL** : `https://TON-PSEUDO.github.io/anishelf/`
- **Redirect URLs** : ajoute `https://TON-PSEUDO.github.io/anishelf/**` et `http://localhost:5173/**`.

Remplace `TON-PSEUDO` et `anishelf` par tes vraies valeurs. Enregistre les changements.

## Étape 8 — Tester le site

Avant de partager le lien, teste au minimum :

- le chargement de la page et la recherche dans le catalogue ;
- l'ouverture d'une fiche anime ;
- l'ajout d'un anime à Ma liste, puis le rechargement de la page ;
- la progression des épisodes et la note personnelle ;
- la création d'un compte, la connexion et la déconnexion ;
- la synchronisation Supabase ;
- l'import d'une sauvegarde Otakudex sur un compte de test ;
- l'affichage sur téléphone.

Pour tester sur ton PC :

```bash
npm install
npm run dev
```

Pour vérifier la version de production :

```bash
npm run typecheck
npm run build
npm run preview
```

## Problèmes fréquents

- **Page blanche** : ouvre GitHub → Actions et regarde l'erreur du build. Vérifie aussi la console du navigateur (F12).
- **404 ou ressources introuvables** : vérifie que GitHub Pages utilise **GitHub Actions**, que le workflow est vert et que l'adresse contient `/nom-du-depot/`.
- **Supabase ne répond pas** : vérifie les deux secrets GitHub, le schéma SQL et les URL autorisées dans Authentication.
- **Connexion qui revient en erreur** : ajoute l'URL GitHub Pages exacte et son motif `/**` dans les Redirect URLs Supabase.
- **Le site est ancien après une modification** : vérifie qu'un nouveau push a bien déclenché le workflow et actualise la page avec `Ctrl + F5`.

## Important avant une utilisation réelle

Fais une sauvegarde JSON de ton ancienne bibliothèque avant la migration. Commence par tester l'import avec un compte Supabase de test. Ne supprime pas ton ancienne sauvegarde tant que tu n'as pas vérifié tes listes, notes, playlists et profil dans AniShelf.
