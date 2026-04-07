import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import Layout from '../components/Layout';

type Tab = 'classement' | 'stats';

export default function ScoresScreen() {
  const { players } = usePlayerStore();
  const setScreen = useGameStore(s => s.setScreen);
  const [tab, setTab] = useState<Tab>('classement');

  const playerList = Object.values(players).sort((a, b) => b.totalScore - a.totalScore);

  // Calculer les dates les plus ratées parmi tous les joueurs
  const dateFails: Record<string, { dateId: string; fails: number; attempts: number }> = {};
  for (const p of playerList) {
    for (const [dateId, k] of Object.entries(p.dateKnowledge)) {
      if (!dateFails[dateId]) dateFails[dateId] = { dateId, fails: 0, attempts: 0 };
      dateFails[dateId].fails += k.attempts - k.successes;
      dateFails[dateId].attempts += k.attempts;
    }
  }
  const topFails = Object.values(dateFails)
    .filter(d => d.attempts > 0)
    .sort((a, b) => b.fails - a.fails)
    .slice(0, 10);

  return (
    <Layout style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setScreen('home')}>
          ←
        </button>
        <h2>Scores</h2>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {(['classement', 'stats'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--gold)' : 'transparent'}`,
              color: tab === t ? 'var(--gold)' : 'var(--text-dim)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}
          >
            {t === 'classement' ? '🏆 Classement' : '📊 Stats'}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {tab === 'classement' && (
          <div>
            {playerList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
                Aucun joueur encore.<br />Lance une partie pour commencer !
              </div>
            ) : playerList.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  marginBottom: 8,
                  background: i === 0 ? 'rgba(232,184,75,0.08)' : 'var(--bg-card)',
                  border: `1px solid ${i === 0 ? 'var(--gold-dim)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--gold)' : i === 1 ? '#9b9b9b' : i === 2 ? '#cd7f32' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  color: i < 3 ? '#080c18' : 'var(--text-dim)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{player.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {player.gamesPlayed} partie{player.gamesPlayed !== 1 ? 's' : ''}
                    {Object.keys(player.dateKnowledge).length > 0 && ` · ${Object.keys(player.dateKnowledge).length} dates vues`}
                  </div>
                </div>

                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: i === 0 ? 'var(--gold)' : 'var(--text)' }}>
                  {player.totalScore}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'stats' && (
          <div>
            <h3 style={{ marginBottom: 12, color: 'var(--text-dim)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Dates les plus ratées
            </h3>
            {topFails.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 20px' }}>
                Joue d'abord quelques questions !
              </div>
            ) : (
              <div>
                {topFails.map((f, i) => (
                  <DateFailRow key={f.dateId} rank={i + 1} dateId={f.dateId} fails={f.fails} attempts={f.attempts} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function DateFailRow({ rank, dateId, fails, attempts }: { rank: number; dateId: string; fails: number; attempts: number }) {
  const allDates = useGameStore(s => s.allDates);
  const nd = allDates.find(d => d.id === dateId);
  const failRate = attempts > 0 ? Math.round((fails / attempts) * 100) : 0;

  if (!nd) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: rank * 0.04 }}
      style={{
        padding: '12px 14px',
        marginBottom: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{nd.evenement}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
            {nd.date.raw} · {nd.theme}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '0.9rem' }}>{failRate}%</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{fails}/{attempts} ratées</div>
        </div>
      </div>
    </motion.div>
  );
}
