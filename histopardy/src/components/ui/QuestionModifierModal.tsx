import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { usePlayerStore } from '../../store/playerStore';
import type { DatePrecision } from '../../types';

interface QuestionModifierModalProps {
  open: boolean;
  onClose: () => void;
  dateId: string;
  evenement: string;
  playerId: string;
  currentPrecision?: DatePrecision;
}

const OPTIONS: { value: DatePrecision; label: string; desc: string; icon: string }[] = [
  { value: 'full', label: 'Date complète', desc: 'Année, mois et jour si disponibles', icon: '📅' },
  { value: 'year_month', label: 'Année + mois', desc: 'Pas besoin de connaître le jour exact', icon: '🗓️' },
  { value: 'year_only', label: 'Année seulement', desc: 'Date pas vue en cours / pas prioritaire', icon: '📌' },
];

export default function QuestionModifierModal({
  open, onClose, dateId, evenement, playerId, currentPrecision,
}: QuestionModifierModalProps) {
  const [selected, setSelected] = useState<DatePrecision>(currentPrecision ?? 'full');
  const { setDatePrecision } = usePlayerStore();

  function handleConfirm() {
    setDatePrecision(playerId, dateId, selected);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Adapter la question">
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Date concernée
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700, lineHeight: 1.3 }}>
          {evenement}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {OPTIONS.map(opt => {
          const active = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: active ? 'rgba(232,184,75,0.1)' : 'var(--bg-card)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border-bright)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: active ? 'var(--gold)' : 'var(--text)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {opt.desc}
                </div>
              </div>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${active ? 'var(--gold)' : 'var(--border-bright)'}`,
                background: active ? 'var(--gold)' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg)' }} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          onClick={onClose}
        >
          Annuler
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={handleConfirm}
        >
          ✓ Enregistrer
        </button>
      </div>
    </Modal>
  );
}
