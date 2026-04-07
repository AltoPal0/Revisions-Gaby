// ===== MATIÈRES =====
export type Matiere = 'histoire' | 'geo' | 'hggsp';

// ===== DATE PARSING =====
export interface ParsedDate {
  year: number;
  yearEnd?: number;
  month?: number;
  monthEnd?: number;
  day?: number;
  dayEnd?: number;
  raw: string;
  hasYear: true;
  hasMonth: boolean;
  hasDay: boolean;
  isPeriod: boolean;
}

// ===== DONNÉES NORMALISÉES =====
export interface NormalizedDate {
  id: string;
  matiere: Matiere;
  theme: string;
  themeNumero: number;
  axe?: string;
  date: ParsedDate;
  evenement: string;
  contexte: string;
  niveau: 1 | 2 | 3 | 4;
}

// ===== JOUEURS =====
export interface DateKnowledge {
  attempts: number;
  successes: number;
  perfectCount: number;
  lastAttempt: number;
}

export interface Player {
  id: string;
  name: string;
  createdAt: number;
  totalScore: number;
  gamesPlayed: number;
  dateKnowledge: Record<string, DateKnowledge>;
}

// ===== CONFIGURATION DE PARTIE =====
export type GameMode = 'solo' | 'duel';

export interface GameConfig {
  mode: GameMode;
  playerIds: string[];
  matieres: Matiere[];
}

// ===== BOARD =====
export interface BoardColumn {
  theme: string;
  themeNumero: number;
  matiere: Matiere;
}

export interface BoardCell {
  column: number;
  row: number;
  points: number;
  cardCount: number;
  dateIds: string[];
  played: boolean;
  playedBy?: string;
  earnedPoints?: number;
}

export interface BoardState {
  columns: BoardColumn[];
  cells: BoardCell[][];
  currentPlayerIndex: number;
  scores: Record<string, number>;
}

// ===== QUESTION EN COURS =====
export type AnswerStep = 'year' | 'month' | 'day';

export type AnswerResult = 'correct' | 'wrong' | 'revealed' | null;

export interface FlashcardState {
  dateId: string;
  flipped: boolean;
  currentStep: AnswerStep;
  yearChoices: number[];
  dayChoices?: number[];
  yearResult: AnswerResult;
  monthResult: AnswerResult;
  dayResult: AnswerResult;
  completed: boolean;
  pointsEarned: number;
}

export interface QuestionState {
  cellRow: number;
  cellCol: number;
  cards: FlashcardState[];
  currentCardIndex: number;
  totalEarned: number;
  finished: boolean;
}

// ===== NAVIGATION =====
export type Screen =
  | 'home'
  | 'playerSelect'
  | 'modeSelect'
  | 'board'
  | 'question'
  | 'scores'
  | 'gameOver';
