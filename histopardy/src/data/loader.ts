import type { NormalizedDate, Matiere } from '../types';
import { generateDateId } from '../lib/hash';
import { parseDate } from './dateParser';

// Imports statiques — Vite bundle les JSON, pas de fetch asynchrone
import histoireRaw from './json/Histoire_BFI_dates.json';
import geoRaw from './json/Geo_BFI_dates.json';
import hggspRaw from './json/HGGSP_revision_dates.json';

// ===== Types bruts des JSON =====
interface RawDate {
  date: string;
  evenement: string;
  contexte: string;
  niveau: 1 | 2 | 3 | 4;
}

interface RawThemePlat {
  numero: number;
  titre: string;
  dates: RawDate[];
}

interface RawAxe {
  titre: string;
  dates: RawDate[];
}

interface RawThemeAxes {
  numero: number;
  titre: string;
  axes: RawAxe[];
}

interface RawDataPlat {
  themes: RawThemePlat[];
}

interface RawDataAxes {
  themes: RawThemeAxes[];
}

// ===== Normalisation =====

function normalizeFlat(data: RawDataPlat, matiere: Matiere): NormalizedDate[] {
  const results: NormalizedDate[] = [];
  for (const theme of data.themes) {
    for (const d of theme.dates) {
      const id = generateDateId(matiere, theme.titre, d.evenement);
      results.push({
        id,
        matiere,
        theme: theme.titre,
        themeNumero: theme.numero,
        date: parseDate(d.date),
        evenement: d.evenement,
        contexte: d.contexte,
        niveau: d.niveau,
      });
    }
  }
  return results;
}

function normalizeWithAxes(data: RawDataAxes, matiere: Matiere): NormalizedDate[] {
  const results: NormalizedDate[] = [];
  for (const theme of data.themes) {
    for (const axe of theme.axes) {
      for (const d of axe.dates) {
        const id = generateDateId(matiere, theme.titre, d.evenement);
        results.push({
          id,
          matiere,
          theme: theme.titre,
          themeNumero: theme.numero,
          axe: axe.titre,
          date: parseDate(d.date),
          evenement: d.evenement,
          contexte: d.contexte,
          niveau: d.niveau,
        });
      }
    }
  }
  return results;
}

// Chargement synchrone au démarrage du module
const histoire = normalizeFlat(histoireRaw as RawDataPlat, 'histoire');
const geo = normalizeFlat(geoRaw as RawDataPlat, 'geo');
const hggsp = normalizeWithAxes(hggspRaw as RawDataAxes, 'hggsp');

export const ALL_DATES: NormalizedDate[] = [...histoire, ...geo, ...hggsp];

console.log(`[loader] ${ALL_DATES.length} dates (${histoire.length} Histoire, ${geo.length} Géo, ${hggsp.length} HGGSP)`);

// Compat: ancienne fonction async (retourne immédiatement)
export async function loadAllDates(): Promise<NormalizedDate[]> {
  return ALL_DATES;
}

export function getDatesByMatiere(matiere: Matiere, allDates: NormalizedDate[]): NormalizedDate[] {
  return allDates.filter(d => d.matiere === matiere);
}

export function getThemesByMatiere(matiere: Matiere, allDates: NormalizedDate[]): { numero: number; titre: string }[] {
  const seen = new Set<string>();
  const themes: { numero: number; titre: string }[] = [];
  for (const d of allDates.filter(x => x.matiere === matiere)) {
    if (!seen.has(d.theme)) {
      seen.add(d.theme);
      themes.push({ numero: d.themeNumero, titre: d.theme });
    }
  }
  return themes.sort((a, b) => a.numero - b.numero);
}
