import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlashcardState, NormalizedDate, AnswerResult } from '../../types';
import QuestionModifierModal from '../ui/QuestionModifierModal';
import ContextMCQ from './ContextMCQ';

const MOIS_FULL = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MOIS_SHORT = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface AnswerStepsProps {
  card: FlashcardState;
  nd: NormalizedDate;
  playerId: string;
  onAnswerContext: (choice: string) => void;
  onAnswerYear: (choice: number) => void;
  onAnswerMonth: (choice: number) => void;
  onAnswerDay: (choice: number) => void;
}

export default function AnswerSteps({ card, nd, playerId, onAnswerContext, onAnswerYear, onAnswerMonth, onAnswerDay }: AnswerStepsProps) {
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (card.yearResult === 'wrong' || card.monthResult === 'wrong' || card.dayResult === 'wrong') {
      setShakeKey(k => k + 1);
    }
  }, [card.yearResult, card.monthResult, card.dayResult]);

  if (!card.flipped) return null;

  // Pour les cartes isContextOnly, la date est maintenant aussi demandée
  const allGood = card.yearResult === 'correct' &&
    (!nd.date.hasMonth || card.monthResult === 'correct') &&
    (!nd.date.hasDay || card.dayResult === 'correct');

  // === État complété ===
  if (card.completed) {
    if (allGood) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'rgba(46, 204, 113, 0.1)',
            border: '1px solid var(--green)',
            borderRadius: 'var(--radius)',
            padding: '18px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🎉</div>
          <div style={{ color: 'var(--green)', fontWeight: 800, fontSize: '1.1rem' }}>Parfait !</div>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1rem', marginTop: 6 }}>
            {nd.evenement}
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 4 }}>
            {nd.date.raw}
          </div>
        </motion.div>
      );
    }

    // === Réponse fausse : panel éducatif ===
    // isContextOnly + contexte raté → panel simplifié (pas de date à montrer)
    // isContextOnly + contexte ok mais date ratée → panel complet
    if (card.isContextOnly && card.contextResult === 'wrong') {
      return <ContextWrongPanel nd={nd} />;
    }
    return <WrongAnswerPanel card={card} nd={nd} shakeKey={shakeKey} playerId={playerId} />;
  }

  // === Étape contexte (question de type 'context') ===
  if (card.contextStep && card.contextChoices) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <ContextMCQ
          contexte={nd.contexte}
          choices={card.contextChoices}
          onAnswer={onAnswerContext}
          disabled={card.contextResult !== null && card.contextResult !== undefined}
          correctEvenement={card.contextResult !== null && card.contextResult !== undefined ? nd.evenement : undefined}
        />
      </motion.div>
    );
  }

  // === Étapes de réponse ===
  return (
    <div style={{ width: '100%' }}>
      {/* Badge bonus contexte réussi */}
      {card.contextResult === 'correct' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          padding: '6px 10px',
          background: 'rgba(78,140,232,0.1)',
          border: '1px solid rgba(78,140,232,0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem',
          color: '#4e8ce8',
          fontWeight: 700,
        }}>
          ✓ Contexte trouvé · Trouve la date pour {card.isContextOnly ? '×1.5' : '×2'}
        </div>
      )}
      <AnimatePresence mode="wait">
        {card.currentStep === 'year' && (
          <motion.div key="year" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <StepLabel label="Quelle année ?" result={card.yearResult} />
            <ChoiceGrid choices={card.yearChoices} onSelect={onAnswerYear} disabled={card.yearResult !== null} correctValue={nd.date.year} />
          </motion.div>
        )}
        {card.currentStep === 'month' && (
          <motion.div key="month" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <StepLabel label="Quel mois ?" result={card.monthResult} />
            <MonthGrid onSelect={onAnswerMonth} disabled={card.monthResult !== null} />
          </motion.div>
        )}
        {card.currentStep === 'day' && (
          <motion.div key="day" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <StepLabel label="Quel jour ?" result={card.dayResult} />
            <ChoiceGrid choices={card.dayChoices ?? []} onSelect={onAnswerDay} disabled={card.dayResult !== null} correctValue={nd.date.day} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== Panel simplifié pour mauvaise réponse contexte-only =====
function ContextWrongPanel({ nd }: { nd: NormalizedDate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(231, 76, 60, 0.06)',
        border: '1px solid rgba(231, 76, 60, 0.4)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        background: 'rgba(231, 76, 60, 0.15)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(231, 76, 60, 0.2)',
      }}>
        <span style={{ fontSize: '1.2rem' }}>❌</span>
        <span style={{ color: 'var(--red)', fontWeight: 800, fontSize: '0.95rem' }}>
          La bonne réponse était
        </span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1rem' }}>
          {nd.evenement}
        </div>
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          fontSize: '0.82rem',
          color: 'var(--text-dim)',
          lineHeight: 1.5,
        }}>
          {nd.contexte}
        </div>
      </div>
    </motion.div>
  );
}

// ===== Panel éducatif pour mauvaise réponse =====
function WrongAnswerPanel({ card, nd, shakeKey, playerId }: { card: FlashcardState; nd: NormalizedDate; shakeKey: number; playerId: string }) {
  const [modifierOpen, setModifierOpen] = useState(false);
  // Construire un résumé de ce qui était juste et faux
  const yearWrong = card.yearResult === 'wrong';
  const monthWrong = card.monthResult === 'wrong';
  const dayWrong = card.dayResult === 'wrong';

  // Construire la date complète formatée
  const dateParts: { label: string; value: string; status: 'correct' | 'wrong' | 'na' }[] = [];

  if (nd.date.hasDay && nd.date.day !== undefined) {
    dateParts.push({ label: 'Jour', value: String(nd.date.day), status: dayWrong ? 'wrong' : card.dayResult === 'correct' ? 'correct' : 'na' });
  }
  if (nd.date.hasMonth && nd.date.month !== undefined) {
    dateParts.push({ label: 'Mois', value: MOIS_FULL[nd.date.month], status: monthWrong ? 'wrong' : card.monthResult === 'correct' ? 'correct' : 'na' });
  }
  dateParts.push({ label: 'Année', value: String(nd.date.year), status: yearWrong ? 'wrong' : 'correct' });

  return (
    <motion.div
      key={shakeKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, x: shakeKey > 0 ? [0, -10, 10, -8, 8, 0] : 0 }}
      transition={{ duration: shakeKey > 0 ? 0.4 : 0.25 }}
      style={{
        background: 'rgba(231, 76, 60, 0.06)',
        border: '1px solid rgba(231, 76, 60, 0.4)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Modal modificateur de précision */}
      <QuestionModifierModal
        open={modifierOpen}
        onClose={() => setModifierOpen(false)}
        dateId={card.dateId}
        evenement={nd.evenement}
        playerId={playerId}
        currentPrecision={card.precision}
      />

      {/* En-tête rouge */}
      <div style={{
        background: 'rgba(231, 76, 60, 0.15)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(231, 76, 60, 0.2)',
      }}>
        <span style={{ fontSize: '1.2rem' }}>❌</span>
        <span style={{ color: 'var(--red)', fontWeight: 800, fontSize: '0.95rem', flex: 1 }}>
          La bonne réponse était
        </span>
        <button
          onClick={() => setModifierOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 8px',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            color: 'var(--text-dim)',
          }}
          title="Adapter le niveau de détail pour cette date"
        >
          ⚙️
        </button>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Date complète bien mise en valeur */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {nd.date.raw}
          </div>
        </div>

        {/* Détail par étape : vert = correct, rouge = raté */}
        {dateParts.length > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {dateParts.map(({ label, value, status }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: status === 'correct' ? 'rgba(46,204,113,0.12)' : status === 'wrong' ? 'rgba(231,76,60,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${status === 'correct' ? 'var(--green)' : status === 'wrong' ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: status === 'correct' ? 'var(--green)' : status === 'wrong' ? 'var(--red)' : 'var(--text-dim)' }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.7rem', marginTop: 2 }}>
                  {status === 'correct' ? '✓' : status === 'wrong' ? '✗' : '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rappel du contexte */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            À retenir
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: 6 }}>
            {nd.evenement}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {nd.contexte}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepLabel({ label, result }: { label: string; result: AnswerResult }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
      {result === 'correct' && <span style={{ color: 'var(--green)', fontSize: '0.9rem' }}>✓</span>}
    </div>
  );
}

function ChoiceGrid({ choices, onSelect, disabled, correctValue }: {
  choices: number[];
  onSelect: (v: number) => void;
  disabled: boolean;
  correctValue?: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(v: number) {
    if (disabled) return;
    setSelected(v);
    onSelect(v);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {choices.map(c => {
        const isSelected = selected === c;
        const isCorrect = disabled && c === correctValue;
        const isWrong = disabled && isSelected && c !== correctValue;
        return (
          <motion.button
            key={c}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={() => handleSelect(c)}
            style={{
              minHeight: 52,
              background: isCorrect ? 'rgba(46,204,113,0.15)' : isWrong ? 'rgba(231,76,60,0.15)' : 'var(--bg-card)',
              border: `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--border-bright)'}`,
              borderRadius: 'var(--radius-sm)',
              color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--text)',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {c}
            {isCorrect && <span style={{ marginLeft: 4, fontSize: '0.9rem' }}>✓</span>}
            {isWrong && <span style={{ marginLeft: 4, fontSize: '0.9rem' }}>✗</span>}
          </motion.button>
        );
      })}
    </div>
  );
}

function MonthGrid({ onSelect, disabled }: { onSelect: (v: number) => void; disabled: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {MOIS_SHORT.slice(1).map((label, i) => {
        const month = i + 1;
        return (
          <motion.button
            key={month}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={() => !disabled && onSelect(month)}
            style={{
              minHeight: 44,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.1s ease',
            }}
          >
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
