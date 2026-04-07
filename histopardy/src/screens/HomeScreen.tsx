import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Layout from '../components/Layout';

export default function HomeScreen() {
  const setScreen = useGameStore(s => s.setScreen);

  return (
    <Layout
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        background: 'radial-gradient(ellipse at 50% 30%, #101c3a 0%, #070b14 70%)',
        padding: '0 24px',
      }}
    >
      {/* Décoration fond */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,184,75,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', damping: 15 }}
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <motion.div
          animate={{ textShadow: ['0 0 20px rgba(232,184,75,0.3)', '0 0 50px rgba(232,184,75,0.7)', '0 0 20px rgba(232,184,75,0.3)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontSize: 'clamp(3rem, 14vw, 5rem)',
            fontWeight: 900,
            color: 'var(--gold)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          Histo
        </motion.div>
        <div style={{
          fontSize: 'clamp(3rem, 14vw, 5rem)',
          fontWeight: 900,
          color: 'var(--text)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          Pardy
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 12,
            color: 'var(--text-dim)',
            fontSize: '0.95rem',
            letterSpacing: '0.05em',
          }}
        >
          Révisions Terminale BFI
        </motion.p>
      </motion.div>

      {/* Boutons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}
      >
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={() => setScreen('playerSelect')}
          style={{ fontSize: '1.3rem', letterSpacing: '0.02em' }}
        >
          🎯 Jouer
        </button>

        <button
          className="btn btn-secondary btn-full"
          onClick={() => setScreen('scores')}
        >
          🏆 Tableau des scores
        </button>
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'absolute',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
        }}
      >
        v1.0 · Histoire, Géo, HGGSP
      </motion.p>
    </Layout>
  );
}
