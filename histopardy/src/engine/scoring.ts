import type { FlashcardState, NormalizedDate } from '../types';
import { POINT_VALUES } from '../lib/constants';

/**
 * Calcule les points gagnés pour une carte
 *
 * - Base = points_cellule / nb_cartes
 * - Précision de la date (propriétés intrinsèques) :
 *     jour + mois + année → 100% de la base
 *     mois + année        →  50% de la base
 *     année seule         →  25% de la base
 * - Tout-ou-rien : si une partie demandée est fausse, zéro point
 */
export function calculateCardPoints(
  row: number,
  totalCards: number,
  card: FlashcardState,
  nd: NormalizedDate
): number {
  const cellPoints = POINT_VALUES[row];
  const base = cellPoints / totalCards;

  // Tout-ou-rien : si une partie demandée est fausse, zéro point
  // monthResult/dayResult === null signifie « non demandé » (précision joueur) → OK
  const yearOk = card.yearResult === 'correct';
  const monthOk = !nd.date.hasMonth || card.monthResult !== 'wrong';
  const dayOk = !nd.date.hasDay || card.dayResult !== 'wrong';

  if (!yearOk || !monthOk || !dayOk) return 0;

  // Facteur selon la précision intrinsèque de la date
  let precisionFactor: number;
  if (nd.date.hasDay) {
    precisionFactor = 1.0;   // 100% : jour + mois + année
  } else if (nd.date.hasMonth) {
    precisionFactor = 0.5;   // 50% : mois + année
  } else {
    precisionFactor = 0.25;  // 25% : année seule
  }

  let earned = base * precisionFactor;

  // Bonus si question contexte réussie + date correcte
  // isContextOnly (Quel est l'événement ?) : ×1.5
  // Contexte classique (montrer le contexte avant date) : ×2
  if (card.contextResult === 'correct') {
    earned *= card.isContextOnly ? 1.5 : 2;
  }

  // Appliquer le multiplicateur bonus (carte de révision)
  if (card.bonusMultiplier) {
    earned *= card.bonusMultiplier;
  }

  return Math.round(earned);
}
