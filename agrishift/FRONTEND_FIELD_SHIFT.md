# Field Shift Togo — Spécification frontend (PWA Next.js offline-first)

> Document destiné au développeur frontend et à son agent de code (Claude Opus 5.5).
> Il complète `BACKEND_FIELD_SHIFT.md` : **le format du paquet de zone, les endpoints et `golden_cases.json` viennent du backend et ne doivent pas être modifiés ici.**

---

## 0. PROMPT À COPIER DANS OPUS 5.5

```
Tu es un ingénieur frontend senior. Tu vas construire le frontend complet de "Field Shift Togo",
une PWA mobile-first et offline-first pour les producteurs agricoles du Togo
(NASA Space Apps 2026, défi "Field Shift: Adapting Farms with NASA Data").

Le fichier FRONTEND_FIELD_SHIFT.md joint est ta spécification. Règles :
1. Lis TOUT le document avant d'écrire du code. Implémente dans l'ordre des phases (§16).
   À la fin de chaque phase : lint + tests verts, puis résumé court de ce qui est fait.
2. Le contrat avec le backend (types du paquet §6, endpoints §7, golden_cases.json §8.6)
   est fixe. Si le backend n'est pas encore disponible, utilise les fixtures (§6.3) et
   le mode mock (§7.3) sans changer les types.
3. Public cible : des producteurs de tout âge, parfois peu à l'aise avec la lecture ou les
   smartphones, sur des Android d'entrée de gamme, souvent sans internet. Chaque écran doit
   être compréhensible en 5 secondes : un seul objectif par écran, gros boutons, pictogrammes
   + texte court, français simple. Respecte strictement §3 (accessibilité).
4. L'app doit fonctionner en MODE AVION après la première visite : app, paquets de zone,
   parcelles, conseils, simulations. Aucun calcul de conseil ne dépend du réseau.
5. N'invente jamais de données présentées comme réelles. Affiche toujours la provenance
   (badges §9.4). Un scénario n'est jamais une prévision ; un score n'est jamais un rendement.
6. Images du landing : télécharge des photos libres de droits (§12) dans public/images/,
   optimise-les en WebP, et crédite-les. Si tu n'as pas d'accès réseau, crée des
   illustrations SVG à la place. Ne jamais utiliser le logo officiel de la NASA.
7. Si un point est ambigu, choisis la solution la plus simple pour l'utilisateur final,
   note-la dans apps/web/DECISIONS.md et continue.
8. Code et identifiants en anglais ; tous les textes de l'interface en français
   (centralisés dans un fichier de traduction, §11).
Commence par la phase F1.
```

---

## 1. Le projet en 1 minute

- **Problème** : les producteurs togolais doivent adapter leurs cultures au changement climatique, souvent sans internet.
- **Ce que fait l'app** :
  1. **« Que planter ? »** : propose les 3 meilleures rotations de cultures sur 2 à 4 saisons pour une parcelle ;
  2. **« Et si… ? »** : montre comment ces choix tiennent si la pluie baisse ou si la chaleur monte, et **explique pourquoi** (« manque d'eau pendant la floraison ») ;
  3. donne la **météo** (prévision en ligne, normales NASA hors-ligne), la **situation de la région** et un **espace d'échange** entre producteurs.
- **Données** : NASA POWER, résumées par le backend en **paquets JSON par zone**. Le téléphone garde ces paquets et **calcule tout localement**.
- **Zones pilotes** : Maritime (Lomé), Plateaux (Kpalimé), Kara. **Cultures** : maïs, sorgho, riz, arachide, niébé.

---

## 2. Stack

| Élément | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict | stack de l'équipe |
| UI | Tailwind CSS v4 + DaisyUI 5 (thème personnalisé `fieldshift`) | composants rapides et accessibles |
| Icônes | Lucide React + pictogrammes cultures/sols en SVG maison | Lucide n'a pas de maïs, niébé… |
| Animations | Framer Motion, **légères** et désactivées si `prefers-reduced-motion` | téléphones modestes |
| Offline | Serwist (`@serwist/next`) | service worker pour App Router |
| Stockage local | Dexie (IndexedDB) + `dexie-react-hooks` | données structurées hors-ligne |
| Validation | Zod (schéma du paquet) | refuser un paquet corrompu |
| Graphiques | Recharts (barres/courbes simples) | suffisant, déjà connu |
| Moteur | `packages/engine` (TypeScript pur) | calcul hors-ligne, testé contre le golden du backend |
| Tests | Vitest (moteur, utilitaires) + Playwright (parcours, mode avion) | |
| Gestion | pnpm workspaces | monorepo `apps/web`, `packages/engine`, `apps/api` |

Note Serwist : si `@serwist/next` n'est pas compatible avec Turbopack en Next 16, builder avec `next build --webpack` et le noter dans `DECISIONS.md`.

---

## 3. Accessibilité et simplicité (exigences, pas des options)

Public : producteurs de **tout âge**, niveaux de lecture variés, écrans petits, soleil, doigts larges.

**Lecture**
- Police **Atkinson Hyperlegible** (conçue pour la lisibilité), via `next/font` (auto-hébergée → disponible hors-ligne).
- Taille de base **18 px**, titres ≥ 24 px. Réglage **A / A+ / A++** dans Paramètres (multiplie la base : 1 / 1.15 / 1.3), mémorisé.
- Phrases ≤ 12 mots, vocabulaire simple, pas de jargon (« ETP », « WRSI », « décade » ne s'affichent jamais tels quels). Exemples : « Eau disponible pour la plante », « Début juillet ».
- Nombres arrondis (pas de décimales inutiles), unités expliquées (« 45 mm de pluie = environ 4 seaux sur 1 m² » en aide).

**Interaction**
- Cibles tactiles **≥ 48 × 48 px**, espacées de 8 px minimum.
- **Un objectif principal par écran**, un gros bouton d'action en bas, accessible au pouce.
- Saisies par **cartes à pictogrammes** plutôt que par champs texte. Le clavier n'est demandé que pour le nom (facultatif) et les messages.
- Assistants pas à pas (1 question par écran) avec barre de progression et bouton « Retour » toujours visible.
- Pas d'action uniquement par geste (swipe, appui long).
- Confirmation avant toute suppression ; possibilité d'annuler (toast « Annuler » 5 s).

**Vision**
- Contraste **WCAG AA minimum** (AAA pour le texte principal). Thème **clair par défaut** (lecture au soleil) ; thème sombre disponible.
- La couleur ne porte jamais seule le sens : risque = couleur + icône + mot (✔ Bon / ⚠ Attention / ✖ Risqué).
- Icônes toujours accompagnées d'un libellé.

**Écoute**
- Bouton **« Écouter »** (icône haut-parleur) sur les résultats et explications : `speechSynthesis` en `fr-FR`. Masqué si l'API ou une voix française est indisponible.
- Préparer l'i18n pour l'éwé et le kabiyè (pas de traduction maintenant).

**Technique**
- Cible : Android d'entrée de gamme, Chrome ≥ 90, écran **360 × 640**. Tester aussi 320 px de large.
- JS initial de la page app < 200 Ko gzip ; images landing < 150 Ko chacune.
- Lighthouse : Accessibilité ≥ 95, PWA installable, Performance ≥ 85 (mobile).
- Navigation clavier et lecteur d'écran corrects (`aria-label`, ordre de focus, `lang="fr"`).

---

## 4. Direction visuelle

- **Ambiance** : terre, végétal, eau. Chaleureuse, rassurante, pas « tableau de bord technique ».
- **Thème DaisyUI `fieldshift`** (à ajuster pour le contraste) :
  - `primary` vert feuille `#2F7D32` ; `secondary` ocre/terre `#B5651D` ; `accent` bleu eau `#1E6FA8`
  - `base-100` `#FFFDF7` (crème) ; `base-content` `#1F2421`
  - `success` `#2E7D32`, `warning` `#B26A00`, `error` `#B3261E`
- Coins arrondis généreux, cartes avec ombre douce, beaucoup d'espace.
- **Pictogrammes SVG maison** (`components/icons/`), style trait épais, lisible à 40 px :
  - cultures : maïs, sorgho, riz, arachide, niébé ;
  - sols : sableux, sablo-limoneux, limoneux, argileux ;
  - scénarios : soleil, nuage + goutte barrée, thermomètre ;
  - priorités : bol (nourrir la famille), goutte/bouclier (résister à la sécheresse), balance (équilibre).
- Composant `RiskBadge` : vert ✔ « Bon », orange ⚠ « Attention », rouge ✖ « Risqué ».

---

## 5. Architecture de l'app

```
field-shift/
├─ apps/web/
│  ├─ app/
│  │  ├─ layout.tsx                 # lang="fr", police, thème, providers
│  │  ├─ page.tsx                   # landing (statique)
│  │  ├─ a-propos/page.tsx          # sources, méthode, crédits, avertissements
│  │  ├─ demarrer/page.tsx          # onboarding (assistant)
│  │  ├─ (app)/layout.tsx           # coque : barre du haut + navigation du bas
│  │  ├─ (app)/accueil/page.tsx     # Mon champ (page personnelle)
│  │  ├─ (app)/parcelles/nouvelle/page.tsx
│  │  ├─ (app)/parcelles/[id]/page.tsx
│  │  ├─ (app)/conseil/page.tsx     # choisir une parcelle → Que planter ?
│  │  ├─ (app)/conseil/[plotId]/page.tsx          # Top 3 + scénarios
│  │  ├─ (app)/conseil/[plotId]/detail/page.tsx   # détail d'une rotation (?seq=…)
│  │  ├─ (app)/meteo/page.tsx
│  │  ├─ (app)/region/page.tsx      # page générale
│  │  ├─ (app)/echanges/page.tsx    # plateforme
│  │  ├─ (app)/parametres/page.tsx
│  │  ├─ manifest.ts
│  │  └─ sw.ts                      # Serwist
│  ├─ components/ ui/ icons/ charts/ wizard/ badges/
│  ├─ lib/
│  │  ├─ db.ts            # Dexie
│  │  ├─ api.ts           # client HTTP typé + mode mock
│  │  ├─ packs.ts         # téléchargement/validation/cache des paquets
│  │  ├─ sync.ts          # outbox + pull
│  │  ├─ engine.ts        # pont vers packages/engine (mémo)
│  │  ├─ speech.ts        # lecture vocale
│  │  ├─ dekad.ts         # décade ↔ libellé lisible
│  │  └─ i18n/fr.ts       # TOUS les textes de l'interface
│  ├─ fixtures/           # paquets mock + profils de démo
│  ├─ public/ images/ icons/ packs/ (copie de secours des paquets)
│  ├─ tests/e2e/
│  └─ DECISIONS.md
└─ packages/engine/       # moteur TS pur + tests golden
```

**Flux de données**
```
Backend /packs ──► lib/packs.ts (Zod) ──► Dexie.packs ──► engine (calcul local) ──► écrans
                                           Dexie.plots/seasons/posts ◄──► lib/sync.ts ◄──► /sync
Service worker : met en cache l'app, les polices, les images et /packs/*
```

---

## 6. Contrat de données (types TypeScript)

### 6.1 Schéma Zod du paquet (`packages/engine/src/types.ts`)
Reproduire exactement le format `ZonePack` du backend (§7 de `BACKEND_FIELD_SHIFT.md`). Résumé :

```ts
type SourceType = "nasa_power" | "public_historical_reanalysis" | "provisional_demo"
                | "synthetic_demo" | "synthetic_scenario" | "computed";

interface ZonePack {
  schema_version: 1;
  pack_version: string;            // "2026.11.05-1"
  generated_at: string;
  zone: {
    zone_id: string; name_fr: string; region: string;
    latitude: number; longitude: number; elevation_m: number | null;
    seasons: { season_id: string; label_fr: string; sowing_dekad: number;
               sowing_source: SourceType; provisional_sowing_dekad: number;
               onset_dekad_clim: number | null }[];
    coordinate_note: string;
  };
  climate: {
    source_type: SourceType; source_name: string; baseline_period: string;
    units: Record<string, string>;
    dekads: { dekad: number; label_fr: string; p_mm: number | null; p_p20: number | null;
              p_cv: number | null; et0_mm: number | null; tmean_c: number | null }[]; // 36
    trend: { baseline_period: string; recent_period: string;
             p_change_pct: number | null; t_change_c: number | null; note_fr: string };
    warnings_fr: string[];
  };
  crops: Crop[]; soils: Soil[]; rules: Rule[]; scenarios: Scenario[]; scoring: Scoring;
  data_provenance: { item: string; source_type: SourceType }[];
}

interface Crop { crop_id: string; name_fr: string; family: string; n_fixing: boolean;
  cycle_days: number; water_need: string; drought_tolerance: string; food_staple: boolean;
  kc_ini: number; kc_mid: number; kc_end: number; root_depth_m: number; depletion_p: number;
  phases: { initial: number; development: number; mid: number; late: number };
  source_type: SourceType; source_note?: string }
interface Soil { soil_id: string; label_fr: string; taw_mm_per_m: number; source_type: SourceType }
interface Rule { rule_id: string; effect: "bonus" | "penalty"; delta: number;
  all: { field: string; op: "eq"|"neq"|"lt"|"lte"|"gt"|"gte"|"in"|"eq_field"; value: unknown }[];
  explanation_fr: string; source_type: SourceType }
interface Scenario { scenario_id: string; label_fr: string; rainfall_change_pct: number;
  temperature_change_c: number; source_type: SourceType; note_fr: string }
interface Scoring { season_resilience_base: Record<Priority, number>;
  priority_bonus: Record<Priority, { food_staple: number; drought_level_factor: number }>;
  drought_levels: Record<string, number>; phase_weights: Record<Phase, number>;
  et0_temp_sensitivity_per_c: number; initial_soil_water_fraction: number;
  horizon_default: number; horizon_max: number; top_n: number; source_type: SourceType }
type Priority = "food_security" | "drought_resilience" | "balanced";
type Phase = "initial" | "development" | "mid" | "late";
```

Exporter aussi `zonePackSchema` (Zod) ; un paquet invalide est **rejeté** et l'ancien est conservé.

### 6.2 Entités locales (Dexie, `lib/db.ts`)
```ts
meta:        "&key"                         // apiCursor, deviceId, deviceToken, onboarded, textScale, voiceOn…
packs:       "&zone_id, pack_version"       // { zone_id, pack_version, sha256, data: ZonePack, fetched_at }
profile:     "&id"                          // { id:"me", display_name?, zone_id, priority }
plots:       "&id, zone_id, updated_at"     // { id(uuid), zone_id, name, area_ha, soil_id, updated_at, deleted, sync_state }
plotSeasons: "&id, plot_id, updated_at"     // { id, plot_id, season_label, crop_id, sowing_date?, yield_note?, losses_note?, updated_at, deleted, sync_state }
posts:       "&id, zone_id, updated_at, is_mine" // { id, zone_id, body, author_name?, updated_at, deleted, is_mine, sync_state }
outbox:      "++seq, entity, created_at"    // { entity:"plots"|"plot_seasons"|"posts", row, created_at, attempts }
forecast:    "&zone_id"                     // { zone_id, fetched_at, data }
regionSummary:"&zone_id"                    // { zone_id, fetched_at, data }
```
`sync_state` : `"pending" | "synced" | "rejected"`. IDs = `crypto.randomUUID()`. `updated_at` = ISO à chaque modification.

### 6.3 Fixtures (avant que le backend soit prêt)
- `fixtures/packs/{maritime_lome,plateaux_kpalime,kara_kara}.json` : paquets **conformes au schéma**, climat **synthétique** plausible (Kara : une saison des pluies juin–sept. ; Maritime/Plateaux : deux saisons avril–juil. et sept.–nov.), `source_type: "synthetic_demo"` partout.
- Cultures, sols, règles, scénarios, scoring : copier les valeurs du backend (§8 de `BACKEND_FIELD_SHIFT.md`).
- `fixtures/demo-profiles.json` : 3 profils (Kara, Plateaux, Maritime) avec 1 à 2 parcelles et un historique, marqués `synthetic_demo`.
- Dès que le backend fournit les vrais paquets, ils remplacent les fixtures sans autre changement.

---

## 7. Communication avec le backend

### 7.1 Endpoints consommés (`NEXT_PUBLIC_API_URL` + `/api/v1`)
| Usage | Route |
|---|---|
| État | `GET /health` |
| Zones | `GET /zones` |
| Paquets | `GET /packs/manifest`, `GET /packs/{zone_id}` (ETag / `If-None-Match` → 304) |
| Identité | `POST /devices/register`, `PATCH /devices/me` (en-tête `X-Device-Token`) |
| Sync | `POST /sync/push`, `GET /sync/pull?since=` |
| Région | `GET /zones/{zone_id}/summary` |
| Échanges | `GET /posts?zone_id=&before=&limit=`, `POST /posts`, `DELETE /posts/{id}` |
| Moteur en ligne (secours) | `POST /simulate`, `POST /rotation/recommend`, `POST /rotation/compare-scenarios` |

Erreurs backend : `{ error: { code, message_fr } }` → afficher `message_fr` dans un toast simple.

### 7.2 Client (`lib/api.ts`)
- `fetch` avec timeout 10 s, 1 retry, types issus de §6.
- Ne jamais bloquer l'interface sur un appel réseau : l'écran s'affiche avec les données locales, puis se met à jour.

### 7.3 Mode mock
`NEXT_PUBLIC_API_MODE=mock|live`. En `mock`, `lib/api.ts` sert les fixtures (paquets depuis `public/packs/`, résumés de région générés depuis les profils de démo, posts fictifs étiquetés).

### 7.4 Paquets (`lib/packs.ts`)
1. Au démarrage et au retour du réseau : `GET /packs/manifest`.
2. Pour la zone de l'utilisateur (et les 2 autres en arrière-plan) : si `sha256` différent du local → télécharger, valider (Zod), vérifier le hash (Web Crypto, JSON canonique : clés triées), enregistrer dans Dexie.
3. Si aucun paquet en local et pas de réseau → utiliser `public/packs/{zone}.json` (précaché par le service worker).
4. Exposer `usePack(zoneId)` (hook Dexie live).

### 7.5 Synchronisation (`lib/sync.ts`)
- **Le local fait foi** : chaque création/modification écrit d'abord dans Dexie **et** ajoute une entrée dans `outbox`.
- Déclencheurs : démarrage, événement `online`, toutes les 5 min si l'onglet est visible, bouton « Synchroniser ».
- Étapes : (a) `register` si pas de token ; (b) `push` de l'outbox par lots de 100 → retirer les entrées acceptées, marquer `rejected` les refusées (afficher la raison) ; (c) `pull?since=cursor` → upsert local si `updated_at` distant plus récent ; (d) enregistrer `server_time` comme nouveau curseur.
- Backoff exponentiel (max 5 min) en cas d'échec.
- **Indicateur permanent** dans la barre du haut : `● Hors ligne` / `⟳ Envoi…` / `✔ À jour (il y a 3 min)` / `3 en attente`.

### 7.6 Prévisions météo (en ligne uniquement)
- `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=Africa/Lome&forecast_days=7`
- Mettre la dernière réponse dans `Dexie.forecast`. Toujours afficher la source (« Prévision Open-Meteo ») et l'heure de mise à jour. **Ce n'est pas une donnée NASA** : ne jamais l'étiqueter comme telle.

---

## 8. Moteur TypeScript (`packages/engine`)

Fonctions **pures et déterministes**, sans DOM ni réseau. Doivent produire **exactement** les mêmes résultats que le moteur Python du backend.

### 8.1 Décades
- Index 1..36 (`(mois−1)×3 + d`, D1 = jours 1–10, D2 = 11–20, D3 = 21–fin), qui **bouclent** (après 36 → 1).
- `n = ceil(cycle_days / 10)` décades par cycle.
- Phase de la décade `i` (0-indexée) : `f = (i + 0.5) / n` comparée aux bornes cumulées de `phases`.
- `dekadLabelFr(d)` pour l'UI simple : D1 → « début », D2 → « mi- », D3 → « fin » + mois (« début juillet », « mi-août », « fin septembre »).

### 8.2 Kc par décade
`initial` : `kc_ini` ; `development` : linéaire `kc_ini → kc_mid` ; `mid` : `kc_mid` ; `late` : linéaire `kc_mid → kc_end` (position = avancement dans la phase, calculé avec le même `f`).

### 8.3 `simulate(pack, cropId, soilId, scenarioId, sowingDekad)`
```
TAW   = soil.taw_mm_per_m × crop.root_depth_m
SW    = scoring.initial_soil_water_fraction × TAW
seuil = (1 − crop.depletion_p) × TAW
pour i de 0 à n−1 (d = décade bouclée sowingDekad + i) :
  P    = climate[d].p_mm × (1 + rainfall_change_pct / 100)
  ETc  = Kc(i) × climate[d].et0_mm × (1 + et0_temp_sensitivity_per_c × temperature_change_c)
  Ks   = SW ≥ seuil ? 1 : clamp(SW / seuil, 0, 1)
  ETa  = Ks × ETc
  SW   = clamp(SW + P − ETa, 0, TAW)
  stress_i = 1 − Ks
stress_index = Σ(phase_weights[phase_i] × stress_i) / Σ(phase_weights[phase_i])
wrsi         = 100 × ΣETa / ΣETc
critical_periods = suites de décades consécutives avec stress > 0.2
```
Sortie : même structure que `SimulationResult` du backend (`dekads[]`, `stress_index`, `wrsi`, `critical_periods`, `explanations_fr`, `assumptions_fr`, `source_type`, `data_provenance`, `disclaimer_fr`). Arrondir à 2 décimales **uniquement** dans la sortie.

### 8.4 Règles (`evaluateRules(prev, next, scenario, rules)`)
- Contexte `{ prev, next, scenario }`, accès par chemin (`"next.water_need"`).
- Opérateurs : `eq, neq, lt, lte, gt, gte, in, eq_field` ; `all` = ET. Si `prev` est absent, toute condition sur `prev.*` est fausse.
- **Interdit** : `eval`, `new Function`.

### 8.5 `recommend(pack, plot, priority, scenarioId, horizon)`
1. Saison `k` → `zone.seasons[k % seasons.length]`.
2. Générer toutes les séquences (5^horizon) ; mémoïser `simulate` par `(crop, soil, scenario, sowingDekad)`.
3. Par saison : `rule_pts` (Σ delta) + `resilience_pts = season_resilience_base[priority] × (1 − stress_index)` + `priority_pts = bonus.food_staple × [food_staple] + bonus.drought_level_factor × drought_levels[drought_tolerance]`.
4. `total_score = Σ`. Tri : score ↓, puis stress moyen ↑, puis séquence alphabétique.
5. Retourner `top_n` avec détail par saison, règles déclenchées, résumé de simulation, provenance, `disclaimer_fr`.

`compareScenarios(pack, plot, priority, scenarioIds, horizon)` : `recommend` pour chaque scénario.

### 8.6 Tests
- `golden_cases.json` (fourni par le backend, copié dans `packages/engine/test/`) : chaque cas doit être reproduit (tolérance 0,01 ; ordre du classement et `rule_id` identiques).
- Tant que le golden n'existe pas : tests V001–V003 (voir backend §9.7), monotonie (plus sec ⇒ stress ≥), bornes, déterminisme.
- Performance : `recommend` horizon 4 < 50 ms sur un téléphone d'entrée de gamme (sinon passer le calcul dans un Web Worker).

### 8.7 Traduction des résultats pour l'UI (`lib/engine.ts`)
| Valeur moteur | Ce que voit l'utilisateur |
|---|---|
| `stress_index < 0.15` | ✔ **Bon** (vert) |
| `0.15 ≤ stress_index < 0.35` | ⚠ **Attention** (orange) |
| `stress_index ≥ 0.35` | ✖ **Risqué** (rouge) |
| `wrsi` | « La plante reçoit **78 %** de l'eau dont elle a besoin » + jauge goutte |
| `critical_periods` | « Manque d'eau **mi-août → fin août**, pendant la **floraison** » |
| `total_score` | Classement 1er / 2e / 3e (le score brut n'est affiché que dans « Détails ») |
| phase `initial/development/mid/late` | levée / croissance / floraison / maturation |

---

## 9. Écrans et parcours

### 9.1 Navigation
- **Barre du haut** : nom de la zone, indicateur de synchro (§7.5), bouton Paramètres.
- **Barre du bas** (5 onglets, icône + libellé, onglet actif très visible) :
  `Accueil` (maison) · `Que planter ?` (pousse) · `Météo` (nuage-soleil) · `Ma région` (carte) · `Échanges` (bulles).

### 9.2 Landing `/` (statique, précachée)
Public : producteurs, partenaires, jury. Mobile-first, une colonne, puis 2 colonnes ≥ 768 px.
1. **Hero** : photo plein cadre (champ/producteur ouest-africain) + titre « Choisissez vos cultures avec le climat de demain » + sous-titre « Conseils simples, données NASA, même sans internet » + bouton **« Commencer »** (→ `/demarrer`, ou `/accueil` si déjà configuré) + bouton secondaire « Installer l'application » (événement `beforeinstallprompt` ; sur iOS, petite aide « Partager → Sur l'écran d'accueil »).
2. **3 bénéfices** (pictogramme + 1 phrase) : « Que planter cette saison ? » · « Et si la pluie baisse ? » · « Marche sans internet ».
3. **Comment ça marche** en 3 étapes illustrées : choisissez votre région → décrivez votre champ → recevez 3 propositions expliquées.
4. **Données** : « Basé sur 30 ans de données climatiques NASA POWER pour votre région » + mention honnête : « Aide à la réflexion, pas une garantie de récolte ».
5. **Pour qui** : producteurs, coopératives, conseillers agricoles.
6. Pied de page : À propos & sources, crédits photos, « Projet NASA Space Apps Challenge 2026 — équipe Field Shift Togo ». **Pas de logo NASA.**

### 9.3 Onboarding `/demarrer` (assistant, 1 question par écran)
1. **Votre région** : 3 grandes cartes (Maritime, Plateaux, Kara) avec mini-carte schématique du Togo en SVG mettant la zone en évidence + bouton « Me localiser » (géolocalisation → zone la plus proche ; refusée → choix manuel).
2. **Votre prénom** (facultatif, bouton « Passer »).
3. **Ce qui compte le plus pour vous** : 3 cartes illustrées → « Nourrir ma famille » (`food_security`), « Résister à la sécheresse » (`drought_resilience`), « Un peu des deux » (`balanced`).
4. **Prêt** : téléchargement du paquet de zone avec message « Préparation pour une utilisation sans internet… » + barre de progression ; si hors-ligne : paquet de secours.
→ redirection vers `/parcelles/nouvelle` (« Ajoutons votre premier champ »).

### 9.4 Accueil `/accueil` (page personnelle)
- Salutation + phrase de saison : « À Kara, la saison des pluies commence d'habitude **début juin** ».
- Carte **« Que planter ? »** (action principale, grande, colorée).
- **Mes champs** : cartes (nom, taille, sol, dernière culture en pictogramme, badge du conseil courant). Bouton « + Ajouter un champ ».
- Carte météo compacte (aujourd'hui + demain si disponible, sinon normale de la période).
- Badges de provenance quand le paquet est `synthetic_demo` : bandeau « DONNÉES DE DÉMONSTRATION — TEST UNIQUEMENT ».

### 9.5 Ajouter / modifier un champ (`/parcelles/nouvelle`, `/parcelles/[id]`)
Assistant :
1. **Nom** (pré-rempli « Champ 1 »).
2. **Taille** : 3 cartes « Petit (moins d'½ ha) », « Moyen (½ à 2 ha) », « Grand (plus de 2 ha) » + lien « Je connais la surface exacte » (champ numérique).
3. **Type de sol** : 4 cartes avec pictogramme **et test au toucher** :
   - Sableux : « La terre coule entre les doigts »
   - Sablo-limoneux : « Elle forme une boule qui s'effrite »
   - Limoneux : « Douce, comme de la farine »
   - Argileux : « Collante, forme un boudin »
   + « Je ne sais pas » → `sandy_loam` par défaut, signalé comme supposition.
4. **Culture de la dernière saison** : grille de pictogrammes + « Rien / jachère » + « Je ne sais pas » (→ `previous_crop_id = null`).
5. Récapitulatif + « Enregistrer ».
Page détail : historique des saisons (ajout : saison, culture, remarque sur la récolte/les pertes), modifier, supprimer (confirmation + annuler).

### 9.6 Que planter ? (`/conseil` → `/conseil/[plotId]`)
- Si plusieurs champs : choisir le champ (cartes). Si un seul : y aller directement.
- **Sélecteur « Et si… ? »** (puces avec pictogrammes, une seule active) :
  « Année normale » (`baseline`) · « Moins de pluie » (`dry_minus20`) · « Plus chaud » (`hot_plus2`) · « Moins de pluie et plus chaud » (`dry_hot`). Lien « Plus de choix » → −10 %, −30 %, +1 °C.
  Toujours accompagné de : « Scénario imaginé pour tester, ce n'est pas une prévision. »
- **Horizon** : « Sur 2 / 3 / 4 saisons » (défaut 3).
- **Top 3** : cartes classées. Chaque carte :
  - frise de pictogrammes : `Saison 1 → Saison 2 → Saison 3` avec nom de saison (« Grande saison 2027 ») ;
  - un `RiskBadge` par saison ;
  - 1 phrase de résumé (première explication la plus importante) ;
  - boutons « Pourquoi ? » (dépliant : règles déclenchées + explications de stress, en phrases simples) et « Écouter » ;
  - lien « Voir le détail ».
- **Comparer** : petit tableau « cette proposition selon le scénario » (Normal / Moins de pluie / Plus chaud / Les deux) avec RiskBadge — calculé via `compareScenarios`.
- Rappel permanent en bas : « Score de comparaison, pas une estimation de récolte. Valeurs agronomiques provisoires. »

### 9.7 Détail d'une rotation (`/conseil/[plotId]/detail?seq=maize,cowpea,sorghum&scenario=…`)
Pour chaque saison :
- Graphique simple (Recharts) par période de 10 jours : barres « Pluie » (bleu) + ligne « Besoin de la plante » (vert) + zone ombrée sur les périodes critiques. Axe X avec libellés lisibles (« début juil. »). Légende en mots.
- Encadré « Ce qu'il faut retenir » (explications_fr), jauge d'eau (wrsi), phases de la culture (levée → croissance → floraison → maturation) sur une frise.
- Section repliée « Hypothèses et sources » (assumptions_fr, provenance, période des données).

### 9.8 Météo `/meteo`
- **En ligne** : prévision 7 jours (cartes jour : icône, pluie en mm + probabilité, min/max). Source + heure.
- **Hors ligne** : dernière prévision enregistrée avec « Mise à jour il y a 2 jours » bien visible, ou rien si trop ancienne (> 3 jours).
- Toujours disponible (depuis le paquet) : **« D'habitude à cette période »** : pluie normale de la décade en cours et des 2 suivantes, température moyenne. Source « NASA POWER, moyenne 1991–2020 ».
- Carte **tendance** : « Ces 10 dernières années, il a plu environ 6 % de moins qu'avant à Kara » (constat historique, pas prévision).

### 9.9 Ma région `/region` (page générale)
- Graphique pluie normale par mois (somme des décades), mise en évidence des mois de saison.
- Tendance pluie/température.
- « Ce que cultivent les producteurs de la région » (agrégats anonymes du backend ; masqué hors-ligne si jamais chargé, sinon dernière version avec date).
- 3 derniers messages de la région + lien vers Échanges.

### 9.10 Échanges `/echanges` (plateforme)
- Fil des messages de la zone (auteur = prénom ou « Producteur de Kara », date relative).
- Bouton flottant « Écrire » → zone de texte (≤ 1000 caractères, compteur) + « Envoyer ».
- Hors-ligne : le message apparaît tout de suite avec « En attente d'envoi » ; envoyé à la prochaine synchro.
- Suppression de ses propres messages (confirmation).
- Petit rappel : « Ne partagez pas d'informations personnelles (téléphone, adresse) ».

### 9.11 Paramètres `/parametres`
Taille du texte (A / A+ / A++) · Lecture vocale (on/off) · Thème clair/sombre · Ma région / ma priorité · Synchronisation (état, bouton, éléments en attente) · Données hors-ligne (paquets présents, version, date) · **Mode démo** (charger un des 3 profils de démonstration — pour le pitch) · Effacer mes données (double confirmation) · À propos & sources.

### 9.12 À propos `/a-propos`
Méthode en mots simples, sources de données (NASA POWER, Open-Meteo pour la prévision), période, limites (« réanalyse sur une maille d'environ 50 km », valeurs provisoires), crédits photos, mention du travail préparatoire du hackathon.

### 9.13 États obligatoires sur chaque écran
Chargement (squelettes, pas de spinner seul) · vide (illustration + action) · hors-ligne · erreur (phrase simple + « Réessayer »). Jamais d'écran blanc.

---

## 10. PWA et hors-ligne

- `app/manifest.ts` : `name` « Field Shift Togo », `short_name` « Field Shift », `start_url` `/accueil`, `display` `standalone`, `orientation` `portrait`, `lang` `fr`, `theme_color` = primary, `background_color` = base-100, icônes 192/512 + `maskable`.
- **Précache** : coque de l'app, toutes les routes de `(app)`, landing, `/a-propos`, polices, pictogrammes, images landing, `public/packs/*`.
- **Runtime** :
  - `/api/v1/packs/*` : StaleWhileRevalidate ;
  - prévisions Open-Meteo : NetworkFirst (timeout 5 s) puis cache ;
  - autres `/api/v1/*` : NetworkOnly (les données passent par Dexie, pas par le cache HTTP).
- Page de secours hors-ligne pour toute route non précachée.
- Mise à jour du service worker : bandeau « Nouvelle version disponible — Mettre à jour ».
- Demander `navigator.storage.persist()` après l'onboarding (évite l'effacement des données).

---

## 11. Textes de l'interface

- Tous dans `lib/i18n/fr.ts` (clé → texte), aucune chaîne en dur dans les composants.
- Ton : tutoiement **non**, vouvoiement simple et chaleureux. Phrases courtes, verbes d'action (« Ajouter mon champ », « Voir pourquoi »).
- Préparer `ee.ts` (éwé) et `kbp.ts` (kabiyè) vides avec repli sur le français.

---

## 12. Images (landing et illustrations)

- **Où les prendre** (licence libre, usage commercial autorisé, sans attribution obligatoire mais créditer quand même) : Unsplash, Pexels. Recherches suggérées : « African farmer field », « West Africa maize field », « Togo agriculture », « farmer smartphone Africa », « sorghum field », « rain clouds field Africa ».
- **Choix** : agriculture d'Afrique de l'Ouest réaliste, producteurs et productrices d'âges variés, lumière naturelle. Éviter les clichés misérabilistes et les personnes célèbres.
- **Traitement** : télécharger dans `apps/web/public/images/landing/`, convertir en **WebP** (largeur 1200 px pour le hero, 800 px pour les autres), qualité ~75, **< 150 Ko** chacune ; utiliser `next/image` avec `alt` descriptif en français et `priority` uniquement pour le hero.
- **Crédits** : `public/images/CREDITS.md` (fichier, auteur, URL, licence) + affichage dans `/a-propos`.
- **Images NASA** : seules des images d'observation de la Terre du domaine public NASA (ex. NASA Earth Observatory) sont permises, créditées « NASA ». **Jamais le logo/insigne NASA.**
- **Sans accès réseau** : créer des illustrations SVG (champ, soleil, pluie, téléphone, carte du Togo stylisée) dans le style des pictogrammes et le noter dans `DECISIONS.md`.
- Pas d'images lourdes dans l'app elle-même : seulement pictogrammes SVG.

---

## 13. Provenance et avertissements (composants)

`<SourceBadge sourceType>` :
| source_type | Affichage |
|---|---|
| `nasa_power` | « NASA POWER · moyenne 1991–2020 » + info-bulle « estimation sur une zone d'environ 50 km, pas une mesure de votre champ » |
| `public_historical_reanalysis` | « Données historiques publiques (réanalyse) » |
| `provisional_demo` | « Valeur provisoire, à confirmer » |
| `synthetic_demo` | bandeau **« DONNÉES DE DÉMONSTRATION — TEST UNIQUEMENT »** |
| `synthetic_scenario` | « Scénario imaginé, pas une prévision » |

`<Disclaimer>` sous chaque résultat : texte `disclaimer_fr` du moteur.

---

## 14. Configuration

`.env.example`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_MODE=mock          # mock | live
NEXT_PUBLIC_FORECAST_URL=https://api.open-meteo.com/v1/forecast
```
Scripts racine : `pnpm dev`, `pnpm build`, `pnpm test` (vitest engine + web), `pnpm e2e` (Playwright), `pnpm lint`.

---

## 15. Tests et critères d'acceptation

**Vitest** : moteur (golden, V001–V003, monotonie, bornes, déterminisme), `dekad.ts`, `evaluateRules`, validation Zod d'un paquet corrompu (rejeté), traduction stress → RiskBadge.

**Playwright** (viewport 360 × 640, Chromium) :
1. Landing → Commencer → onboarding Kara → ajouter un champ → Que planter ? → 3 propositions affichées.
2. **Mode avion** : après le parcours 1, `context.setOffline(true)`, recharger `/accueil`, ouvrir Que planter ?, changer de scénario → résultats affichés, indicateur « Hors ligne » visible.
3. Écrire un message hors-ligne → « En attente d'envoi » → repasser en ligne (mock) → message envoyé.
4. Paquet `synthetic_demo` → bandeau démo visible.
5. Taille de texte A++ → aucune coupure ni débordement horizontal à 360 px.

**Checklist manuelle** : installation sur un vrai Android, test au soleil, test avec une personne non technicienne (peut-elle obtenir un conseil seule en < 2 min ?).

---

## 16. Phases (calées sur le planning du hackathon)

| Phase | Dates | Contenu | Terminé quand |
|---|---|---|---|
| **F1** | 5 nov. | Monorepo pnpm, Next.js, thème `fieldshift`, police, i18n, composants de base (Button, Card, Wizard, RiskBadge, SourceBadge, BottomNav), pictogrammes SVG, **landing** + images | landing Lighthouse ≥ 90 mobile |
| **F2** | 5–6 nov. | `packages/engine` complet + tests ; fixtures (paquets + profils démo) | tests moteur verts (golden dès qu'il est disponible) |
| **F3** | 7 nov. | Dexie, `lib/packs.ts`, onboarding, ajout/modification de champs, accueil | parcours 1 jusqu'à « champ enregistré » |
| **F4** | 8–9 nov. | Que planter ? (top 3, scénarios, comparer, Pourquoi ?, Écouter), page détail avec graphique | parcours 1 complet |
| **F5** | 9–10 nov. | Serwist (précache/runtime), sync outbox, Météo, Ma région, Échanges, API live | parcours 2 et 3 verts (**jalon : app installable qui marche en mode avion, mar. 10 nov.**) |
| **F6** | 11–12 nov. | Paramètres, mode démo, À propos, états vides/erreurs, accessibilité, performance, tests e2e | tous les tests verts, **gel jeu. 12 nov. au soir** |

Priorité si le temps manque : F1 → F2 → F3 → F4 → hors-ligne de F5. Échanges et Ma région peuvent rester en mode mock.

---

## 17. Hors périmètre
SMS/USSD/vocal interactif, traductions éwé/kabiyè, comptes avec mot de passe, notifications push, cartes interactives avec tuiles (utiliser une carte SVG schématique), modèles de rendement, IA générative.

## 18. Règles du hackathon
Déclarer le code préparé avant l'événement (section « Travail préparatoire » du README). Ne jamais présenter un scénario comme une prévision ni un score comme un rendement. Pas de logo NASA.
