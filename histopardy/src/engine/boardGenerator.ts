import type { GameConfig, BoardState, BoardCell, BoardColumn, NormalizedDate, DateKnowledge, Matiere } from '../types';
import { POINT_VALUES, DIFFICULTY_MAP } from '../lib/constants';
import { selectDatesForCell } from './cardSelector';
import { getThemesByMatiere } from '../data/loader';

/**
 * Génère un board Jeopardy avec 4 colonnes (thèmes) × 5 lignes (100-500)
 */
export function generateBoard(
  config: GameConfig,
  allDates: NormalizedDate[],
  playerKnowledge: Record<string, DateKnowledge>
): BoardState {
  // Sélection des colonnes (thèmes)
  const columns = selectColumns(config.matieres, allDates);

  // Génération des cellules
  const usedIds = new Set<string>();
  const cells: BoardCell[][] = [];

  for (let row = 0; row < POINT_VALUES.length; row++) {
    const rowCells: BoardCell[] = [];
    for (let col = 0; col < columns.length; col++) {
      const column = columns[col];
      const points = POINT_VALUES[row];
      const { cardCount, maxLevel } = DIFFICULTY_MAP[points];

      // Pool de dates pour ce thème
      const rawPool = allDates.filter(
        d => d.matiere === column.matiere && d.theme === column.theme
      );

      // Tentative matching : on confirme seulement après avoir sélectionné exactement 4 dates
      const availableForMatching = rawPool.filter(d => !usedIds.has(d.id));
      const tentativeMatching = availableForMatching.length >= 4 && Math.random() < 0.3;

      const finalCardCount = tentativeMatching ? 4 : cardCount;
      const selectedDates = selectDatesForCell(rawPool, finalCardCount, maxLevel, playerKnowledge, usedIds);
      selectedDates.forEach(d => usedIds.add(d.id));

      // Confirmer le matching seulement si on a bien obtenu 4 dates
      const useMatching = tentativeMatching && selectedDates.length === 4;
      const useContext = !useMatching && selectedDates.length > 0 && Math.random() < 0.3;
      const questionType = useMatching ? 'matching' : useContext ? 'context' : 'date';
      const finalDates = useContext ? [selectedDates[0]] : selectedDates;

      rowCells.push({
        column: col,
        row,
        points,
        cardCount: finalDates.length,
        dateIds: finalDates.map(d => d.id),
        played: false,
        questionType,
      });
    }
    cells.push(rowCells);
  }

  return {
    columns,
    cells,
    currentPlayerIndex: 0,
    scores: {},
  };
}

function selectColumns(matieres: Matiere[], allDates: NormalizedDate[]): BoardColumn[] {
  const columns: BoardColumn[] = [];

  if (matieres.length === 1 || (matieres.length === 3)) {
    // Une matière ou mix complet: prendre des thèmes variés
    const targetCount = 4;
    const allThemes: BoardColumn[] = [];

    for (const matiere of matieres) {
      const themes = getThemesByMatiere(matiere, allDates);
      for (const t of themes) {
        allThemes.push({ matiere, theme: t.titre, themeNumero: t.numero });
      }
    }

    // Shuffle et prendre les 4 premiers
    const shuffled = shuffleArray(allThemes);
    return shuffled.slice(0, targetCount);
  }

  // Deux matières: 2 thèmes par matière
  for (const matiere of matieres) {
    const themes = getThemesByMatiere(matiere, allDates);
    const shuffled = shuffleArray(themes);
    const selected = shuffled.slice(0, 2);
    for (const t of selected) {
      columns.push({ matiere, theme: t.titre, themeNumero: t.numero });
    }
  }

  return columns;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
