import type { NormalizedDate, DateKnowledge } from '../types';
import { LEVEL_WEIGHTS } from '../lib/constants';

function computeWeight(date: NormalizedDate, knowledge: DateKnowledge | undefined): number {
  const baseWeight = LEVEL_WEIGHTS[date.niveau] ?? 1;

  if (!knowledge || knowledge.attempts === 0) {
    return baseWeight * 1.0;
  }

  const successRate = knowledge.successes / knowledge.attempts;
  const factor = Math.max(1 - successRate, 0.1);

  const daysSinceLastAttempt = (Date.now() - knowledge.lastAttempt) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.min(daysSinceLastAttempt / 30, 1.0);

  return baseWeight * factor * (1 + recencyBoost * 0.5);
}

/**
 * Sélection pondérée sans remise
 */
export function selectDatesForCell(
  pool: NormalizedDate[],
  count: number,
  maxLevel: number,
  playerKnowledge: Record<string, DateKnowledge>,
  alreadyUsedIds: Set<string>
): NormalizedDate[] {
  // Les dates avec précision simplifiée comptent comme niveau inférieur
  function effectiveNiveau(d: NormalizedDate): number {
    const p = playerKnowledge[d.id]?.precision;
    if (p === 'year_only') return 1;
    if (p === 'year_month') return Math.min(d.niveau, 2);
    return d.niveau;
  }

  let eligible = pool.filter(d => effectiveNiveau(d) <= maxLevel && !alreadyUsedIds.has(d.id));

  // Si pas assez de dates, relâcher le filtre de niveau (mais garder les dates simplifiées à leur niveau effectif)
  if (eligible.length < count) {
    eligible = pool.filter(d => !alreadyUsedIds.has(d.id));
  }
  if (eligible.length < count) {
    eligible = [...pool]; // Dernier recours: tout le pool
  }

  const weights = eligible.map(d => computeWeight(d, playerKnowledge[d.id]));

  const selected: NormalizedDate[] = [];
  const remaining = eligible.map((d, i) => ({ date: d, weight: weights[i] }));

  for (let pick = 0; pick < count && remaining.length > 0; pick++) {
    const totalWeight = remaining.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalWeight;

    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i].weight;
      if (r <= 0) {
        selected.push(remaining[i].date);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}
