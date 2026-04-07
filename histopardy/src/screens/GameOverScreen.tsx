import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import Confetti from '../components/ui/Confetti';
import Layout from '../components/Layout';

export default function GameOverScreen() {
  const { board, config, goHome } = useGameStore();
  const { players } = usePlayerStore();

  if (!board || !config) return null;

  const results = config.playerIds
    .map(id => ({ player: players[id], score: board.scores[id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const winner = results[0];
  const isTie = results.length > 1 && results[0].score === results[1].score;

  return (
    <Layout style={{
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      gap: 0,
      background: 'radial-gradient(ellipse at 50% 30%, #101c3a 0%, #070b14 70%)',
    }}>
      <Confetti active={true} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 14 }}
        style={{ textAlign: 'center', width: '100%', maxWidth: 360 }}
      >
        {/* Trophée */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: '4rem', marginBottom: 16 }}
        >
          {isTie ? '🤝' : '🏆'}
        </motion.div>

        <h1 style={{ marginBottom: 4, fontSize: 'clamp(1.6rem, 7vw, 2.2rem)' }}>
          {isTie ? 'Égalité !' : 'Bravo !'}
        </h1>
        {!isTie && winner.player && (
          <p style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 24, fontSize: '1.1rem' }}>
            {winner.player.name} remporte la partie
          </p>
        )}

        {/* Résultats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {results.map(({ player, score }, i) => (
            <motion.div
              key={player?.id ?? i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: i === 0 ? 'rgba(232,184,75,0.1)' : 'var(--bg-card)',
                border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </span>
              <span style={{ flex: 1, fontWeight: 700, textAlign: 'left' }}>
                {player?.name ?? '?'}
              </span>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: i === 0 ? 'var(--gold)' : 'var(--text)' }}>
                {score} pts
              </span>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => useGameStore.getState().setScreen('modeSelect')}
          >
            Rejouer 🔄
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={goHome}
          >
            Accueil
          </button>
        </div>
      </motion.div>
    </Layout>
  );
}
