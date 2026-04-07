/**
 * Génère 4 choix pour l'année, dont la bonne réponse
 */
export function generateYearChoices(correctYear: number): number[] {
  const choices = new Set<number>([correctYear]);
  const range = 7;
  let attempts = 0;

  while (choices.size < 4 && attempts < 100) {
    const offset = Math.floor(Math.random() * range * 2) - range;
    const candidate = correctYear + offset;
    if (candidate > 0 && candidate !== correctYear) {
      choices.add(candidate);
    }
    attempts++;
  }

  // Si toujours pas 4 choix, ajouter des voisins proches
  for (let i = 1; choices.size < 4; i++) {
    choices.add(correctYear + i);
    if (choices.size < 4) choices.add(correctYear - i);
  }

  return shuffleArray([...choices]);
}

/**
 * Génère 4 choix pour le jour, dont la bonne réponse
 */
export function generateDayChoices(correctDay: number): number[] {
  const choices = new Set<number>([correctDay]);
  let attempts = 0;

  while (choices.size < 4 && attempts < 100) {
    const offset = Math.floor(Math.random() * 8) - 4;
    const candidate = correctDay + offset;
    if (candidate >= 1 && candidate <= 31 && candidate !== correctDay) {
      choices.add(candidate);
    }
    attempts++;
  }

  // Fallback
  for (let i = 1; choices.size < 4; i++) {
    const up = correctDay + i;
    const down = correctDay - i;
    if (up <= 31) choices.add(up);
    if (choices.size < 4 && down >= 1) choices.add(down);
  }

  return shuffleArray([...choices]);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
