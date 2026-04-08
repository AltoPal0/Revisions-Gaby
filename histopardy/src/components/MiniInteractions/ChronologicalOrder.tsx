import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NormalizedDate, ParsedDate } from '../../types';

interface ChronologicalOrderProps {
  targetNd: NormalizedDate;
  helperNds: NormalizedDate[];
  onResolve: (success: boolean) => void;
}

/**
 * Compare deux dates chronologiquement.
 * Retourne 0 (ambigu) quand une des deux est "année seule" dans la même année
 * — on ne peut pas déterminer l'ordre à l'intérieur d'une même année sans mois.
 */
function compareDates(a: ParsedDate, b: ParsedDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month === undefined || b.month === undefined) return 0;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day === undefined || b.day === undefined) return 0;
  return a.day - b.day;
}

/**
 * Vérifie si un ordre est chronologiquement valide :
 * pour chaque paire (i, j) avec i < j dans l'ordre, la date[i] ne doit pas
 * être CERTIFIABLEMENT après la date[j].
 */
function isValidOrder(ids: string[], ndMap: Record<string, NormalizedDate>): boolean {
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (compareDates(ndMap[ids[i]].date, ndMap[ids[j]].date) > 0) return false;
    }
  }
  return true;
}

export default function ChronologicalOrder({ targetNd, helperNds, onResolve }: ChronologicalOrderProps) {
  // Prendre 2 helpers + la cible → 3 cartes total
  const three = [targetNd, ...helperNds.slice(0, 2)];
  // Ordre de référence pour l'affichage après validation (utilise ?? 0 pour départager les ex-æquo)
  const correctOrder = [...three].sort((a, b) => {
    const cmp = compareDates(a.date, b.date);
    if (cmp !== 0) return cmp;
    return (a.date.month ?? 0) - (b.date.month ?? 0);
  }).map(d => d.id);

  const [order, setOrder] = useState<string[]>(() => shuffle(three.map(d => d.id)));
  const [validated, setValidated] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  const ndMap = Object.fromEntries(three.map(d => [d.id, d]));

  function moveUp(i: number) {
    if (i === 0 || validated) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setOrder(next);
  }

  function moveDown(i: number) {
    if (i === order.length - 1 || validated) return;
    const next = [...order];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setOrder(next);
  }

  function validate() {
    // Valide si aucune paire n'est dans un ordre certifiablement faux
    const success = isValidOrder(order, ndMap);
    setValidated(true);
    setResult(success);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* En-tête */}
      <div style={{
        background: 'rgba(232,184,75,0.08)',
        border: '1px solid rgba(232,184,75,0.25)',
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Exercice de rattrapage
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 700 }}>
          Place ces événements dans l'ordre chronologique ↓
        </div>
      </div>

      {/* Cartes ordonnables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence>
          {order.map((id, i) => {
            const nd = ndMap[id];
            const isTarget = id === targetNd.id;
            const correctPos = correctOrder.indexOf(id);
            const isCorrectPos = validated && correctPos === i;
            const isWrongPos = validated && correctPos !== i;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 8,
                }}
              >
                {/* Boutons de déplacement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0 || validated}
                    style={{
                      flex: 1,
                      width: 32,
                      background: i === 0 || validated ? 'var(--bg)' : 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: i === 0 || validated ? 'var(--text-muted)' : 'var(--text)',
                      cursor: i === 0 || validated ? 'default' : 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >↑</button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === order.length - 1 || validated}
                    style={{
                      flex: 1,
                      width: 32,
                      background: i === order.length - 1 || validated ? 'var(--bg)' : 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: i === order.length - 1 || validated ? 'var(--text-muted)' : 'var(--text)',
                      cursor: i === order.length - 1 || validated ? 'default' : 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >↓</button>
                </div>

                {/* Carte */}
                <div style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: isCorrectPos
                    ? 'rgba(46,204,113,0.1)'
                    : isWrongPos
                      ? 'rgba(231,76,60,0.08)'
                      : isTarget
                        ? 'rgba(232,184,75,0.08)'
                        : 'var(--bg-card)',
                  border: `1px solid ${
                    isCorrectPos ? 'var(--green)'
                    : isWrongPos ? 'var(--red)'
                    : isTarget ? 'var(--gold)'
                    : 'var(--border-bright)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isTarget ? 'var(--gold)' : 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: 2,
                  }}>
                    {validated ? nd.date.raw : isTarget ? '? → ' + nd.date.raw : '?'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>
                    {nd.evenement}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bouton valider */}
      {!validated && (
        <button
          className="btn btn-primary btn-full"
          onClick={validate}
        >
          ✓ Valider l'ordre
        </button>
      )}

      {validated && result !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div style={{
            textAlign: 'center',
            padding: '10px',
            color: result ? 'var(--green)' : 'var(--red)',
            fontWeight: 800,
            fontSize: '0.95rem',
          }}>
            {result ? '✓ Bon ordre ! +points' : '✗ Pas tout à fait…'}
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={() => onResolve(result)}
          >
            Continuer →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
