import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useCountUp } from '../hooks/useCountUp';
import { MATIERE_COLORS } from '../lib/constants';
import Layout from '../components/Layout';

export default function BoardScreen() {
  const { board, config, selectCell, endGame } = useGameStore();
  const { players } = usePlayerStore();

  if (!board || !config) return null;

  // Sécurité: si le board est vide (données pas chargées), ne pas crasher
  if (board.columns.length === 0) {
    return (
      <Layout style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div>Données non chargées</div>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => useGameStore.getState().goHome()}>
            Retour à l'accueil
          </button>
        </div>
      </Layout>
    );
  }

  const [expandedCol, setExpandedCol] = useState<number | null>(null);
  const totalCells = board.cells.flat().length;
  const playedCells = board.cells.flat().filter(c => c.played).length;

  return (
    <Layout style={{ overflow: 'hidden' }}>
      {/* Header: scores */}
      <div style={{
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          {config.playerIds.map((pid, i) => {
            const player = players[pid];
            const score = board.scores[pid] ?? 0;
            const isActive = i === board.currentPlayerIndex;
            return (
              <PlayerScoreBadge
                key={pid}
                name={player?.name ?? '?'}
                score={score}
                isActive={isActive}
                isSolo={config.playerIds.length === 1}
              />
            );
          })}

          {/* Progress */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {playedCells}/{totalCells}
            </div>
          </div>
        </div>

        {/* Active player indicator (duel) */}
        {config.mode === 'duel' && (
          <motion.div
            key={board.currentPlayerIndex}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 6, textAlign: 'center', fontSize: '0.8rem', color: 'var(--gold)' }}
          >
            Tour de {players[config.playerIds[board.currentPlayerIndex]]?.name}
          </motion.div>
        )}
      </div>

      {/* Board grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px',
        overscrollBehavior: 'contain',
      }}>
        {/* Tooltip titre complet */}
        <AnimatePresence>
          {expandedCol !== null && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedCol(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 50,
                }}
              />
              {/* Popup */}
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                  position: 'fixed',
                  top: 'max(80px, env(safe-area-inset-top, 0px) + 80px)',
                  left: 16,
                  right: 16,
                  zIndex: 51,
                  background: 'var(--bg-surface)',
                  border: `1px solid ${MATIERE_COLORS[board.columns[expandedCol].matiere]}`,
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: `0 4px 24px ${MATIERE_COLORS[board.columns[expandedCol].matiere]}30`,
                }}
              >
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: MATIERE_COLORS[board.columns[expandedCol].matiere],
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    Thème · {board.columns[expandedCol].matiere}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.3 }}>
                    {board.columns[expandedCol].theme}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedCol(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >✕</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${board.columns.length}, minmax(0, 1fr))`,
          gap: 6,
          marginBottom: 6,
        }}>
          {board.columns.map((col, i) => {
            const expanded = expandedCol === i;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setExpandedCol(expanded ? null : i)}
                style={{
                  background: expanded ? 'var(--bg-card)' : 'var(--bg-surface)',
                  border: `1px solid ${expanded ? MATIERE_COLORS[col.matiere] : MATIERE_COLORS[col.matiere] + '40'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 6px',
                  textAlign: 'center',
                  minHeight: 52,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: MATIERE_COLORS[col.matiere],
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 'clamp(0.6rem, 2.5vw, 0.75rem)',
                  color: 'var(--text-dim)',
                  lineHeight: 1.2,
                  fontWeight: 600,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {abbreviateTheme(col.theme)}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Cells */}
        {board.cells.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${board.columns.length}, minmax(0, 1fr))`,
              gap: 6,
              marginBottom: 6,
            }}
          >
            {row.map((cell, ci) => {
              const played = cell.played;
              const delay = ri * 0.06 + ci * 0.04;
              return (
                <motion.button
                  key={ci}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay, type: 'spring', damping: 15 }}
                  onClick={() => !played && selectCell(ri, ci)}
                  style={{
                    minHeight: 'clamp(48px, 11vw, 64px)',
                    background: played ? 'var(--bg)' : 'var(--bg-card)',
                    border: `1px solid ${played ? 'var(--border)' : 'var(--border-bright)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: played ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  whileHover={!played ? { scale: 1.04, boxShadow: '0 0 14px rgba(232,184,75,0.25)' } : {}}
                  whileTap={!played ? { scale: 0.96 } : {}}
                >
                  {played ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {cell.earnedPoints !== undefined ? `+${cell.earnedPoints}` : '—'}
                    </span>
                  ) : (
                    <span style={{
                      color: 'var(--gold)',
                      fontWeight: 900,
                      fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)',
                      letterSpacing: '-0.01em',
                    }}>
                      {cell.points}
                    </span>
                  )}

                  {/* Glow idle pour les cases jouables */}
                  {!played && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: delay }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'var(--radius-sm)',
                        background: `linear-gradient(135deg, ${MATIERE_COLORS[board.columns[ci].matiere]}08, transparent)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 10,
        flexShrink: 0,
      }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, fontSize: '0.85rem' }}
          onClick={endGame}
        >
          Terminer
        </button>
      </div>
    </Layout>
  );
}

function PlayerScoreBadge({ name, score, isActive, isSolo }: {
  name: string;
  score: number;
  isActive: boolean;
  isSolo: boolean;
}) {
  const displayScore = useCountUp(score);

  return (
    <motion.div
      animate={isActive && !isSolo ? {
        boxShadow: ['0 0 0px rgba(232,184,75,0)', '0 0 12px rgba(232,184,75,0.4)', '0 0 0px rgba(232,184,75,0)'],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{
        flex: 1,
        background: 'var(--bg-card)',
        border: `1px solid ${isActive && !isSolo ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>{name}</div>
      <div style={{
        fontSize: 'clamp(1rem, 4vw, 1.3rem)',
        fontWeight: 900,
        color: isActive && !isSolo ? 'var(--gold)' : 'var(--text)',
        letterSpacing: '-0.02em',
      }}>
        {displayScore}
      </div>
    </motion.div>
  );
}

function abbreviateTheme(theme: string): string {
  // Raccourcir les thèmes trop longs pour la colonne
  const maxLen = 40;
  if (theme.length <= maxLen) return theme;
  return theme.slice(0, maxLen - 1) + '…';
}
