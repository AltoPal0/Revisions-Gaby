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

  // Tout-ou-rien : si une partie est fausse, zéro point
  const yearOk = card.yearResult === 'correct';
  const monthOk = !nd.date.hasMonth || card.monthResult === 'correct';
  const dayOk = !nd.date.hasDay || card.dayResult === 'correct';

  if (!yearOk || !monthOk || !dayOk) return 0;

  // Tout correct : base × 1.5 (bonus combo)
  let earned = base * 1.5;

  // Bonus si question contexte réussie + date correcte
  // isContextOnly (Quel est l'événement ?) : ×1.5
  // Contexte classique (montrer le contexte avant date) : ×2
  if (card.contextResult === 'correct' && yearOk && monthOk && dayOk) {
    earned *= card.isContextOnly ? 1.5 : 2;
  }

  // Appliquer le multiplicateur bonus (carte de révision)
  if (card.bonusMultiplier) {
    earned *= card.bonusMultiplier;
  }

  return Math.round(earned);
}
