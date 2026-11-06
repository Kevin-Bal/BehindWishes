# Specs — Derrière la liste

Nov 6, 2026 · @Kévin BALAVOINE

## Vision et périmètre

« Derrière la liste » est une web app mobile-first où une famille ou un groupe d’amis centralise ses listes de souhaits par évènement et voit qui offre quoi, sans que le bénéficiaire le sache.

**Le problème.** Les listes sont éparpillées (messages, notes, papier) et personne ne sait qui a déjà pris quoi : doublons, relances, cadeaux qui se recoupent.

**Principes produit**

- Zéro compte : on saisit un code, on choisit son prénom, c’est tout.
- La surprise est sacrée : le bénéficiaire ne voit jamais un indice de réservation sur sa propre liste.
- Utilisable par une grand-mère comme par un ado : peu d’écrans, gros boutons, vocabulaire simple.
- Gratuit et sans serveur à maintenir : GitHub Pages + Firebase (offre Spark).
- Temps réel : une réservation apparaît chez les autres sans recharger la page.
- Ajouter un souhait en moins de 30 secondes sur téléphone.

**Dans le MVP :** accès par code, choix de l’identité, gestion des membres, évènements (bénéficiaires, participants, date), listes de souhaits (titre, lien, description), réservation et suivi « acheté » masqués au bénéficiaire, vue « Mes réservations ».

**Hors MVP :** saisie intelligente des liens, tirage au sort, cagnotte, notifications, comptes avec e-mail, paiement (voir Évolutions).

**Critère de réussite.** Une famille de 10 personnes crée son groupe, l’évènement Noël 2026 et ses premiers souhaits en moins de 10 minutes. Cible calendrier proposée : MVP en ligne fin novembre 2026, pour que les listes soient remplies bien avant le 25 décembre.

## Concepts et vocabulaire

L’app repose sur huit notions ; le point clé est la distinction entre **bénéficiaire** (qui fait des souhaits) et **participant** (qui a accès à l’évènement).

| Terme | Définition | Règle |
| --- | --- | --- |
| Groupe | Espace privé (famille, amis) ouvert par un code | Contient des membres et des évènements |
| Code d’accès | 8 caractères, ex. `K7M2-QX4P` | Sert aussi d’identifiant du groupe ; partageable par lien `/#/g/K7M2-QX4P` |
| Membre | Personne du groupe : prénom, couleur, emoji | Pas de mot de passe ; appartient à un seul groupe |
| Évènement | Occasion dans un groupe : Noël 2026, anniversaire de Léa | Type, date facultative, bénéficiaires, participants |
| Bénéficiaire | Membre qui a une liste de souhaits dans cet évènement | Ne voit jamais les réservations sur sa liste |
| Participant | Membre qui a accès à l’évènement | Voit les listes, réserve ; tout bénéficiaire est aussi participant |
| Souhait | Envie d’un bénéficiaire : titre, lien, description | Appartient à un évènement et à un bénéficiaire |
| Réservation | Un participant prend un souhait d’un autre | Une par participant et par souhait, donc plusieurs réservations possibles sur un même souhait ; statut Réservé puis Acheté |

**Préréglages de type d’évènement** (tout reste modifiable à la création) :

| Type | Bénéficiaires | Participants |
| --- | --- | --- |
| Noël | Tous les participants | Tous les membres |
| Anniversaire | Une personne | Tous les membres |
| Autre (naissance, mariage, pot de départ) | Au choix | Au choix |

## Parcours utilisateurs

Cinq actions suffisent entre l’arrivée et la première réservation : saisir le code, choisir son prénom, ouvrir un évènement, consulter une liste, réserver.

&#91;embedded content: parcours utilisateur · 9 étapes, 1 décision\]

La liste est le seul écran qui change selon le visiteur : sur la mienne j’édite sans voir aucune réservation, sur celle d’un autre je vois les statuts et je réserve.

## Fonctionnalités du MVP

Le MVP tient en 5 blocs de fonctionnalités ; chaque story porte un identifiant réutilisable dans les commits et les tests.

**A. Accès et identité**

- **A1** · Je saisis un code pour entrer dans mon groupe.
  - Le code ignore la casse, les espaces et les tirets.
  - Code inconnu : message clair, sans indice sur les codes existants.
- **A2** · Je choisis qui je suis dans la liste des membres.
  - Le choix est mémorisé sur l’appareil, par groupe.
  - Un bouton « Ce n’est pas moi » permet de changer d’identité ; les trois dernières identités utilisées sur l’appareil sont proposées en tête pour basculer en un tap (un parent gère ainsi la liste d’un enfant en prenant son profil).
  - Ouvrir le lien `/#/g/CODE` saute la saisie du code.
- **A3** · Je crée un groupe : nom + prénoms des membres.
  - Au moins 2 membres ; le code est généré et affiché avec « Copier » et « Partager ».

**B. Membres**

- **B1** · Depuis l’accueil, j’ajoute, renomme ou archive un membre.
  - Archiver le retire des nouveaux évènements mais conserve l’historique.
  - Pas de suppression définitive si le membre a des souhaits ou des réservations.
- **B2** · Chaque membre a une couleur et un emoji pour être reconnaissable d’un coup d’œil.

**C. Évènements**

- **C1** · L’accueil affiche des cartes d’évènements (titre, type, date, « J-49 »), triées par date, uniquement ceux où je suis participant.
- **C2** · Je crée un évènement : titre, type, date facultative, bénéficiaires, participants.
  - Le préréglage Noël coche tout le monde dans les deux listes.
  - Un bénéficiaire est automatiquement participant ; au moins 1 bénéficiaire.
- **C3** · Je modifie ou archive un évènement.
  - Retirer un bénéficiaire masque sa liste sans supprimer ses souhaits (confirmation).
  - La suppression demande une confirmation et est réservée au créateur.

**D. Souhaits**

- **D1** · Sur la page d’un évènement, je vois la liste de chaque bénéficiaire ; la mienne apparaît en premier.
- **D2** · J’ajoute un souhait avec le bouton « + ».
  - Titre obligatoire ; lien, description, prix indicatif et priorité (1 à 3 étoiles) facultatifs.
  - Le formulaire n’affiche que 3 champs ; « Plus d’options » déplie le reste.
  - Un lien est validé (http/https), affiché par son domaine et ouvert dans un nouvel onglet (`rel="noopener noreferrer"`).
- **D3** · Je modifie ou supprime un souhait de ma liste, avec confirmation à la suppression.
- **D4** · Ma liste est triée par priorité puis par date d’ajout.

**E. Réservation et suivi**

- **E1** · Sur la liste d’un autre, chaque souhait affiche Libre, Réservé ou Acheté avec le nombre de personnes ; un tap sur le souhait montre leurs prénoms.
- **E2** · Je réserve un souhait en un tap, même si quelqu’un d’autre l’a déjà réservé.
  - Si le souhait est déjà réservé, une confirmation douce prévient (« Léa l’a déjà réservé, tu le prends quand même ? ») ; s’il est déjà acheté, l’avertissement est plus marqué.
- **E3** · Je passe ma réservation à « Acheté » ou je l’annule ; seul le réservant le peut.
- **E4** · « Mes réservations » regroupe mes cadeaux par personne et par évènement, avec statut, lien et total estimé.
- **E5** · Sur ma propre liste, aucune trace de réservation (voir Confidentialité).

**F. Exigences transverses**

- Mises à jour en temps réel (écoute Firestore) sans rechargement.
- Mobile-first à partir de 360 px de large, utilisable sur ordinateur.
- États de chargement, d’erreur réseau (« Tu es hors ligne ») et de liste vide soignés.
- Interface en français, dates au format `fr-FR`.
- Accessibilité de base : contrastes AA, cibles tactiles de 44 px minimum, statut jamais indiqué par la couleur seule.

## Confidentialité de la surprise

Le bénéficiaire ne doit pouvoir déduire aucune réservation sur sa propre liste ; on y parvient en stockant les réservations à part des souhaits et en supprimant tout indice dans l’interface.

**Qui voit quoi** (la règle s’applique par liste : on peut être bénéficiaire sur la sienne et participant sur celle des autres)

| Action | Bénéficiaire, sur sa liste | Participant, sur la liste d’un autre | Membre non participant |
| --- | --- | --- | --- |
| Voir les souhaits | Oui | Oui | Non (évènement invisible) |
| Ajouter, modifier, supprimer un souhait | Oui | Non | Non |
| Voir Libre / Réservé / Acheté | **Non** | Oui, avec le nombre de réservations et les prénoms au tap | Non |
| Réserver, marquer acheté | Non | Oui | Non |
| Annuler une réservation | Sans objet | Seulement la sienne | Non |

**Règles d’implémentation**

1. Les réservations vivent dans une collection `claims` distincte ; un document `wish` ne contient jamais d’information de réservation.
2. Le client d’un bénéficiaire ne s’abonne jamais aux `claims` de sa propre liste : requête filtrée sur `beneficiaryId != moi`.
3. Aucun compteur, tri, animation ou notification sur ma liste ne varie selon les réservations.
4. Un membre ne peut jamais réserver un souhait de sa propre liste.

**Cas limites**

- Le bénéficiaire supprime un souhait déjà réservé : le souhait disparaît de sa liste (suppression logique `deleted=true`), et le réservant voit une ligne « Souhait supprimé » avec un bouton pour libérer sa réservation.
- Le bénéficiaire modifie le titre ou le lien d’un souhait réservé : une étiquette « Modifié » apparaît côté réservant uniquement.
- Changement d’identité sur l’appareil : autorisé, mais jamais mis en avant dans l’interface.

**Trois niveaux de protection** (décision à prendre, voir Questions ouvertes)

| Niveau | Principe | Ce qu’il empêche | Limite |
| --- | --- | --- | --- |
| 1. Confiance familiale (MVP) | Séparation des données + interface sans indice | Les spoilers accidentels | Un curieux qui change d’identité ou ouvre la console du navigateur peut voir |
| 2. Durcie (lot 6, optionnel) | Appareil lié à un membre dans les règles Firestore (`sessions/{uid}`) ; lecture des `claims` refusée à l’appareil du bénéficiaire | La lecture directe par console depuis son propre appareil | Contournable en effaçant les données du navigateur puis en choisissant une autre identité |
| 3. Garantie réelle (hors périmètre) | Connexion par e-mail (lien magique) | L’usurpation d’identité | Casse le principe « zéro compte » ; chaque membre doit fournir une adresse e-mail |

Le niveau 1 est une barrière sociale, pas une sécurité bancaire : pour une famille de confiance, c’est le bon compromis entre simplicité et protection.

## Modèle de données (Firestore)

Tout est rangé sous le document du groupe, dont l’identifiant est le code d’accès : connaître le code donne accès au contenu, et aucune requête ne permet de lister les groupes.

```text
groups/{code}                      # code = identifiant, 8 caractères sans ambiguïté (pas de 0/O, 1/I)
  name, createdAt
  members/{memberId}
    name, color, emoji?, archived=false, createdAt
  events/{eventId}
    title, type ("noel"|"anniversaire"|"autre"), date? (Timestamp),
    beneficiaryIds[], participantIds[], archived=false, createdBy, createdAt
    wishes/{wishId}
      beneficiaryId, title, url?, description?, priceEstimate? (€), priority? (1-3),
      deleted=false, createdAt, updatedAt
    claims/{wishId}_{memberId}                # une réservation par personne et par souhait, plusieurs possibles
      beneficiaryId (dénormalisé), claimedBy, status ("reserved"|"purchased"),
      claimedAt, updatedAt
  sessions/{uid}                   # niveau 2 uniquement : lie un appareil à un membre
    memberId, createdAt
```

**Choix structurants**

- Les identifiants de membres, évènements et souhaits sont aléatoires (`doc().id`) : jamais de prénom dans un chemin.
- Les dates serveur utilisent `serverTimestamp()` ; les suppressions de souhaits sont logiques (`deleted=true`) pour que le réservant soit prévenu.
- La réservation est un `claim` dont l’identifiant combine celui du souhait et celui du membre : la règle `create` n’autorise la création que si le document n’existe pas, ce qui empêche une même personne de réserver deux fois le même souhait, sans bloquer les autres participants.
- `beneficiaryId` est copié dans le `claim` pour pouvoir filtrer côté requête et côté règles.

**Requêtes principales**

| Écran | Requête | Remarque |
| --- | --- | --- |
| Accueil du groupe | `events` où `participantIds` contient moi, `archived == false`, tri par `date` | Index composite à déclarer dans `firestore.indexes.json` |
| Page évènement | `wishes` de l’évènement où `deleted == false` | Regroupement par bénéficiaire côté client |
| Statuts sur les listes des autres | `claims` où `beneficiaryId != moi` | Regroupement par souhait côté client ; jamais de lecture globale des `claims` |
| Mes réservations | `claims` où `claimedBy == moi`, évènement par évènement | Évite l’index de groupe de collections |

Volume estimé : 20 membres × 10 souhaits ≈ 200 documents par évènement, très en dessous des quotas gratuits (50 000 lectures par jour).

## Architecture et stack technique

L’app est un site statique hébergé sur GitHub Pages qui parle directement à Firebase (offre Spark, gratuite) : aucun serveur à maintenir, donc la sécurité repose entièrement sur les règles Firestore.

&#91;embedded content: architecture · site statique + Firebase, proxy optionnel\]

Le seul élément optionnel est un petit proxy pour la saisie intelligente des liens : un navigateur ne peut pas lire les pages d’autres sites (CORS).

**Stack recommandée**

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Interface | Vite + React 18 + TypeScript (mode strict) | Build statique pour GitHub Pages, très bien maîtrisé par Claude Code |
| Style | Tailwind CSS | Rapide à écrire, mobile-first |
| Routage | `react-router` en mode hash (`/#/g/CODE/e/ID`) | GitHub Pages ne gère pas les routes côté serveur |
| Données | Firebase JS SDK v10 modulaire : Firestore + Auth anonyme | Temps réel natif, aucun backend |
| Tests | Vitest + Firebase Emulator Suite + `@firebase/rules-unit-testing` | Prouver que les règles de confidentialité tiennent |
| Déploiement | GitHub Actions vers GitHub Pages ; `firebase deploy --only firestore:rules,firestore:indexes` pour les règles | Un push sur `main` met le site à jour |

**Points d’attention**

- Vite doit déclarer `base: '/mon-repo/'` pour que les ressources se chargent sur GitHub Pages.
- Activer le fournisseur « Anonyme » dans Firebase Authentication ; l’app se connecte anonymement au premier lancement.
- La clé API Firebase est publique par conception : la restreindre au domaine GitHub Pages dans la console Google Cloud, et activer App Check (optionnel).
- Aucun secret dans le dépôt ; la configuration Firebase passe par des variables injectées au build.
- Règles Firestore à écrire et tester avant tout usage réel :
  - `groups` : `get` autorisé si connecté, `list` interdit, création seulement si l’identifiant respecte le format du code.
  - Sous-collections : lecture et écriture si connecté ; connaître le code fait office de clé d’accès.
  - `claims` : `create` seulement si le document n’existe pas ; `update` et `delete` seulement par le `claimedBy` d’origine ; `beneficiaryId` cohérent avec le souhait.
  - Validation de schéma : types, longueurs maximales (titre 120, description 500, URL 500), URL en http ou https uniquement.

## UX / UI

L’app compte 8 écrans principaux, pensés pour un usage au pouce sur téléphone, avec une navigation de 2 niveaux maximum.

| Écran | Route (hash) | Contenu clé |
| --- | --- | --- |
| Accueil / saisie du code | `/#/` | Grand champ de code, bouton « Entrer », lien « Créer un groupe » |
| Création de groupe | `/#/nouveau` | Nom, ajout rapide de prénoms, code généré avec « Copier / Partager » |
| Qui es-tu ? | `/#/g/:code/qui` | Grille d’avatars (couleur + emoji + prénom) |
| Évènements du groupe | `/#/g/:code` | Cartes d’évènements, bouton « + Évènement », accès à « Membres » et « Mes réservations » |
| Création / édition d’évènement | `/#/g/:code/e/nouveau` | Titre, type, date, deux sélecteurs de membres (bénéficiaires, participants) |
| Évènement | `/#/g/:code/e/:id` | Avatars des bénéficiaires, ma liste en premier, compte à rebours |
| Liste d’une personne | `/#/g/:code/e/:id/l/:memberId` | Souhaits et statuts ; ma liste = mode édition avec bouton flottant « + » |
| Mes réservations | `/#/g/:code/reservations` | Cadeaux regroupés par personne, statut, lien, total estimé |

L’ajout et la modification d’un souhait se font dans une feuille modale (bottom sheet), et la gestion des membres dans un écran dédié `/#/g/:code/membres`.

**Principes**

- Une barre d’identité toujours visible : « Tu es Léa · Changer ».
- Statuts lisibles sans couleur seule : Libre (neutre), Réservé (orange, icône, nombre de personnes), Acheté (vert, coche, nombre de personnes).
- Ton chaleureux et festif sans excès : palette rouge, vert et crème pour Noël, thème neutre pour les autres types ; pas d’animation envahissante.
- États vides qui guident : « Ta liste est vide, ajoute ta première idée ».
- Actions destructrices toujours confirmées, jamais définitives au premier tap.
- Textes courts, tutoiement, vocabulaire du quotidien (« souhait », « prendre », pas « réserver une ressource »).

## Design : Liquid Glass

L’app adopte le langage Liquid Glass d’Apple en version web : du verre translucide uniquement sur la couche des contrôles et de la navigation, au-dessus d’un contenu opaque et lisible.

&#91;embedded content: couches · verre pour les contrôles, contenu opaque, fond\]

Le rendu natif (lumière courbée en temps réel) n’existe pas en CSS : on respecte les principes d’Apple (hiérarchie, sobriété, lisibilité) et on approche le matériau avec `backdrop-filter`.

**Règles de conception**

1. **Deux couches.** Le verre est réservé aux contrôles et à la navigation (barres, bouton flottant, feuilles, sélecteurs) ; Apple demande de ne pas l’utiliser dans la couche de contenu. Les cartes de souhaits, d’évènements et les formulaires restent en surfaces opaques.
2. **Sobriété.** Au plus trois éléments de verre visibles en même temps (barre du haut, barre du bas, bouton « + »), jamais de verre posé sur du verre.
3. **Teinte réservée à l’action principale.** Seuls « + » (ajouter un souhait) et « Réserver » prennent la couleur de l’évènement ; les autres contrôles restent neutres.
4. **Formes concentriques.** Contrôles en capsule, feuilles et cartes à grands rayons (28 px pour une feuille, 20 px pour une carte), rayons emboîtés cohérents avec les coins de l’écran.
5. **Le contenu passe dessous.** La liste défile sous les barres (marges = hauteur des barres + `env(safe-area-inset-*)`), avec un léger dégradé de flou en bord d’écran.
6. **Fond calme mais coloré.** Un dégradé doux (rouge, vert, crème pour Noël ; neutre sinon) donne au verre des couleurs à laisser passer ; pas d’image lourde.
7. **Mouvement discret.** Transitions de 200 à 300 ms avec un léger effet de ressort à l’ouverture des feuilles ; aucun effet lié au gyroscope.

**Trois échelons de rendu** (amélioration progressive)

| Échelon | Rendu | Quand |
| --- | --- | --- |
| 1. Opaque | Fond presque plein, aucune transparence | Navigateur sans `backdrop-filter`, système en « réduire la transparence » ou contraste élevé, réglage Transparence de l’app sur « Réduite » |
| 2. Verre dépoli (défaut) | Flou et saturation du fond, bordure claire, reflet de bord interne | Tous les navigateurs modernes |
| 3. Réfraction (hors MVP) | Courbure du fond sur les bords via un filtre SVG (`feDisplacementMap`) appliqué à `backdrop-filter` | Chromium uniquement, sur un ou deux éléments au plus |

Recette de base des échelons 1 et 2, à centraliser dans `src/styles/glass.css` :

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-solid: rgba(250, 248, 245, 0.96);
  --glass-border: rgba(255, 255, 255, 0.6);
  --glass-highlight: rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg: rgba(28, 30, 38, 0.55);
    --glass-solid: rgba(28, 30, 38, 0.96);
    --glass-border: rgba(255, 255, 255, 0.18);
    --glass-highlight: rgba(255, 255, 255, 0.12);
  }
}

/* échelon 1 : opaque, lisible partout */
.glass { background: var(--glass-solid); }

/* échelon 2 : verre dépoli */
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%); /* valeurs en dur pour Safari */
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  }
}

/* retour à l’opaque : réglages système ou réglage de l’app */
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass { background: var(--glass-solid); backdrop-filter: none; -webkit-backdrop-filter: none; }
}
:root[data-transparency='reduced'] .glass {
  background: var(--glass-solid); backdrop-filter: none; -webkit-backdrop-filter: none;
}
```

**Accessibilité et lisibilité**

- Contraste de texte AA (4,5 pour 1) vérifié sur le pire fond possible, en thème clair et sombre ; libellés sur verre en graisse 600 au minimum.
- Aucun texte de contenu (titres de souhaits, descriptions, prix) directement sur du verre ; les puces de statut (Libre, Réservé, Acheté) sont opaques.
- Réglage « Transparence » dans l’app (Standard ou Réduite), en plus des réglages du système : Apple a annoncé un curseur de transparence pour iOS 27 après un an de plaintes sur la lisibilité, ce qui confirme l’enjeu.
- Respecter `prefers-reduced-transparency`, `prefers-contrast`, `prefers-reduced-motion` et `prefers-color-scheme` ; leur prise en charge reste inégale selon les navigateurs, donc toujours prévoir le repli opaque.
- Performance : `backdrop-filter` sollicite le GPU ; pas de verre dans les listes qui défilent, pas d’animation du flou, test sur un téléphone d’entrée de gamme.

**Composants à créer au lot 0**

| Composant | Rôle | Matériau |
| --- | --- | --- |
| `GlassBar` | Barre du haut : titre, identité « Tu es Léa · Changer » | Verre |
| `GlassTabBar` | Barre flottante du bas en capsule : Évènements, Mes réservations, Membres | Verre |
| `GlassButton` | Bouton standard ou teinté (action principale), dont le « + » flottant | Verre |
| `GlassSheet` | Feuille modale du formulaire de souhait, plus opaque pour garder les champs lisibles | Verre épais (environ 85 % d’opacité) |
| `SegmentedControl` | Choix des bénéficiaires, filtres | Verre, sélection en capsule |
| `Card`, `StatusChip`, `Avatar` | Contenu : souhaits, évènements, statuts | Opaque, jamais de verre |

**Consigne pour Claude Code :** toutes les surfaces de verre passent par la classe `.glass` (variantes `--thick` et `--tint`) ; aucun `backdrop-filter` n’est écrit ailleurs ; chaque écran est vérifié dans trois modes (défaut, transparence réduite, contraste élevé) et deux thèmes (clair, sombre).

Sources : [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials) (couches, sobriété), [TweakTown](https://www.tweaktown.com/news/112090/apple-is-adding-a-liquid-glass-slider-in-ios-27-after-a-year-of-user-complaints-about-readability/index.html) (curseur de transparence d’iOS 27), [recettes CSS 2026](https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026) (échelons, repli, Safari).

## Évolutions proposées

Quatre évolutions de la V1.5 (saisie intelligente, PWA, reprise de liste, budget) apportent le plus pour le moins d’effort ; les autres dépendent d’une décision sur la confidentialité ou d’un petit backend.

| Idée | Ce que ça apporte | Version | Besoin technique |
| --- | --- | --- | --- |
| Saisie intelligente d’un lien | Coller un lien remplit titre, image et prix à partir des balises Open Graph | V1.5 | Petit proxy gratuit (Cloudflare Worker) : le navigateur ne peut pas lire d’autres sites (CORS) |
| PWA installable | Icône sur l’écran d’accueil, ouverture rapide, lecture hors ligne | V1.5 | `vite-plugin-pwa` + persistance hors ligne de Firestore |
| Reprise de liste | Réimporter les souhaits non offerts de l’année précédente | V1.5 | Copie de documents entre évènements |
| Budget indicatif | Total estimé de mes achats, plafond conseillé par personne | V1.5 | Aucun |
| Thèmes par type d’évènement | Ambiance Noël, anniversaire, naissance | V1.5 | Aucun |
| Idées secrètes | Un participant ajoute une idée sur la liste de quelqu’un, invisible du bénéficiaire (pratique pour enfants et grands-parents) | V2 | Collection `ideas` protégée comme `claims` |
| Cadeau groupé | Coordination d’un cadeau partagé : message « on se partage celui-ci », part de chacun, total réuni | V2 | Un champ « part » sur les `claims` par souhait |
| Listes gérées | Un parent gère la liste d’un enfant ou d’un grand-parent sans changer d’identité (au MVP, il prend le profil de l’enfant) | V2 | Champ `managedBy` sur le membre |
| Tirage au sort (Secret Santa) | Chaque participant tire une personne, avec exclusions (couples) | V2 | Résultat visible du seul tireur : même difficulté de confidentialité, idéalement une fonction serveur |
| Rappels et notifications | Rappel avant la date, nouvel évènement, souhait modifié | V2 | PWA + Firebase Cloud Messaging, ou e-mails : backend requis |
| Journal « Reçu » | Après la fête, noter ce qui a été reçu pour les remerciements | V2 | Aucun |
| Rôles d’administration | Seuls les admins suppriment ou modifient les membres | V2 | Identité fiable (niveau 3 de confidentialité) |

Mon conseil de chef de projet : livrer le MVP, le faire tester par une vraie famille pendant un évènement, puis choisir la V1.5 selon les irritants observés plutôt que selon cette liste.

## Plan de réalisation pour Claude Code

Le MVP se construit en 6 lots, chacun terminé par un commit déployable sur GitHub Pages et une définition de « terminé » vérifiable ; compter une à deux sessions Claude Code par lot.

- **Lot 0 · Socle.** Dépôt, Vite + React + TypeScript strict + Tailwind, ESLint/Prettier, routage hash, projet Firebase (offre Spark), Auth anonyme, déploiement GitHub Actions vers Pages, puis tokens de design et composants Liquid Glass de base (voir Design Liquid Glass).
  - Terminé quand : une page d’accueil est en ligne sur l’URL GitHub Pages et lit/écrit un document de test dans Firestore.
- **Lot 1 · Groupe et identité** (A1 à A3, B1, B2). Création de groupe, code, entrée par code ou lien, choix d’identité mémorisé, écran Membres.
  - Terminé quand : un second téléphone entre avec le code et choisit son prénom ; les règles `groups` sont testées dans l’émulateur.
- **Lot 2 · Évènements** (C1 à C3). Accueil, création et édition avec bénéficiaires et participants, préréglages de type.
  - Terminé quand : « Noël 2026 » est créé et n’apparaît qu’aux participants.
- **Lot 3 · Souhaits** (D1 à D4). Page évènement, ma liste, formulaire en feuille modale, édition, suppression logique, tri.
  - Terminé quand : j’ajoute 5 souhaits depuis mon téléphone en moins de 3 minutes et un autre membre les voit en direct.
- **Lot 4 · Réservation et suivi** (E1 à E5). Collection `claims`, statuts, réservations multiples avec avertissement, « Mes réservations », cas limites de suppression et de modification.
  - Terminé quand : deux téléphones réservent le même souhait, chacun voit le prénom de l’autre en touchant le souhait, et la liste du bénéficiaire ne montre aucun indice.
- **Lot 5 · Finitions MVP.** États vides et erreurs, mode hors ligne, accessibilité (transparence réduite, contraste renforcé, mouvement réduit), thème Noël, relecture des textes.
  - Terminé quand : le parcours complet est validé sur un iPhone et un Android.
- **Lot 6 · Durcissement** (optionnel). Niveau 2 de confidentialité, restriction de la clé API au domaine GitHub Pages, App Check, validation de schéma dans les règles.
  - Terminé quand : la suite de tests des règles Firestore est verte dans l’émulateur.

**Pour démarrer dans Claude Code**

- Exporter ce document en Markdown et l’ajouter au dépôt sous `docs/SPEC.md`.
- Créer un `CLAUDE.md` à la racine qui renvoie vers la spec et fixe les conventions : TypeScript strict, composants fonctionnels, aucun secret dans le dépôt, textes en français, petits commits.
- Travailler un lot par session, en commençant en mode plan.

Prompt de départ suggéré :

```text
Lis docs/SPEC.md en entier. Propose un plan détaillé pour le Lot 0, attends mon accord, puis implémente-le.
Ne passe pas au lot suivant sans ma validation. Pose-moi les questions listées dans « Questions ouvertes » avant le Lot 1.
```

## Questions ouvertes

Les dix décisions sont prises, et chaque section du document en tient compte.

- [x] **Niveau de confidentialité** : confiance familiale au MVP, durcissement possible au lot 6. Décision prise.
- [x] **Qui peut supprimer ?** Décision prise : tout membre crée et modifie ; seul le créateur supprime un évènement.
- [x] **Format du code** : 8 caractères (`K7M2-QX4P`) ou mots faciles à dicter (`renne-sapin-42`, moins sûr) ? Décision prise : 8 caractères plus lien partageable.
- [x] **Voir qui a réservé ?** Décision prise : réservations multiples autorisées ; le souhait affiche le nombre de réservations et un tap montre les prénoms, ce qui permet de se coordonner.
- [x] **Enfants et grands-parents** : liste gérée par un parent dès le MVP, ou chacun utilise l’app lui-même ? Décision prise : un parent gère la liste d’un enfant en prenant le profil de l’enfant (« Ce n’est pas moi », puis son prénom) ; pour réserver un cadeau, il repasse sur son propre profil. Pas de mécanisme dédié au MVP, listes gérées dédiées en V2.
- [x] **Cadeau groupé** dès le MVP ? Décision prise : oui, par construction, puisque plusieurs personnes peuvent réserver le même souhait ; le suivi des parts reste en V2.
- [x] **Nom de l’app** : « Derrière la liste ». Décision prise ; logo et icône à définir avant le lot 5.
- [x] **Dépôt public** : GitHub Pages gratuit impose un dépôt public ; il ne contient aucune donnée, mais la configuration Firebase y est visible (normal, sécurisée par les règles). Décision prise : dépôt public accepté.
- [x] **Durée de conservation** : archiver à la main ou purger automatiquement les évènements après un an ? Décision prise : archivage manuel.

* [x] **Fidélité Liquid Glass** : verre dépoli partout, ou réfraction SVG sur un ou deux éléments (Chromium uniquement) ? Décision prise : verre dépoli seul au MVP, réfraction écartée.
