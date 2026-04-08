import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchingPair, MatchingQuestionState, NormalizedDate } from '../../types';
import EventContextSheet from '../ui/EventContextSheet';

interface MatchingQuestionProps {
  initialState: MatchingQuestionState;
  dates: NormalizedDate[];
  cellPoints: number;
  onSubmit: (pairs: MatchingPair[]) => void;
  onFinish: () => void;
}

export default function MatchingQuestion({
  initialState,
  dates,
  cellPoints,
  onSubmit,
  onFinish,
}: MatchingQuestionProps) {
  const [pairs, setPairs] = useState<MatchingPair[]>(initialState.pairs);
  const [datePool, setDatePool] = useState(initialState.datePool);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<'playing' | 'validated'>('playing');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sheetNd, setSheetNd] = useState<NormalizedDate | null>(null);

  const theme = dates[0]?.theme ?? '';
  const allMatched = pairs.every(p => p.matched);

  function handleEventTap(i: number) {
    if (phase !== 'playing') return;

    if (pairs[i].matched) {
      // Libérer la date : elle retourne dans le pool
      const freed = pairs[i].assignedDateRaw!;
      // Retrouver l'idx original dans initialState.datePool
      const originalEntry = initialState.datePool.find(e => e.raw === freed);
      const restoredEntry = originalEntry ?? { raw: freed, idx: initialState.datePool.length + i };

      const newPairs = pairs.map((p, idx) =>
        idx === i ? { ...p, matched: false, assignedDateRaw: null } : p
      );
      setDatePool(prev => [...prev, restoredEntry]);
      setPairs(newPairs);
      setSelectedIdx(null);
    } else {
      setSelectedIdx(prev => (prev === i ? null : i));
    }
  }

  function handleChipTap(entry: { raw: string; idx: number }) {
    if (selectedIdx === null || phase !== 'playing') return;

    const newPairs = pairs.map((p, i) =>
      i === selectedIdx ? { ...p, matched: true, assignedDateRaw: entry.raw } : p
    );
    setDatePool(prev => prev.filter(e => e.idx !== entry.idx));
    setPairs(newPairs);
    setSelectedIdx(null);
  }

  function handleValidate() {
    const evaluated: MatchingPair[] = pairs.map(p => ({
      ...p,
      result: p.assignedDateRaw === p.dateRaw ? 'correct' : 'wrong',
    }));
    const correct = evaluated.filter(p => p.result === 'correct').length;
    let s = correct * (cellPoints / 4);
    if (correct === 4) s = Math.round(s * 1.25);
    else s = Math.round(s);

    setPairs(evaluated);
    setPhase('validated');
    setScore(s);
    setCorrectCount(correct);
    onSubmit(evaluated);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Sheet de contexte pour les événements après validation */}
      <EventContextSheet
        nd={sheetNd!}
        open={sheetNd !== null}
        onClose={() => setSheetNd(null)}
      />
      {/* Bandeau header */}
      <div style={{
        margin: '12px 16px 0',
        background: 'rgba(232,184,75,0.08)',
        border: '1px solid rgba(232,184,75,0.25)',
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
          Associer événements et dates
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
          {theme}
        </div>
      </div>

      {/* Zone événements */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pairs.map((pair, i) => {
          const isSelected = selectedIdx === i;
          const isCorrect = pair.result === 'correct';
          const isWrong = pair.result === 'wrong';

          let borderColor = 'var(--border-bright)';
          let bgColor = 'var(--bg-card)';
          if (isSelected) { borderColor = 'var(--gold)'; bgColor = 'rgba(232,184,75,0.08)'; }
          else if (pair.matched && phase === 'playing') { borderColor = 'var(--blue)'; bgColor = 'rgba(75,197,232,0.06)'; }
          else if (isCorrect) { borderColor = 'var(--green)'; bgColor = 'rgba(46,204,113,0.07)'; }
          else if (isWrong) { borderColor = 'var(--red)'; bgColor = 'rgba(231,76,60,0.07)'; }

          return (
            <motion.div
              key={pair.dateId}
              animate={isWrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => {
                  if (phase === 'validated') {
                    const nd = dates.find(d => d.id === pair.dateId);
                    if (nd) setSheetNd(nd);
                  } else {
                    handleEventTap(i);
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: 72,
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* Texte événement */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.35 }}>
                    {pair.evenement}
                  </div>
                  {/* Correction après validation si faux */}
                  {isWrong && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700, marginTop: 4 }}
                    >
                      ✓ {pair.dateRaw}
                    </motion.div>
                  )}
                </div>

                {/* Slot date */}
                <div style={{
                  minWidth: 80,
                  minHeight: 36,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: pair.matched
                    ? `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--blue)'}`
                    : '1px dashed rgba(232,184,75,0.35)',
                  background: pair.matched
                    ? (isCorrect ? 'rgba(46,204,113,0.12)' : isWrong ? 'rgba(231,76,60,0.12)' : 'rgba(75,197,232,0.1)')
                    : isSelected ? 'rgba(232,184,75,0.05)' : 'transparent',
                }}>
                  <AnimatePresence mode="wait">
                    {pair.matched ? (
                      <motion.span
                        key={pair.assignedDateRaw ?? 'empty'}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--blue)',
                          padding: '0 8px',
                          textAlign: 'center',
                        }}
                      >
                        {pair.assignedDateRaw}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isSelected ? 0.7 : 0.35 }}
                        style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}
                      >
                        {isSelected ? '← tap' : '?'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Pool de chips */}
      {phase === 'playing' && (
        <div style={{
          padding: '8px 16px',
          flexShrink: 0,
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Dates disponibles
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            <AnimatePresence>
              {datePool.map(entry => (
                <motion.button
                  key={entry.idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -8 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 280 }}
                  onClick={() => handleChipTap(entry)}
                  disabled={selectedIdx === null}
                  style={{
                    minHeight: 44,
                    minWidth: 70,
                    padding: '8px 14px',
                    background: selectedIdx !== null ? 'var(--bg-surface)' : 'var(--bg-card)',
                    border: `1px solid ${selectedIdx !== null ? 'var(--gold)' : 'var(--border-bright)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: selectedIdx !== null ? 'var(--gold)' : 'var(--text-dim)',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: selectedIdx !== null ? 'pointer' : 'default',
                    transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                  }}
                >
                  {entry.raw}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Panel résultat après validation */}
      {phase === 'validated' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '0 16px 8px',
            padding: '12px 16px',
            background: correctCount === 4 ? 'rgba(46,204,113,0.08)' : 'rgba(232,184,75,0.06)',
            border: `1px solid ${correctCount === 4 ? 'var(--green)' : 'var(--border-bright)'}`,
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '1rem', color: correctCount === 4 ? 'var(--green)' : 'var(--text)', marginBottom: 2 }}>
            {correctCount === 4 ? '✓ Parfait !' : `${correctCount}/4 correct${correctCount > 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            +{score} pts{correctCount === 4 ? ' · Bonus ×1.25 🎯' : ''}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        borderTop: phase === 'playing' ? 'none' : '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {phase === 'playing' && allMatched && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="btn btn-primary btn-full"
            onClick={handleValidate}
          >
            ✓ Valider les associations
          </motion.button>
        )}
        {phase === 'playing' && !allMatched && (
          <div style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            padding: '8px 0',
          }}>
            {selectedIdx !== null
              ? 'Choisis une date ci-dessus'
              : 'Tape un événement pour le sélectionner'}
          </div>
        )}
        {phase === 'validated' && (
          <button
            className="btn btn-secondary btn-full"
            onClick={onFinish}
          >
            {correctCount === 4 ? 'Voir le résultat →' : '✓ J\'ai retenu · Continuer →'}
          </button>
        )}
      </div>
    </div>
  );
}
