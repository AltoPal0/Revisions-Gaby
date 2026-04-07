import type { FlashcardState, NormalizedDate } from '../types';
import { POINT_VALUES } from '../lib/constants';

/**
 * Calcule les points gagnés pour une carte
 *
 * - Base = points_cellule / nb_cartes
 * - Année correcte: +50% base
 * - Mois correct: +30% base
 * - Jour correct: +20% base
 * - Tout correct: ×1.5 bonus
 */
export function calculateCardPoints(
  row: number,
  totalCards: number,
  card: FlashcardState,
  nd: NormalizedDate
): number {
  const cellPoints = POINT_VALUES[row];
  const base = cellPoints / totalCards;

  let earned = 0;

  if (card.yearResult === 'correct') {
    earned += base * 0.5;
  }

  if (nd.date.hasMonth && card.monthResult === 'correct') {
    earned += base * 0.3;
  }

  if (nd.date.hasDay && card.dayResult === 'correct') {
    earned += base * 0.2;
  }

  // Bonus combo si tout est correct
  const yearOk = card.yearResult === 'correct';
  const monthOk = !nd.date.hasMonth || card.monthResult === 'correct';
  const dayOk = !nd.date.hasDay || card.dayResult === 'correct';

  if (yearOk && monthOk && dayOk) {
    earned *= 1.5;
  }

  return Math.round(earned);
}
