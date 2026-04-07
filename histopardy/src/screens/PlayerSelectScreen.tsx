import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import Modal from '../components/ui/Modal';
import Layout from '../components/Layout';

const MAX_PLAYERS = 4;

export default function PlayerSelectScreen() {
  const { players, createPlayer } = usePlayerStore();
  const setScreen = useGameStore(s => s.setScreen);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const playerList = Object.values(players).sort((a, b) => b.totalScore - a.totalScore);

  function togglePlayer(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < MAX_PLAYERS ? [...prev, id] : prev
    );
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const player = createPlayer(name);
    setSelectedIds(prev => [...prev, player.id]);
    setNewName('');
    setShowCreate(false);
  }

  function handleContinue() {
    if (selectedIds.length === 0) return;
    useGameStore.getState().setPendingPlayerIds(selectedIds);
    useGameStore.getState().setScreen('modeSelect');
  }

  return (
    <Layout style={{ padding: '0 0 0 0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        gap: 12,
        borderBottom: '1px solid var(--border)',
      }}>
        <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setScreen('home')}>
          ←
        </button>
        <h2 style={{ flex: 1 }}>Qui joue ?</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {selectedIds.length}/{MAX_PLAYERS}
        </span>
      </div>

      {/* Instructions */}
      <p style={{ padding: '12px 20px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        {selectedIds.length === 0
          ? 'Sélectionne ou crée un joueur'
          : selectedIds.length === 1
          ? '1 joueur sélectionné · Ajoute-en d\'autres pour le mode duel'
          : `${selectedIds.length} joueurs · Mode duel activé`}
      </p>

      {/* Liste des joueurs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        <AnimatePresence initial={false}>
          {playerList.map((player, i) => {
            const isSelected = selectedIds.includes(player.id);
            const selectionOrder = selectedIds.indexOf(player.id) + 1;
            return (
              <motion.button
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => togglePlayer(player.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  marginBottom: 8,
                  background: isSelected ? 'rgba(232,184,75,0.1)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  minHeight: 64,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isSelected ? 'var(--gold)' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: isSelected ? '#080c18' : 'var(--text-dim)',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}>
                  {isSelected ? selectionOrder : player.name[0].toUpperCase()}
                </div>

                {/* Infos */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: isSelected ? 'var(--gold)' : 'var(--text)' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {player.totalScore} pts · {player.gamesPlayed} partie{player.gamesPlayed !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ color: 'var(--gold)', fontSize: '1.3rem' }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Bouton créer */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: playerList.length * 0.05 + 0.1 }}
          className="btn btn-ghost btn-full"
          onClick={() => setShowCreate(true)}
          style={{ marginTop: 4, border: '2px dashed var(--border-bright)' }}
        >
          + Nouveau joueur
        </motion.button>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
      }}>
        <button
          className="btn btn-primary btn-full btn-lg"
          disabled={selectedIds.length === 0}
          onClick={handleContinue}
        >
          Continuer →
        </button>
      </div>

      {/* Modal créer joueur */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau joueur">
        <input
          type="text"
          placeholder="Ton prénom"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)}
          autoFocus
          maxLength={20}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={!newName.trim()}
            onClick={handleCreate}
          >
            Créer
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
