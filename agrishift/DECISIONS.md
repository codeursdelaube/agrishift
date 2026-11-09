# Décisions — Agri Shift Togo (frontend)

Choix faits quand la spécification (`FRONTEND_FIELD_SHIFT.md`) était ambiguë ou ne collait pas au projet existant.

## F1

- **Nom du projet** : « Agri Shift Togo » (et non « Field Shift Togo » comme dans la spec). Thème DaisyUI nommé `agrishift` (+ `agrishift-dark`), clés de stockage préfixées `agrishift.`.
- **Pas de monorepo pnpm** : le projet Next.js `agrishift/` existait déjà ; on travaille dedans avec **npm** (pnpm n'est pas installé). Le moteur (§8) vivra dans `agrishift/engine/` au lieu de `packages/engine/`, toujours en TypeScript pur sans dépendance au DOM, pour pouvoir l'extraire plus tard.
- **Tailwind** : le projet compile Tailwind v4 via le loader `@tailwindcss/turbopack` (déjà configuré dans `next.config.ts`). DaisyUI 5 est chargé avec `@plugin` dans `app/globals.css`.
- **Contraste** : certaines couleurs de la spec ne passaient pas WCAG AA avec du texte blanc. Ajustées : `secondary` `#B5651D` → `#9A5418`, `warning` `#B26A00` → `#8F5600`. Les autres couleurs sont celles de la spec.
- **Photos** : Wikimedia Commons plutôt qu'Unsplash/Pexels, car l'API Commons donne l'auteur et la licence de chaque fichier et propose de vraies photos du Togo. Fichiers WebP dans `public/images/`, crédits dans `lib/images.ts`, `public/images/CREDITS.md` et `/a-propos`. Les pictogrammes restent en SVG.
- **Carte du Togo** (`components/illustrations/TogoMap.tsx`) : contour tracé à partir des coordonnées géographiques de la frontière (projection simple lon/lat), avec les 5 régions (limites simplifiées en bandes) et les villes de référence Kara, Kpalimé, Lomé. Pas de tuiles ni de carte interactive (hors périmètre §17).

## Écrans préparés en avance (F3 partiel)

- **Assistants plein écran** : `/demarrer`, `/parcelles/nouvelle` et `/parcelles/[id]/modifier` sont hors du groupe `(app)` (pas de barre du haut ni du bas) pour garder un seul objectif par écran. Les URL restent celles de la spec.
- **Pages à paramètre** (`/parcelles/[id]`, `/conseil/[plotId]`) : composant client entouré d'un `<Suspense>`, exigé par Next 16 (Cache Components).
- **Préférences d'affichage** (taille du texte, thème, voix) dans `localStorage` et non dans Dexie : elles doivent être appliquées par le script inline avant le premier affichage.
- **« Commencer »** : la page lit un drapeau `agrishift.onboarded` dans `localStorage` pour choisir `/demarrer` ou `/accueil`. En F3, il sera écrit en même temps que `meta.onboarded` dans Dexie.
- **Identifiants des cultures et sols** : confirmés par `API_FRONTEND.docx`.
- **Pages pas encore construites** (`/demarrer`, `/accueil`…) : `app/not-found.tsx` affiche « Cette page arrive bientôt » avec un retour à l'accueil (jamais d'écran blanc).

## Intégration de l'API (`API_FRONTEND.docx`)

- **Moteur** : `engine/` applique le §4 de la doc. `/simulate` et `/rotation/*` ne sont pas appelés : le calcul reste sur le téléphone. `golden_cases.json` n'étant pas fourni, `engine/__fixtures__/api-cases.json` contient de vraies réponses de production, rejouées par Vitest.
- **Messages** : création et suppression passent par `/sync/push` (en ligne comme hors ligne), au lieu de `POST`/`DELETE /posts`. Un seul chemin, et rien ne se perd si le réseau coupe.
- **Champs locaux** : `previous_crop_id` et `soil_assumed` n'existent pas côté API. Ils restent sur le téléphone et sont conservés à chaque synchro. La dernière saison déclarée a priorité sur `previous_crop_id` pour le conseil.
- **Graphiques** : SVG maison plutôt que Recharts, pour rester léger sur les téléphones d'entrée de gamme. Pas de Framer Motion : animations CSS sur `opacity` et `transform`.
- **Service worker** : `public/sw.js` écrit à la main (Serwist n'est pas installé), actif seulement en production. Les pages d'un champ ne sont gardées hors ligne qu'une fois visitées en ligne ou signalées par l'application.
- **CORS** : seule l'origine `http://localhost:3000` est autorisée. Toute autre origine (production, test sur téléphone) doit être ajoutée à `FRONTEND_ORIGIN` côté backend.
