/**
 * Génère un ID déterministe pour une date donnée
 * Basé sur djb2 hash (simple, rapide, pas besoin de crypto)
 */
function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit
  }
  return hash.toString(36);
}

export function generateDateId(matiere: string, theme: string, evenement: string): string {
  const key = `${matiere}::${theme}::${evenement}`;
  return djb2(key);
}
