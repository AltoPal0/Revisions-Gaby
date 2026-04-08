# HistoPardy — Guide pour agent IA

Jeu de révision Jeopardy pour Terminale BFI (Histoire / Géographie / HGGSP). Mobile-first PWA, dark theme, micro-animations Framer Motion.

---

## Stack

| Outil | Usage |
|---|---|
| Vite 8 + React + TypeScript | `verbatimModuleSyntax` activé → toujours `import type` pour les types |
| Zustand | 2 stores : `playerStore` (persist localStorage) et `gameStore` (éphémère) |
| Framer Motion | Flip 3D, shake, confetti, transitions entre cartes |
| JSON statiques | Les données sont importées directement (`import raw from './json/...'`) — PAS de fetch async |

---

## Lancer le projet

```bash
cd histopardy
npm install
npm run dev        # accessible sur réseau local via http://<ip>:5173
npm run build      # vérifie que TypeScript compile sans erreur
```

---

## Architecture

```
src/
├── types/index.ts          ← Tous les types TS du projet (lire en premier)
├── lib/
│   ├── constants.ts        ← POINT_VALUES, DIFFICULTY_MAP, LEVEL_WEIGHTS, MOIS_FR
│   └── hash.ts             ← generateDateId(matiere, theme, evenement) → string (djb2)
├── data/
│   ├── json/               ← Les 3 fichiers source (Histoire, Geo, HGGSP)
│   ├── dateParser.ts       ← Parse 26 formats de date → ParsedDate
│   └── loader.ts           ← Normalise les 3 JSON → ALL_DATES: NormalizedDate[] (synchrone)
├── store/
│   ├── playerStore.ts      ← Joueurs + DateKnowledge, persiste dans localStorage
│   └── gameStore.ts        ← Navigation (screen), config, board, question en cours
├── engine/
│   ├── boardGenerator.ts   ← Génère grille 4 colonnes × 5 lignes
│   ├── cardSelector.ts     ← Sélection pondérée adaptative
│   ├── choiceGenerator.ts  ← Génère les leurres (années, jours)
│   └── scoring.ts          ← calculateCardPoints(row, totalCards, card, nd)
├── screens/                ← Un fichier par écran (HomeScreen → GameOverScreen)
└── components/
    ├── Flashcard/
    │   ├── Flashcard.tsx   ← Flip 3D, affiche l'événement au recto
    │   └── AnswerSteps.tsx ← Séquence année→mois→jour + WrongAnswerPanel éducatif
    ├── Layout.tsx          ← Wrapper 100dvh, flex column
    └── ui/
        ├── Confetti.tsx
        └── Modal.tsx
```

---

## Flow de navigation

```
home → playerSelect → modeSelect → board → question → board (boucle)
                                                     → gameOver (toutes les cases jouées)
```

`screen` dans `gameStore` pilote tout. `App.tsx` fait un simple switch dessus.

Les IDs joueurs sélectionnés transitent via `gameStore.pendingPlayerIds` (pas sessionStorage).

---

## Données — points critiques

**181 dates** réparties dans 3 JSON :
- `Histoire_BFI_dates.json` → structure `{ themes: [{ numero, titre, dates[] }] }`
- `Geo_BFI_dates.json` → même structure plate
- `HGGSP_revision_dates.json` → structure imbriquée `{ themes: [{ axes: [{ dates[] }] }] }`

`loader.ts` importe ces fichiers statiquement (Vite bundle le JSON). `ALL_DATES` est disponible **synchrone** dès le démarrage — `dataReady` vaut `true` immédiatement.

Chaque date reçoit un `id` déterministe via `generateDateId(matiere, theme, evenement)` (hash djb2).

**dateParser** gère 26 formats : `"28 juin 1919"`, `"1947"`, `"mai-juin 1968"`, `"1944-1946"`, `"1960s"`, etc. Pour les périodes, on demande la date de **début**.

---

## Modèles de données clés

```typescript
// Une date normalisée
NormalizedDate { id, matiere, theme, themeNumero, axe?, date: ParsedDate, evenement, contexte, niveau: 1|2|3|4 }

// État d'une carte pendant une question
FlashcardState {
  dateId, flipped, currentStep: 'year'|'month'|'day',
  yearChoices: number[], dayChoices?: number[],
  yearResult: 'correct'|'wrong'|'revealed'|null,
  monthResult, dayResult, completed, pointsEarned
}

// Une case du plateau
BoardCell { column, row, points, cardCount, dateIds[], played, playedBy?, earnedPoints? }
```

---

## Logique de jeu

### Plateau
- 4 colonnes (thèmes) × 5 lignes (100/200/300/400/500 pts)
- Difficulté par ligne : 100→1 carte niv.1, 200→1 carte niv.1-2, 300→2 cartes niv.1-3, 400→2 cartes niv.1-3, 500→3 cartes niv.1-4

### Sélection adaptative
```
weight = LEVEL_WEIGHT[niveau] * max(1 - successRate, 0.1) * (1 + recencyBoost * 0.5)
```
- `LEVEL_WEIGHTS` = `{1:4, 2:3, 3:2, 4:1}`
- Dates jamais tentées → poids maximal
- `recencyBoost` = jours depuis dernier essai / 30 (plafonné à 1.0)

### Scoring par carte
```
base = POINT_VALUES[row] / totalCards
+50% base si année correcte
+30% base si mois correct
+20% base si jour correct
× 1.5 si tout correct (combo)
```
**Attention** : `finishQuestion()` additionne toutes les cartes avec `.reduce()` — ne pas utiliser `question.totalEarned` seul (exclut la dernière carte).

### Séquence de réponse
1. Retourner la carte (flip) → voir l'événement
2. Choisir l'année (4 choix, leurres proches)
3. Si `hasMonth` : choisir le mois (grille 12 mois)
4. Si `hasDay` : choisir le jour (4 choix)
5. Tout correct → confetti + auto-avance 1,5s
6. Erreur → `WrongAnswerPanel` (date correcte + détail par étape + contexte) + bouton manuel "✓ J'ai retenu"

---

## Types de questions

### Type 1 — Question "Date" (`questionType: 'date'`)

Cas par défaut pour **toutes les cases** (100 → 500 pts).

**Flow :**
1. La flashcard affiche l'événement + contexte (face avant).
2. Le joueur la retourne → la face arrière indique la précision attendue (Année / Mois·Année / Jour·Mois·Année).
3. Séquence de saisie :
   - **Année** → QCM 4 choix (leurres proches générés par `choiceGenerator.ts`)
   - **Mois** (si `hasMonth`) → grille des 12 mois
   - **Jour** (si `hasDay`) → QCM 4 choix
4. Tout correct → confetti + auto-avance 1,5 s.
5. Erreur → `WrongAnswerPanel` (date correcte + détail par étape + contexte à retenir) + bouton manuel "✓ J'ai retenu" + mini-interaction de rattrapage (voir ci-dessous).

**Scoring :**
```
base = points_cellule / nb_cartes
+ 50 % base si année correcte
+ 30 % base si mois correct
+ 20 % base si jour correct
× 1,5 si tout correct (combo)
```

---

### Type 2 — Question "Contexte" (`questionType: 'context'`)

Variante disponible **uniquement sur les lignes 400 et 500 pts** (~40 % de probabilité, 1 carte forcée). Déclenchée dans `boardGenerator.ts`.

**Flow :**
1. La flashcard affiche l'événement côté recto comme d'habitude.
2. Après le flip, on commence par une étape **contexte** avant la date :
   - Le texte de contexte de la carte s'affiche.
   - Le joueur choisit parmi 4 noms d'événements lequel correspond à ce contexte (`ContextMCQ.tsx`).
   - Badge "×2 si tu trouves aussi la date" affiché pendant cette étape.
3. Ensuite, séquence date identique au Type 1 (année → mois → jour).
4. **Bonus ×2** si contexte trouvé ET date entièrement correcte (appliqué dans `scoring.ts`).
5. Sur erreur de contexte : la réponse correcte est révélée, puis la séquence date continue quand même.

**Scoring :**
```
(même calcul que Type 1)
× 2 supplémentaire si contextResult === 'correct' ET date entièrement correcte
```

---

### Mini-interactions de rattrapage

Déclenchées automatiquement après une mauvaise réponse (`QuestionScreen.tsx` → `triggerMiniInteraction()`). Le joueur doit terminer la mini-interaction avant de pouvoir passer à la carte suivante. Succès → demi-points récupérés + carte bonus dans 2 cases.

Il existe **3 types**, choisis aléatoirement dans `gameStore` :

| Type (`MiniInteractionType`) | Composant | Description |
|---|---|---|
| `proximity` | `ProximityMCQ.tsx` | QCM : "Cette date est la plus proche de quel événement ?" — 4 choix dont le plus proche chronologiquement et 1 leurre éloigné |
| `ordering` | `ChronologicalOrder.tsx` | 3 cartes (la cible + 2 helpers) à remettre dans l'ordre chronologique en les déplaçant avec ↑ / ↓ |
| `timeline` | `TimelineCarousel.tsx` | Placer la date cible au bon endroit sur une frise composée de helpers déjà triés, en glissant ou en cliquant "Avant / Après" |

**Point d'attention sur l'ambiguïté des dates-années :** quand une date est une année seule (sans mois), son ordre relatif à d'autres dates de la même année est indéterminable. Les deux composants `ordering` et `timeline` utilisent une fonction `compareDates()` qui retourne `0` dans ce cas, et acceptent toute position/ordre chronologiquement non-contredite (plage `[minCorrect, maxCorrect]` pour `timeline`, vérification paire-à-paire pour `ordering`).

---

## Pièges connus

| Piège | Solution en place |
|---|---|
| `crypto.randomUUID` absent en HTTP | `generateId()` dans `playerStore.ts` utilise `Math.random` comme fallback |
| `verbatimModuleSyntax` TS | Tous les imports de types doivent être `import type { ... }` |
| Rules of Hooks | Dans `QuestionScreen.tsx`, tous les hooks sont AVANT les early returns ; les valeurs dérivées utilisent l'optional chaining (`card?.completed`) |
| Données async | Ne jamais revenir à `fetch()` pour charger les JSON — les imports statiques sont obligatoires |
| Score de la dernière carte | `finishQuestion()` recalcule avec `cards.reduce(...)` au lieu de `question.totalEarned` |

---

## PWA

- `public/manifest.json` — manifest manuel (vite-plugin-pwa incompatible avec Vite 8)
- `public/sw.js` — service worker cache-first pour les JSON
- Installation : ajouter à l'écran d'accueil depuis Safari iOS

---

## CSS

Variables dark theme dans `src/index.css` :
- `--bg`, `--bg-surface`, `--bg-card` — fonds
- `--text`, `--text-dim`, `--text-muted` — textes
- `--green`, `--red`, `--gold` — feedback
- `--border`, `--border-bright` — bordures
- `--radius`, `--radius-sm` — arrondis
- Classes utilitaires : `btn`, `btn-primary`, `btn-secondary`, `btn-full`, `btn-lg`
