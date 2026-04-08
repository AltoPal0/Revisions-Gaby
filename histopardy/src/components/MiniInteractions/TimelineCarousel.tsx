import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { NormalizedDate, ParsedDate } from '../../types';

const CARD_W = 140;
const CARD_GAP = 12;
const STEP = CARD_W + CARD_GAP;

interface TimelineCarouselProps {
  targetNd: NormalizedDate;
  helperNds: NormalizedDate[];
  onResolve: (success: boolean) => void;
}

/**
 * Compare deux dates de façon chronologique.
 * Retourne 0 (ambigu) quand l'une des deux est une date "année seule"
 * et que l'autre est dans la même année — on ne peut pas départager.
 */
function compareDates(a: ParsedDate, b: ParsedDate): number {
  if (a.year !== b.year) return a.year - b.year;
  // Même année : si l'un des deux n'a pas de mois, ordre indéterminable
  if (a.month === undefined || b.month === undefined) return 0;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day === undefined || b.day === undefined) return 0;
  return a.day - b.day;
}

export default function TimelineCarousel({ targetNd, helperNds, onResolve }: TimelineCarouselProps) {
  // Trier les helpers par date (sans la cible)
  const sorted = [...helperNds].sort((a, b) => {
    const cmp = compareDates(a.date, b.date);
    if (cmp !== 0) return cmp;
    // Départager les ambigus : année seule avant les dates avec mois
    return (a.date.month ?? 0) - (b.date.month ?? 0);
  });

  // Position initiale du curseur : entre 0 et sorted.length (gap à insérer)
  // 0 = avant le premier, sorted.length = après le dernier
  const [gapIndex, setGapIndex] = useState(0);
  const [validated, setValidated] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartGap = useRef<number>(0);

  // Plage de positions correctes :
  // minCorrect = nombre de helpers qui sont AVANT la cible de façon certaine
  // maxCorrect = nombre de helpers qui ne sont PAS APRÈS la cible de façon certaine
  const minCorrect = sorted.filter(d => compareDates(d.date, targetNd.date) < 0).length;
  const maxCorrect = sorted.filter(d => compareDates(d.date, targetNd.date) <= 0).length;

  function validate() {
    const success = gapIndex >= minCorrect && gapIndex <= maxCorrect;
    setValidated(true);
    setResult(success);
  }

  // Handlers de drag sur la piste
  function onDragStart(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
    dragStartGap.current = gapIndex;
  }

  function onDragMove(e: React.PointerEvent) {
    if (!(e.buttons & 1)) return;
    const delta = e.clientX - dragStartX.current;
    const steps = Math.round(delta / STEP);
    const newGap = Math.max(0, Math.min(sorted.length, dragStartGap.current - steps));
    setGapIndex(newGap);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>
          Place cette date au bon endroit sur la frise
        </div>
        <div style={{
          display: 'inline-block',
          background: 'rgba(232,184,75,0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 12px',
          fontSize: '1rem',
          fontWeight: 900,
          color: 'var(--gold)',
        }}>
          {targetNd.date.raw} — {targetNd.evenement}
        </div>
      </div>

      {/* Carte cible fixe */}
      <div style={{
        background: 'rgba(232,184,75,0.12)',
        border: '2px solid var(--gold)',
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Carte à placer</div>
        <div style={{ fontWeight: 900, color: 'var(--gold)', fontSize: '1rem' }}>{targetNd.date.raw}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 3, lineHeight: 1.3 }}>{targetNd.evenement}</div>
      </div>

      {/* Frise */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Ligne de temps */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2,
          background: 'var(--border)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Zone de drag */}
        <div
          ref={trackRef}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: CARD_GAP,
            padding: '8px 4px',
            overflowX: 'auto',
            cursor: validated ? 'default' : 'grab',
            userSelect: 'none',
            touchAction: 'pan-x',
          }}
        >
          {sorted.map((nd, i) => (
            <>
              {/* Slot d'insertion avant cette carte */}
              {i === gapIndex && !validated && (
                <motion.div
                  key="gap-indicator"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 24,
                    gap: 2,
                  }}
                >
                  <div style={{ color: 'var(--gold)', fontSize: '1.1rem', lineHeight: 1 }}>▼</div>
                  <div style={{ width: 2, height: 40, background: 'var(--gold)' }} />
                </motion.div>
              )}
              {i === gapIndex && validated && (
                <motion.div
                  key="gap-result"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 24,
                    gap: 2,
                  }}
                >
                  <div style={{ color: result ? 'var(--green)' : 'var(--red)', fontSize: '1.1rem' }}>
                    {result ? '✓' : '✗'}
                  </div>
                  <div style={{ width: 2, height: 40, background: result ? 'var(--green)' : 'var(--red)' }} />
                </motion.div>
              )}

              {/* Carte helper */}
              <div
                key={nd.id}
                style={{
                  minWidth: CARD_W,
                  maxWidth: CARD_W,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 8px',
                  position: 'relative',
                  zIndex: 1,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>
                  {nd.date.raw}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>
                  {nd.evenement.slice(0, 50)}{nd.evenement.length > 50 ? '…' : ''}
                </div>
              </div>
            </>
          ))}

          {/* Slot en fin si gapIndex = sorted.length */}
          {gapIndex === sorted.length && !validated && (
            <motion.div
              key="gap-end"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 24,
                gap: 2,
              }}
            >
              <div style={{ color: 'var(--gold)', fontSize: '1.1rem', lineHeight: 1 }}>▼</div>
              <div style={{ width: 2, height: 40, background: 'var(--gold)' }} />
            </motion.div>
          )}
          {gapIndex === sorted.length && validated && (
            <motion.div
              key="gap-end-result"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 24,
                gap: 2,
              }}
            >
              <div style={{ color: result ? 'var(--green)' : 'var(--red)', fontSize: '1.1rem' }}>
                {result ? '✓' : '✗'}
              </div>
              <div style={{ width: 2, height: 40, background: result ? 'var(--green)' : 'var(--red)' }} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Boutons navigation + valider */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          disabled={gapIndex === 0 || validated}
          onClick={() => setGapIndex(g => Math.max(0, g - 1))}
        >← Avant</button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          disabled={validated}
          onClick={validate}
        >✓ Valider</button>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          disabled={gapIndex === sorted.length || validated}
          onClick={() => setGapIndex(g => Math.min(sorted.length, g + 1))}
        >Après →</button>
      </div>

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
            {result ? '✓ Bien placé ! +points' : minCorrect === maxCorrect ? `✗ Elle était à la position ${minCorrect + 1}…` : `✗ Elle était entre les positions ${minCorrect + 1} et ${maxCorrect + 1}…`}
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
