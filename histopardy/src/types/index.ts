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
export type DatePrecision = 'full' | 'year_month' | 'year_only';

export interface DateKnowledge {
  attempts: number;
  successes: number;
  perfectCount: number;
  lastAttempt: number;
  precision?: DatePrecision;
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
  questionType?: 'date' | 'context' | 'matching';
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
  precision?: DatePrecision;
  // Champ contexte (questions de type 'context')
  isContextOnly?: boolean;   // true = question contexte pure, pas d'étapes date
  contextStep: boolean;
  contextChoices?: string[];
  contextResult?: AnswerResult;
  yearChoices: number[];
  dayChoices?: number[];
  yearResult: AnswerResult;
  monthResult: AnswerResult;
  dayResult: AnswerResult;
  completed: boolean;
  pointsEarned: number;
  isBonus?: boolean;
  bonusMultiplier?: number;
}

export interface BonusCard {
  dateId: string;
  originalRow: number;
  multiplier: number;
  scheduledAfterCell: number;
}

export type MiniInteractionType = 'proximity' | 'ordering' | 'timeline';

export interface MiniInteractionState {
  type: MiniInteractionType;
  dateId: string;
  helperDateIds: string[];
  resolved: boolean;
  success: boolean | null;
  halfPoints: number;
}

// ===== QUESTION MATCHING =====

export interface MatchingPair {
  dateId: string;
  evenement: string;
  dateRaw: string;
  matched: boolean;
  assignedDateRaw: string | null;
  result: 'correct' | 'wrong' | null;
}

export type MatchingPhase = 'playing' | 'validated';

export interface MatchingQuestionState {
  pairs: MatchingPair[];
  datePool: Array<{ raw: string; idx: number }>;
  selectedEventIndex: number | null;
  phase: MatchingPhase;
  score: number;
  correctCount: number;
}

export interface QuestionState {
  cellRow: number;
  cellCol: number;
  cards: FlashcardState[];
  currentCardIndex: number;
  totalEarned: number;
  finished: boolean;
  activeMiniInteraction: MiniInteractionState | null;
  matchingQuestion?: MatchingQuestionState;
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
