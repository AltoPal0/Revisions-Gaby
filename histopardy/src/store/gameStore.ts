import { create } from 'zustand';
import type {
  Screen, GameConfig, BoardState, QuestionState, NormalizedDate,
  FlashcardState,
} from '../types';
import { generateBoard } from '../engine/boardGenerator';
import { generateYearChoices, generateDayChoices } from '../engine/choiceGenerator';
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

  // Actions
  setScreen: (screen: Screen) => void;
  setPendingPlayerIds: (ids: string[]) => void;
  startGame: (config: GameConfig) => void;
  selectCell: (row: number, col: number) => void;
  flipCard: () => void;
  answerYear: (choice: number) => void;
  answerMonth: (choice: number) => void;
  answerDay: (choice: number) => void;
  nextCard: () => void;
  finishQuestion: () => void;
  endGame: () => void;
  goHome: () => void;
}

function makeFlashcard(dateId: string, allDates: NormalizedDate[]): FlashcardState {
  const nd = allDates.find(d => d.id === dateId)!;
  return {
    dateId,
    flipped: false,
    currentStep: 'year',
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
      screen: 'board',
    });
  },

  selectCell: (row, col) => {
    const { board, allDates } = get();
    if (!board) return;
    const cell = board.cells[row][col];
    if (cell.played) return;

    const cards: FlashcardState[] = cell.dateIds.map(id => makeFlashcard(id, allDates));

    set({
      question: {
        cellRow: row,
        cellCol: col,
        cards,
        currentCardIndex: 0,
        totalEarned: 0,
        finished: false,
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

  answerYear: (choice: number) => {
    set(state => {
      if (!state.question) return state;
      const { cards, currentCardIndex } = state.question;
      const card = { ...cards[currentCardIndex] };
      const nd = state.allDates.find(d => d.id === card.dateId)!;
      const correct = choice === nd.date.year;
      card.yearResult = correct ? 'correct' : 'wrong';

      if (!correct) {
        card.completed = true;
        // Marquer mois et jour comme "revealed" si applicables
        if (nd.date.hasMonth) card.monthResult = 'revealed';
        if (nd.date.hasDay) card.dayResult = 'revealed';
      } else {
        // Passe à l'étape suivante
        if (nd.date.hasMonth) {
          card.currentStep = 'month';
        } else if (nd.date.hasDay) {
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
        if (nd.date.hasDay) {
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
        },
      };
    });
  },

  finishQuestion: () => {
    const { question, board, config } = get();
    if (!question || !board || !config) return;

    const { cellRow, cellCol, cards } = question;

    // Sommer TOUTES les cartes (évite le bug de la dernière carte non comptée)
    const totalEarned = cards.reduce((sum, c) => sum + c.pointsEarned, 0);

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
