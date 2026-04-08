import { motion, AnimatePresence } from 'framer-motion';
import type { NormalizedDate } from '../../types';

interface EventContextSheetProps {
  nd: NormalizedDate;
  open: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet qui affiche l'événement, sa date et son contexte.
 * S'ouvre depuis n'importe quel panneau de réponse.
 */
export default function EventContextSheet({ nd, open, onClose }: EventContextSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 100,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 101,
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-bright)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
              maxHeight: '75dvh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Poignée */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-bright)' }} />
            </div>

            {/* Contenu scrollable */}
            <div style={{ overflow: 'auto', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Événement + date */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
              }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', lineHeight: 1.3, marginBottom: 8 }}>
                  {nd.evenement}
                </div>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(232,184,75,0.12)',
                  border: '1px solid rgba(232,184,75,0.3)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: 'var(--gold)',
                }}>
                  {nd.date.raw}
                </div>
              </div>

              {/* Contexte */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Contexte
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  {nd.contexte}
                </div>
              </div>

              {/* Thème */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 2 }}>
                {nd.theme}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
