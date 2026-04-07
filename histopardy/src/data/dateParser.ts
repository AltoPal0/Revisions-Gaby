import type { ParsedDate } from '../types';
import { MOIS_FR } from '../lib/constants';

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseMois(token: string): number | undefined {
  const norm = normalizeStr(token);
  return MOIS_FR[norm] ?? MOIS_FR[token.toLowerCase()];
}

function parseDay(token: string): number {
  // "1er", "2e", "29", etc.
  return parseInt(token.replace(/er$|e$/, ''), 10);
}

/**
 * Parse tous les formats de date rencontrés dans les JSON BFI.
 *
 * Formats gérés (par ordre de spécificité décroissante) :
 * R1: "JJ mois AAAA - JJ mois AAAA"   ex: "24 juin 1948 - 12 mai 1949"
 * R2: "JJ mois - JJ mois AAAA"         ex: "7 avril - 17 juillet 1994"
 * R3: "JJ et JJ mois AAAA"             ex: "6 et 9 août 1945"
 * R4: "JJ-JJ mois AAAA"                ex: "29-30 septembre 1938"
 * R5: "mois-mois AAAA"                 ex: "mai-juin 1968"
 * R6: "JJer mois AAAA"                 ex: "1er septembre 1939"
 * R7: "mois AAAA"                      ex: "octobre 1962"
 * R8: "AAAA-AAAA(s)"                   ex: "1944-1946", "1945-1970s"
 * R9: "AAAAs"                           ex: "1960s"
 * R10: "AAAA"                           ex: "1947"
 */
export function parseDate(raw: string): ParsedDate {
  const s = raw.trim();

  // R1: "JJ mois AAAA - JJ mois AAAA"
  const r1 = s.match(
    /^(\d{1,2})(?:er|e)?\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})\s*-\s*(\d{1,2})(?:er|e)?\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i
  );
  if (r1) {
    const day = parseDay(r1[1]);
    const month = parseMois(r1[2]);
    const year = parseInt(r1[3], 10);
    const dayEnd = parseDay(r1[4]);
    const monthEnd = parseMois(r1[5]);
    const yearEnd = parseInt(r1[6], 10);
    return {
      raw, year, yearEnd, month, monthEnd, day, dayEnd,
      hasYear: true, hasMonth: month !== undefined, hasDay: !isNaN(day),
      isPeriod: true,
    };
  }

  // R2: "JJ mois - JJ mois AAAA"
  const r2 = s.match(
    /^(\d{1,2})(?:er|e)?\s+([a-zA-ZÀ-ÿ]+)\s*-\s*(\d{1,2})(?:er|e)?\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i
  );
  if (r2) {
    const day = parseDay(r2[1]);
    const month = parseMois(r2[2]);
    const year = parseInt(r2[5], 10);
    const dayEnd = parseDay(r2[3]);
    const monthEnd = parseMois(r2[4]);
    return {
      raw, year, month, monthEnd, day, dayEnd,
      hasYear: true, hasMonth: month !== undefined, hasDay: !isNaN(day),
      isPeriod: true,
    };
  }

  // R3: "JJ et JJ mois AAAA"
  const r3 = s.match(
    /^(\d{1,2})(?:er|e)?\s+et\s+(\d{1,2})(?:er|e)?\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i
  );
  if (r3) {
    const day = parseDay(r3[1]);
    const dayEnd = parseDay(r3[2]);
    const month = parseMois(r3[3]);
    const year = parseInt(r3[4], 10);
    return {
      raw, year, month, day, dayEnd,
      hasYear: true, hasMonth: month !== undefined, hasDay: !isNaN(day),
      isPeriod: false,
    };
  }

  // R4: "JJ-JJ mois AAAA"
  const r4 = s.match(
    /^(\d{1,2})-(\d{1,2})\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i
  );
  if (r4) {
    const day = parseInt(r4[1], 10);
    const dayEnd = parseInt(r4[2], 10);
    const month = parseMois(r4[3]);
    const year = parseInt(r4[4], 10);
    return {
      raw, year, month, day, dayEnd,
      hasYear: true, hasMonth: month !== undefined, hasDay: true,
      isPeriod: false,
    };
  }

  // R5: "mois-mois AAAA" - deux tokens qui sont tous les deux des mois
  const r5 = s.match(/^([a-zA-ZÀ-ÿ]+)-([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i);
  if (r5) {
    const month = parseMois(r5[1]);
    const monthEnd = parseMois(r5[2]);
    const year = parseInt(r5[3], 10);
    if (month !== undefined && monthEnd !== undefined) {
      return {
        raw, year, month, monthEnd,
        hasYear: true, hasMonth: true, hasDay: false,
        isPeriod: true,
      };
    }
  }

  // R6: "JJ mois AAAA" ou "JJer mois AAAA"
  const r6 = s.match(
    /^(\d{1,2})(?:er|e)?\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i
  );
  if (r6) {
    const day = parseInt(r6[1], 10);
    const month = parseMois(r6[2]);
    const year = parseInt(r6[3], 10);
    if (month !== undefined) {
      return {
        raw, year, month, day,
        hasYear: true, hasMonth: true, hasDay: true,
        isPeriod: false,
      };
    }
  }

  // R7: "mois AAAA"
  const r7 = s.match(/^([a-zA-ZÀ-ÿ]+)\s+(\d{4})$/i);
  if (r7) {
    const month = parseMois(r7[1]);
    const year = parseInt(r7[2], 10);
    if (month !== undefined) {
      return {
        raw, year, month,
        hasYear: true, hasMonth: true, hasDay: false,
        isPeriod: false,
      };
    }
  }

  // R8: "AAAA-AAAA" ou "AAAA-AAAAs" ou "AAAA-1970s"
  const r8 = s.match(/^(\d{4})-(\d{4})s?$/i);
  if (r8) {
    return {
      raw, year: parseInt(r8[1], 10), yearEnd: parseInt(r8[2], 10),
      hasYear: true, hasMonth: false, hasDay: false,
      isPeriod: true,
    };
  }

  // R9: "AAAAs"
  const r9 = s.match(/^(\d{4})s$/i);
  if (r9) {
    return {
      raw, year: parseInt(r9[1], 10),
      hasYear: true, hasMonth: false, hasDay: false,
      isPeriod: true,
    };
  }

  // R10: "AAAA" - fallback
  const r10 = s.match(/^(\d{4})$/);
  if (r10) {
    return {
      raw, year: parseInt(r10[1], 10),
      hasYear: true, hasMonth: false, hasDay: false,
      isPeriod: false,
    };
  }

  // Fallback absolu: essayer d'extraire une année
  const yearMatch = s.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
  console.warn(`[dateParser] Format non reconnu: "${raw}", fallback year=${year}`);
  return {
    raw, year,
    hasYear: true, hasMonth: false, hasDay: false,
    isPeriod: false,
  };
}
