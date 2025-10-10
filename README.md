# Bienvenue sur l'api spotify

Sur ce site, vous avez la possibilité de visualiser les informations relatifs à votre compte spotify, les artistes que vous suivez, et rechercher la musique de votre choix.

## Fonctionnalités

  - Accèder aux informations de votre compte
  - Visualiser la liste des Artistes que vous suivez
  - Rechercher une musique
  - Ecouter une musique

## Architecture des fichiers

```text
POC_API_SPOTIFY
 ┣ 📂 public
 ┃ ┗ 📜 index.html                # Point d’entrée de l’application
 ┣ 📂 src
 ┃ ┣ 📜 main.js                   # Fichier principal — initialise l’app et gère la redirection
 ┃ ┣ 📜 auth.js                   # Contient les fonctions d’authentification (PKCE)
 ┃ ┣ 📜 callback.js               # Gère le retour Spotify et l’échange du code contre un token
 ┃ ┣ 📜 api.js                    # Fonctions utilitaires pour appeler l’API Spotify (fetch profile, etc.)
 ┃ ┗ 📜 ui.js                     # Gère l’affichage des données utilisateur
 ┣ 📜 package.json                # Configuration du projet et dépendances
 ┣ 📜 vite.config.js              # Configuration du bundler Vite
 ┣ 📜 .gitignore                  # Fichiers et dossiers ignorés par Git
 ┗ 📜 README.md                   # Documentation du projet
```

## Guide d'installation

1) Télécharger le zip du projet.
2) ajouter votre client_id dans la variable client_id du fichier [script.js](src/script.js)
3) Démarer le projet avec la commande :

```
npm run dev
```
