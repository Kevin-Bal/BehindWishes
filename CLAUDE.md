# Derrière la liste

Web app mobile-first de listes de souhaits partagées (famille, amis), où chacun voit qui offre quoi sans que le bénéficiaire le sache.

**La spec de référence est [docs/SPEC.md](docs/SPEC.md). La lire avant toute fonctionnalité.** Les stories (A1, C2, E3…) servent d'identifiants dans les commits et les tests.

## Stack

- Vite + React 19 + TypeScript strict, Tailwind CSS v4 (`@tailwindcss/vite`)
- `react-router` en mode hash (`createHashRouter`) — GitHub Pages ne gère pas les routes serveur
- Firebase JS SDK modulaire : Firestore + Auth anonyme (offre Spark)
- Vitest ; émulateurs Firebase + `@firebase/rules-unit-testing` pour les règles
- Déploiement : GitHub Actions → GitHub Pages (`base: '/BehindWishes/'`)

## Commandes

- `npm run dev` — dev contre le vrai projet Firebase (nécessite `.env.local`, voir `.env.example`)
- `npm run emulators` puis `npm run dev:emu` — dev contre les émulateurs locaux (Java 21+ requis)
- `npm run build` / `npm run lint` / `npm run test` / `npm run format`
- `npm run deploy:rules` — publie `firestore.rules` et `firestore.indexes.json`

## Conventions

- TypeScript strict, composants fonctionnels, hooks ; pas de `any`.
- **Aucun secret dans le dépôt.** La config Firebase passe par des variables `VITE_FIREBASE_*` injectées au build (variables GitHub Actions en CI).
- Textes d'interface en français, tutoiement, vocabulaire du quotidien ; dates en `fr-FR`.
- Petits commits, un lot ou une story à la fois, message qui cite la story (`feat(A1): …`).
- Accessibilité : cibles tactiles ≥ 44 px, contraste AA, statut jamais indiqué par la couleur seule.
- Hors ligne : Firestore a un cache local persistant ; toute écriture passe par `queued()` (`src/lib/firebase.ts`) pour ne pas bloquer l'interface sans réseau. Créer les documents avec `doc(collection)` + `setDoc` (l'id est connu hors ligne), pas `addDoc`.
- Règles Firestore : après modification, `npm run deploy:rules` ; les tests (`npm run test:rules`) tournent en CI (Java requis en local).

## Confidentialité de la surprise (non négociable)

- Les réservations vivent dans `claims`, jamais dans un document `wish`.
- Le client d'un bénéficiaire ne s'abonne jamais aux `claims` de sa propre liste (`beneficiaryId != moi`).
- Rien sur ma propre liste (compteur, tri, animation) ne varie selon les réservations.

## Design Liquid Glass

- Toutes les surfaces de verre passent par la classe `.glass` (variantes `.glass--thick`, `.glass--tint`) définie dans `src/styles/glass.css`. **Aucun `backdrop-filter` ailleurs.**
- Verre uniquement pour contrôles et navigation (`src/components/glass/`) ; le contenu (`Card`, `StatusChip`, `Avatar` dans `src/components/ui/`) reste opaque.
- Au plus trois éléments de verre visibles à la fois, jamais de verre sur du verre.
- `SegmentedControl` posé dans une carte ou un formulaire reste opaque (`surface="content"`, par défaut) ; `surface="glass"` seulement s'il flotte.
- Actions destructrices : style `secondary` au premier tap, `danger` (contour) seulement à l'étape de confirmation.
- Vérifier chaque écran en clair/sombre et en transparence standard/réduite/contraste élevé (page `/#/diagnostic`).

## Organisation

- `src/lib/` — Firebase, auth, préférences, utilitaires
- `src/components/glass/` — `GlassBar`, `GlassTabBar`, `GlassButton`, `GlassSheet`, `SegmentedControl`
- `src/components/ui/` — composants de contenu opaques
- `src/pages/` — un fichier par écran (routes listées dans la spec, section UX/UI)
- `tests/` — tests des règles Firestore (émulateur)
