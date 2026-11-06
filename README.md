# Derrière la liste

Les listes de souhaits de la famille, sans gâcher la surprise. Web app mobile-first (Vite + React + Firebase), hébergée sur GitHub Pages.

- Spec : [docs/SPEC.md](docs/SPEC.md)
- Conventions pour Claude Code : [CLAUDE.md](CLAUDE.md)

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir avec la config de l'app Web Firebase
npm run dev
```

Page technique : `http://localhost:5173/BehindWishes/#/diagnostic` (Auth anonyme + test lecture/écriture Firestore, aperçu des composants).

### Avec les émulateurs (sans toucher aux vraies données)

Nécessite Java 21+.

```bash
npm run emulators   # terminal 1
npm run dev:emu     # terminal 2
```

## Déploiement

- **Site** : chaque push sur `main` lance `.github/workflows/deploy.yml` (lint, tests, build, GitHub Pages). La config Firebase est lue depuis les _variables_ du dépôt (`APIKEY`, `AUTHDOMAIN`, `PROJECTID`, `STORAGEBUCKET`, `MESSAGINGSENDERID`, `APPID`).
- **Règles Firestore** : `npx firebase login` puis `npm run deploy:rules`.
