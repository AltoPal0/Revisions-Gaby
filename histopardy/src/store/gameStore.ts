import { create } from 'zustand';
import type {
  Screen, GameConfig, BoardState, QuestionState, NormalizedDate,
  FlashcardState, DatePrecision, BonusCard, MiniInteractionType,
  MatchingPair,
} from '../types';
import { generateBoard } from '../engine/boardGenerator';
import { generateYearChoices, generateDayChoices, generateContextChoices } from '../engine/choiceGenerator';
import { calculateCardPoints } from '../engine/scoring';
import { usePlayerStore } from './playerStore';
import { ALL_DATES } from '../data/loader';

interface GameState {
  screen: Screen;
  config: GameConfig | null;
  board: BoardState | null;
  question: QuestionState | null;
  allDates: NormalizedDate[];
  dataReady: boolean;
  pendingPlayerIds: string[];  // Joueurs sélectionnés avant la config
  bonusQueue: BonusCard[];

  // Actions
  setScreen: (screen: Screen) => void;
  setPendingPlayerIds: (ids: string[]) => void;
  startGame: (config: GameConfig) => void;
  selectCell: (row: number, col: number) => void;
  flipCard: () => void;
  answerContext: (choice: string) => void;
  answerYear: (choice: number) => void;
  answerMonth: (choice: number) => void;
  answerDay: (choice: number) => void;
  triggerMiniInteraction: () => void;
  resolveMiniInteraction: (success: boolean) => void;
  submitMatching: (pairs: MatchingPair[]) => void;
  nextCard: () => void;
  finishQuestion: () => void;
  endGame: () => void;
  goHome: () => void;
}

function makeFlashcard(
  dateId: string,
  allDates: NormalizedDate[],
  precision?: DatePrecision,
  isContext?: boolean
): FlashcardState {
  const nd = allDates.find(d => d.id === dateId)!;
  const contextChoices = isContext
    ? generateContextChoices(nd.evenement, nd.theme, nd.matiere, allDates)
    : undefined;
  return {
    dateId,
    // Questions contexte-only : déjà "retournées" pour afficher directement le QCM
    flipped: isContext ?? false,
    isContextOnly: isContext ?? false,
    currentStep: 'year',
    precision,
    contextStep: isContext ?? false,
    contextChoices,
    contextResult: undefined,
    yearChoices: generateYearChoices(nd.date.year),
    dayChoices: nd.date.hasDay ? generateDayChoices(nd.date.day!) : undefined,
    yearResult: null,
    monthResult: null,
    dayResult: null,
    completed: false,
    pointsEarned: 0,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'home',
  config: null,
  board: null,
  pendingPlayerIds: [],
  question: null,
  bonusQueue: [],
  allDates: ALL_DATES,      // Synchrone dès le démarrage
  dataReady: ALL_DATES.length > 0,

  setScreen: (screen) => set({ screen }),

  setPendingPlayerIds: (ids) => set({ pendingPlayerIds: ids }),

  startGame: (config) => {
    const { allDates } = get();
    console.log('[startGame] allDates.length:', allDates.length, 'matieres:', config.matieres);
    if (allDates.length === 0) {
      console.error('[startGame] Les données ne sont pas encore chargées !');
      return;
    }
    const playerKnowledge = usePlayerStore.getState().players[config.playerIds[0]]?.dateKnowledge ?? {};
    const board = generateBoard(config, allDates, playerKnowledge);
    console.log('[startGame] board columns:', board.columns.length, 'cells rows:', board.cells.length);
    const scores: Record<string, number> = {};
    for (const id of config.playerIds) scores[id] = 0;
    set({
      config,
      board: { ...board, currentPlayerIndex: 0, scores },
      question: null,
      bonusQueue: [],
      screen: 'board',
    });
  },

  selectCell: (row, col) => {
    const { board, allDates, config } = get();
    if (!board || !config) return;
    const cell = board.cells[row][col];
    if (cell.played) return;

    const currentPlayerId = config.playerIds[board.currentPlayerIndex];
    const playerKnowledge = usePlayerStore.getState().players[currentPlayerId]?.dateKnowledge ?? {};

    // Branche matching
    if (cell.questionType === 'matching') {
      const matchingDates = cell.dateIds.map(id => allDates.find(d => d.id === id)!);
      const shuffled = [...matchingDates].sort(() => Math.random() - 0.5);
      const datePool = shuffled.map((d, idx) => ({ raw: d.date.raw, idx }));
      const pairs: MatchingPair[] = matchingDates.map(nd => ({
        dateId: nd.id,
        evenement: nd.evenement,
        dateRaw: nd.date.raw,
        matched: false,
        assignedDateRaw: null,
        result: null,
      }));
      set({
        question: {
          cellRow: row,
          cellCol: col,
          cards: [],
          currentCardIndex: 0,
          totalEarned: 0,
          finished: false,
          activeMiniInteraction: null,
          matchingQuestion: {
            pairs,
            datePool,
            selectedEventIndex: null,
            phase: 'playing',
            score: 0,
            correctCount: 0,
          },
        },
        screen: 'question',
      });
      return;
    }

    const isContext = cell.questionType === 'context';
    const cellCards: FlashcardState[] = cell.dateIds.map(id =>
      makeFlashcard(id, allDates, playerKnowledge[id]?.precision, isContext)
    );

    // Injecter les cartes bonus dues en tête de liste
    const { bonusQueue } = get();
    const playedCells = board.cells.flat().filter(c => c.played).length;
    const dueBonus = bonusQueue.filter(b => b.scheduledAfterCell <= playedCells);
    const remainingBonus = bonusQueue.filter(b => b.scheduledAfterCell > playedCells);

    const bonusCards: FlashcardState[] = dueBonus.map(b =>
      ({
        ...makeFlashcard(b.dateId, allDates, playerKnowledge[b.dateId]?.precision),
        isBonus: true,
        bonusMultiplier: b.multiplier,
      })
    );

    const cards = [...bonusCards, ...cellCards];

    set({
      bonusQueue: remainingBonus,
      question: {
        cellRow: row,
        cellCol: col,
        cards,
        currentCardIndex: 0,
        totalEarned: 0,
        finished: false,
        activeMiniInteraction: null,
      },
      screen: 'question',
    });
  },

  flipCard: () => {
    set(state => {
      if (!state.question) return state;
      const cards = [...state.question.cards];
      const card = { ...cards[state.question.currentCardIndex] };
      card.flipped = true;
      cards[state.question.currentCardIndex] = card;
      return { question: { ...state.question, cards } };
    });
  },

  answerContext: (choice: string) => {
    set(state => {
      if (!state.question) return state;
      const { cards, currentCardIndex } = state.question;
      const card = { ...cards[currentCardIndex] };
      const nd = state.allDates.find(d => d.id === card.dateId)!;
      const correct = choice === nd.evenement;
      card.contextResult = correct ? 'correct' : 'wrong';

      if (card.isContextOnly) {
        // Question contexte pure : si correct, on enchaîne sur les étapes de date (×1.5 si date aussi correcte)
        if (correct) {
          card.contextStep = false;
          // La date sera demandée normalement ; le bonus ×1.5 est appliqué dans calculateCardPoints
        } else {
          card.completed = true;
          card.pointsEarned = 0;
        }
      } else if (correct) {
        card.contextStep = false;
        // Passe aux étapes date normalement
      } else {
        card.completed = true;
        card.pointsEarned = 0;
      }

      const newCards = [...cards];
      newCards[currentCardIndex] = card;
      return { question: { ...state.question, cards: newCards } };
    });
  },

  answerYear: (choice: number) => {
    set(state => {
      if (!state.question) return state;
      const { cards, currentCardIndex } = state.question;
      const card = { ...cards[currentCardIndex] };
      const nd = state.allDates.find(d => d.id === card.dateId)!;
      const correct = choice === nd.date.year;
      card.yearResult = correct ? 'correct' : 'wrong';

      const precision = card.precision;
      if (!correct) {
        card.completed = true;
        // Marquer mois et jour comme "revealed" si applicables
        if (nd.date.hasMonth) card.monthResult = 'revealed';
        if (nd.date.hasDay) card.dayResult = 'revealed';
      } else {
        // Passe à l'étape suivante selon la précision définie
        const askMonth = nd.date.hasMonth && precision !== 'year_only';
        const askDay = nd.date.hasDay && precision !== 'year_only' && precision !== 'year_month';
        if (askMonth) {
          card.currentStep = 'month';
        } else if (askDay) {
          card.currentStep = 'day';
        } else {
          card.completed = true;
        }
      }

      // Calcul des points partiels si completed
      if (card.completed) {
        card.pointsEarned = calculateCardPoints(
          state.question.cellRow, cards.length, card, nd
        );
      }

      const newCards = [...cards];
      newCards[currentCardIndex] = card;
      return { question: { ...state.question, cards: newCards } };
    });
  },

  answerMonth: (choice: number) => {
    set(state => {
      if (!state.question) return state;
      const { cards, currentCardIndex } = state.question;
      const card = { ...cards[currentCardIndex] };
      const nd = state.allDates.find(d => d.id === card.dateId)!;
      const correct = choice === nd.date.month;
      card.monthResult = correct ? 'correct' : 'wrong';

      if (!correct) {
        card.completed = true;
        if (nd.date.hasDay) card.dayResult = 'revealed';
      } else {
        const askDay = nd.date.hasDay && card.precision !== 'year_month' && card.precision !== 'year_only';
        if (askDay) {
          card.currentStep = 'day';
        } else {
          card.completed = true;
        }
      }

      if (card.completed) {
        card.pointsEarned = calculateCardPoints(
          state.question.cellRow, cards.length, card, nd
        );
      }

      const newCards = [...cards];
      newCards[currentCardIndex] = card;
      return { question: { ...state.question, cards: newCards } };
    });
  },

  answerDay: (choice: number) => {
    set(state => {
      if (!state.question) return state;
      const { cards, currentCardIndex } = state.question;
      const card = { ...cards[currentCardIndex] };
      const nd = state.allDates.find(d => d.id === card.dateId)!;
      const correct = choice === nd.date.day;
      card.dayResult = correct ? 'correct' : 'wrong';
      card.completed = true;
      card.pointsEarned = calculateCardPoints(
        state.question.cellRow, cards.length, card, nd
      );

      const newCards = [...cards];
      newCards[currentCardIndex] = card;
      return { question: { ...state.question, cards: newCards } };
    });
  },

  submitMatching: (pairs: MatchingPair[]) => {
    const { question, board } = get();
    if (!question || !board) return;
    const cellPoints = board.cells[question.cellRow][question.cellCol].points;
    const evaluated: MatchingPair[] = pairs.map(p => ({
      ...p,
      result: p.assignedDateRaw === p.dateRaw ? 'correct' : 'wrong',
    }));
    const correctCount = evaluated.filter(p => p.result === 'correct').length;
    let score = correctCount * (cellPoints / 4);
    if (correctCount === 4) score = Math.round(score * 1.25);
    else score = Math.round(score);
    set(state => ({
      question: state.question ? {
        ...state.question,
        totalEarned: score,
        matchingQuestion: state.question.matchingQuestion ? {
          ...state.question.matchingQuestion,
          pairs: evaluated,
          phase: 'validated',
          score,
          correctCount,
        } : undefined,
      } : null,
    }));
  },

  triggerMiniInteraction: () => {
    set(state => {
      if (!state.question) return state;
      const { cards, currentCardIndex, cellRow } = state.question;
      const card = cards[currentCardIndex];
      const nd = state.allDates.find(d => d.id === card.dateId)!;

      // Choisir des helpers (même matière, triés par proximité temporelle)
      const sameMatiere = state.allDates.filter(
        d => d.matiere === nd.matiere && d.id !== nd.id
      );
      const sorted = [...sameMatiere].sort(
        (a, b) => Math.abs(a.date.year - nd.date.year) - Math.abs(b.date.year - nd.date.year)
      );
      const helperDateIds = sorted.slice(0, 6).map(d => d.id);

      // Base points pour la demi-récompense
      const base = (100 * (cellRow + 1)) / cards.length;
      const halfPoints = Math.max(Math.round(base * 0.5), 10);

      // Choisir le type aléatoirement parmi les 3
      const types: MiniInteractionType[] = ['proximity', 'ordering', 'timeline'];
      const type = types[Math.floor(Math.random() * types.length)];

      return {
        question: {
          ...state.question,
          activeMiniInteraction: {
            type,
            dateId: nd.id,
            helperDateIds,
            resolved: false,
            success: null,
            halfPoints,
          },
        },
      };
    });
  },

  resolveMiniInteraction: (success: boolean) => {
    const { question, board } = get();
    if (!question || !question.activeMiniInteraction) return;

    const { activeMiniInteraction, cards, currentCardIndex, cellRow } = question;
    const dateId = activeMiniInteraction.dateId;
    const halfPoints = activeMiniInteraction.halfPoints;

    // Si succès, enregistrer les demi-points sur la carte
    let newCards = [...cards];
    if (success) {
      const card = { ...newCards[currentCardIndex] };
      card.pointsEarned = card.pointsEarned + halfPoints;
      newCards[currentCardIndex] = card;
    }

    // Planifier la carte bonus (+20%) dans 2 cases
    const playedCells = board ? board.cells.flat().filter(c => c.played).length : 0;
    const bonus: BonusCard = {
      dateId,
      originalRow: cellRow,
      multiplier: 1.2,
      scheduledAfterCell: playedCells + 2,
    };

    set(state => ({
      bonusQueue: [...state.bonusQueue, bonus],
      question: state.question ? {
        ...state.question,
        cards: newCards,
        activeMiniInteraction: {
          ...state.question.activeMiniInteraction!,
          resolved: true,
          success,
        },
      } : null,
    }));
  },

  nextCard: () => {
    set(state => {
      if (!state.question) return state;
      const { currentCardIndex, cards } = state.question;
      const earnedThisCard = cards[currentCardIndex].pointsEarned;
      const nextIndex = currentCardIndex + 1;
      const newTotal = state.question.totalEarned + earnedThisCard;

      if (nextIndex >= cards.length) {
        // Toutes les cartes jouées => finir la question
        return {
          question: {
            ...state.question,
            currentCardIndex: nextIndex,
            totalEarned: newTotal,
            finished: true,
          },
        };
      }

      return {
        question: {
          ...state.question,
          currentCardIndex: nextIndex,
          totalEarned: newTotal,
          activeMiniInteraction: null,
        },
      };
    });
  },

  finishQuestion: () => {
    const { question, board, config } = get();
    if (!question || !board || !config) return;

    const { cellRow, cellCol, cards } = question;

    // Sommer les points (matching ou cartes classiques)
    const totalEarned = question.matchingQuestion
      ? question.matchingQuestion.score
      : cards.reduce((sum, c) => sum + c.pointsEarned, 0);

    const currentPlayerId = config.playerIds[board.currentPlayerIndex];

    // Mettre à jour le board
    const newCells = board.cells.map(row => row.map(cell => ({ ...cell })));
    newCells[cellRow][cellCol] = {
      ...newCells[cellRow][cellCol],
      played: true,
      playedBy: currentPlayerId,
      earnedPoints: totalEarned,
    };

    // Mettre à jour les scores
    const newScores = { ...board.scores };
    newScores[currentPlayerId] = (newScores[currentPlayerId] ?? 0) + totalEarned;

    // Mode duel: passer au joueur suivant
    const nextPlayerIndex = config.mode === 'duel'
      ? (board.currentPlayerIndex + 1) % config.playerIds.length
      : 0;

    // Persister le score et les connaissances
    const playerStore = usePlayerStore.getState();
    playerStore.addScore(currentPlayerId, totalEarned);

    for (const card of question.cards) {
      const yearCorrect = card.yearResult === 'correct';
      const allCorrect = card.yearResult === 'correct' &&
        (card.monthResult === 'correct' || card.monthResult === null) &&
        (card.dayResult === 'correct' || card.dayResult === null);
      playerStore.updateKnowledge(currentPlayerId, card.dateId, yearCorrect, allCorrect);
    }

    if (question.matchingQuestion) {
      for (const pair of question.matchingQuestion.pairs) {
        const ok = pair.result === 'correct';
        playerStore.updateKnowledge(currentPlayerId, pair.dateId, ok, ok);
      }
    }

    // Vérifier si toutes les cases sont jouées
    const allPlayed = newCells.every(row => row.every(cell => cell.played));

    set({
      board: {
        ...board,
        cells: newCells,
        scores: newScores,
        currentPlayerIndex: nextPlayerIndex,
      },
      question: null,
      screen: allPlayed ? 'gameOver' : 'board',
    });

    if (allPlayed) {
      for (const id of config.playerIds) {
        playerStore.incrementGamesPlayed(id);
      }
    }
  },

  endGame: () => {
    const { config } = get();
    if (!config) return;
    const playerStore = usePlayerStore.getState();
    for (const id of config.playerIds) {
      playerStore.incrementGamesPlayed(id);
    }
    set({ screen: 'gameOver' });
  },

  goHome: () => {
    set({ screen: 'home', config: null, board: null, question: null });
  },
}));
