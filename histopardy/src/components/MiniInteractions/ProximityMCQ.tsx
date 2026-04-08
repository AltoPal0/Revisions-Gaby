import { useState } from 'react';
import { motion } from 'framer-motion';
import type { NormalizedDate } from '../../types';

interface ProximityMCQProps {
  targetNd: NormalizedDate;
  helperNds: NormalizedDate[];
  onResolve: (success: boolean) => void;
}

export default function ProximityMCQ({ targetNd, helperNds, onResolve }: ProximityMCQProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Trouver les 4 choix : 3 les plus proches + 1 distractor éloigné
  const sorted = [...helperNds].sort((a, b) => {
    const distA = Math.abs(a.date.year - targetNd.date.year) * 400
      + Math.abs((a.date.month ?? 6) - (targetNd.date.month ?? 6)) * 31
      + Math.abs((a.date.day ?? 15) - (targetNd.date.day ?? 15));
    const distB = Math.abs(b.date.year - targetNd.date.year) * 400
      + Math.abs((b.date.month ?? 6) - (targetNd.date.month ?? 6)) * 31
      + Math.abs((b.date.day ?? 15) - (targetNd.date.day ?? 15));
    return distA - distB;
  });
  // La bonne réponse = la date la plus proche
  const closest = sorted[0];
  // 3 autres choices : 1-2 proches + 1 loin
  const others = [sorted[1], sorted[2], sorted[sorted.length - 1]].filter(Boolean);
  const allChoices = shuffle([closest, ...others]).slice(0, 4);

  const disabled = selected !== null;

  function handleSelect(nd: NormalizedDate) {
    if (disabled) return;
    setSelected(nd.id);
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
        <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>
          Cette date est la plus proche de quel événement ?
        </div>
        <div style={{
          display: 'inline-block',
          background: 'rgba(232,184,75,0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          fontSize: '1rem',
          fontWeight: 900,
          color: 'var(--gold)',
        }}>
          {targetNd.date.raw}
        </div>
      </div>

      {/* 4 cartes-choix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allChoices.map(nd => {
          const isSelected = selected === nd.id;
          const isCorrect = disabled && nd.id === closest.id;
          const isWrong = disabled && isSelected && nd.id !== closest.id;
          return (
            <motion.button
              key={nd.id}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(nd)}
              style={{
                padding: '10px 12px',
                background: isCorrect
                  ? 'rgba(46,204,113,0.1)'
                  : isWrong
                    ? 'rgba(231,76,60,0.1)'
                    : 'var(--bg-card)',
                border: `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--border-bright)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: disabled ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--gold)',
                fontWeight: 700,
                marginBottom: 2,
              }}>
                {nd.date.raw}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--text)',
                fontWeight: 600,
                lineHeight: 1.3,
              }}>
                {nd.evenement}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
                {nd.contexte.slice(0, 80)}{nd.contexte.length > 80 ? '…' : ''}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Bouton continuer après réponse */}
      {selected && !done && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="btn btn-primary btn-full"
          onClick={() => {
            setDone(true);
            onResolve(selected === closest.id);
          }}
        >
          {selected === closest.id ? '✓ Bien joué ! Continuer →' : '→ Continuer'}
        </motion.button>
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
