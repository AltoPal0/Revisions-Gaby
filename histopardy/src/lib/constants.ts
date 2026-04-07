export const MOIS_FR: Record<string, number> = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
};

export const MOIS_LABELS: string[] = [
  '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

export const MOIS_FULL: string[] = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const POINT_VALUES = [100, 200, 300, 400, 500] as const;

export const DIFFICULTY_MAP: Record<number, { cardCount: number; maxLevel: number }> = {
  100: { cardCount: 1, maxLevel: 1 },
  200: { cardCount: 1, maxLevel: 2 },
  300: { cardCount: 2, maxLevel: 3 },
  400: { cardCount: 2, maxLevel: 3 },
  500: { cardCount: 3, maxLevel: 4 },
};

export const LEVEL_WEIGHTS: Record<number, number> = {
  1: 4,
  2: 3,
  3: 2,
  4: 1,
};

export const MATIERE_LABELS: Record<string, string> = {
  histoire: 'Histoire',
  geo: 'Géographie',
  hggsp: 'Géopolitique',
};

export const MATIERE_COLORS: Record<string, string> = {
  histoire: '#e8b84b',
  geo: '#4bc5e8',
  hggsp: '#e84b8a',
};
