import { motion } from 'framer-motion';
import type { NormalizedDate } from '../../types';

interface FlashcardProps {
  nd: NormalizedDate;
  flipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ nd, flipped, onFlip }: FlashcardProps) {
  return (
    <div
      style={{
        perspective: '1000px',
        width: '100%',
        maxWidth: 380,
        height: 200,
        margin: '0 auto',
        cursor: flipped ? 'default' : 'pointer',
      }}
      onClick={!flipped ? onFlip : undefined}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Face avant - événement */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {nd.matiere.toUpperCase()} · Niveau {nd.niveau}
            </div>
            <h3 style={{ color: 'var(--text)', lineHeight: 1.3, fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)' }}>
              {nd.evenement}
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            {nd.contexte}
          </p>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '0.05em' }}>
              Appuie pour deviner la date ↓
            </span>
          </div>
        </div>

        {/* Face arrière - indice de date */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--gold)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {nd.evenement}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', textAlign: 'center' }}>
            Quelle est la date ?
          </div>
          {nd.date.hasMonth && nd.date.hasDay && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Jour · Mois · Année
            </div>
          )}
          {nd.date.hasMonth && !nd.date.hasDay && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Mois · Année
            </div>
          )}
          {!nd.date.hasMonth && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Année
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
