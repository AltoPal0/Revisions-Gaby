import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { GameMode, Matiere } from '../types';
import { MATIERE_LABELS, MATIERE_COLORS } from '../lib/constants';
import Layout from '../components/Layout';

const MATIERES: Matiere[] = ['histoire', 'geo', 'hggsp'];

export default function ModeSelectScreen() {
  const { setScreen, startGame, pendingPlayerIds: playerIds, dataReady } = useGameStore();
  const canDuel = playerIds.length >= 2;

  const [mode, setMode] = useState<GameMode>(canDuel ? 'duel' : 'solo');
  const [selectedMatieres, setSelectedMatieres] = useState<Matiere[]>(['histoire']);

  function toggleMatiere(m: Matiere) {
    setSelectedMatieres(prev =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter(x => x !== m) : prev
        : [...prev, m]
    );
  }

  function handleStart() {
    if (!playerIds.length || !selectedMatieres.length) return;
    const activePlayers = mode === 'solo' ? [playerIds[0]] : playerIds;
    startGame({ mode, playerIds: activePlayers, matieres: selectedMatieres });
  }

  return (
    <Layout style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        gap: 12,
        borderBottom: '1px solid var(--border)',
      }}>
        <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setScreen('playerSelect')}>
          ←
        </button>
        <h2>Configuration</h2>
      </div>

      <div style={{ flex: 1, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Mode */}
        <section>
          <h3 style={{ marginBottom: 12, color: 'var(--text-dim)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Mode de jeu
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['solo', 'duel'] as GameMode[]).map(m => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(m)}
                disabled={m === 'duel' && !canDuel}
                style={{
                  padding: '16px 12px',
                  background: mode === m ? 'rgba(232,184,75,0.12)' : 'var(--bg-card)',
                  border: `1px solid ${mode === m ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: m === 'duel' && !canDuel ? 'default' : 'pointer',
                  opacity: m === 'duel' && !canDuel ? 0.4 : 1,
                  textAlign: 'center',
                  minHeight: 72,
                }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>
                  {m === 'solo' ? '🎮' : '⚔️'}
                </div>
                <div style={{ fontWeight: 700, color: mode === m ? 'var(--gold)' : 'var(--text)' }}>
                  {m === 'solo' ? 'Solo' : 'Duel'}
                </div>
                {m === 'duel' && !canDuel && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    2+ joueurs requis
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Matière */}
        <section>
          <h3 style={{ marginBottom: 12, color: 'var(--text-dim)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Matière
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MATIERES.map(m => {
              const isSelected = selectedMatieres.includes(m);
              const color = MATIERE_COLORS[m];
              return (
                <motion.button
                  key={m}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleMatiere(m)}
                  style={{
                    padding: '14px 18px',
                    background: isSelected ? `${color}18` : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    minHeight: 56,
                  }}
                >
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: isSelected ? color : 'var(--border)',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 700, color: isSelected ? color : 'var(--text)' }}>
                    {MATIERE_LABELS[m]}
                  </span>
                  {isSelected && <span style={{ marginLeft: 'auto', color }}>✓</span>}
                </motion.button>
              );
            })}

            {/* Mix */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedMatieres(['histoire', 'geo', 'hggsp'])}
              style={{
                padding: '14px 18px',
                background: selectedMatieres.length === 3 ? 'rgba(232,184,75,0.1)' : 'var(--bg-card)',
                border: `1px solid ${selectedMatieres.length === 3 ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                minHeight: 56,
              }}
            >
              <div style={{ fontSize: '1rem' }}>🌍</div>
              <span style={{ fontWeight: 700, color: selectedMatieres.length === 3 ? 'var(--gold)' : 'var(--text)' }}>
                Mix complet
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                Tout mélangé
              </span>
            </motion.button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
      }}>
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleStart}
          disabled={!selectedMatieres.length || !dataReady}
        >
          {dataReady ? 'Lancer la partie 🚀' : 'Chargement des données…'}
        </button>
      </div>
    </Layout>
  );
}
