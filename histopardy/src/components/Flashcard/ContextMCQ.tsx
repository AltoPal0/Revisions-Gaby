import { useState } from 'react';
import { motion } from 'framer-motion';

interface ContextMCQProps {
  contexte: string;
  choices: string[];
  onAnswer: (choice: string) => void;
  disabled: boolean;
  correctEvenement?: string;
}

export default function ContextMCQ({ contexte, choices, onAnswer, disabled, correctEvenement }: ContextMCQProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(choice: string) {
    if (disabled) return;
    setSelected(choice);
    onAnswer(choice);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Badge type de question */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: 'rgba(78, 140, 232, 0.15)',
          border: '1px solid rgba(78, 140, 232, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px 10px',
          fontSize: '0.7rem',
          color: '#4e8ce8',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Quel est l'événement ?
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          ×2 si tu trouves aussi la date
        </div>
      </div>

      {/* Contexte affiché */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        fontSize: '0.9rem',
        color: 'var(--text)',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        {contexte}
      </div>

      {/* Choix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {choices.map(choice => {
          const isSelected = selected === choice;
          const isCorrect = disabled && correctEvenement && choice === correctEvenement;
          const isWrong = disabled && isSelected && choice !== correctEvenement;
          return (
            <motion.button
              key={choice}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(choice)}
              style={{
                padding: '12px 14px',
                background: isCorrect
                  ? 'rgba(46,204,113,0.12)'
                  : isWrong
                    ? 'rgba(231,76,60,0.12)'
                    : 'var(--bg-card)',
                border: `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--border-bright)'}`,
                borderRadius: 'var(--radius-sm)',
                color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--text)',
                fontSize: '0.88rem',
                fontWeight: 600,
                textAlign: 'left',
                cursor: disabled ? 'default' : 'pointer',
                lineHeight: 1.4,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ flex: 1 }}>{choice}</span>
              {isCorrect && <span>✓</span>}
              {isWrong && <span>✗</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
