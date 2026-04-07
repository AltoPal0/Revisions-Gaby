import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import Flashcard from '../components/Flashcard/Flashcard';
import AnswerSteps from '../components/Flashcard/AnswerSteps';
import Confetti from '../components/ui/Confetti';
import Layout from '../components/Layout';

export default function QuestionScreen() {
  const {
    question, board, config, allDates,
    flipCard, answerYear, answerMonth, answerDay,
    nextCard, finishQuestion,
  } = useGameStore();
  const { players } = usePlayerStore();
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Dériver les valeurs avant les hooks (peuvent être undefined)
  const cards = question?.cards ?? [];
  const currentCardIndex = question?.currentCardIndex ?? 0;
  const card = cards[currentCardIndex];
  const nd = card ? allDates.find(d => d.id === card.dateId) : undefined;

  const isLastCard = currentCardIndex === cards.length - 1;
  const allGood = !!(card?.completed &&
    card.yearResult === 'correct' &&
    (!nd?.date.hasMonth || card.monthResult === 'correct') &&
    (!nd?.date.hasDay || card.dayResult === 'correct'));

  // Auto-advance uniquement sur bonne réponse (1.5s)
  // Sur erreur : pas d'auto-advance, le joueur doit taper "J'ai retenu"
  useEffect(() => {
    if (!card?.completed || !question || !allGood) return;
    clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      if (isLastCard) {
        finishQuestion();
      } else {
        nextCard();
      }
    }, 1500);
    return () => clearTimeout(autoAdvanceRef.current);
  }, [card?.completed, allGood]);

  // Early returns après tous les hooks
  if (!question || !board || !config || !card || !nd) return null;

  const currentPlayerId = config.playerIds[board.currentPlayerIndex];
  const playerName = players[currentPlayerId]?.name ?? '';

  function handleFlip() {
    flipCard();
  }

  function handleNextManual() {
    clearTimeout(autoAdvanceRef.current);
    if (isLastCard) {
      finishQuestion();
    } else {
      nextCard();
    }
  }

  return (
    <Layout style={{ position: 'relative' }}>
      {/* Confetti si bonne réponse */}
      <AnimatePresence>
        {allGood && <Confetti active={allGood} />}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {config.mode === 'duel' ? playerName : 'Question'}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Carte {currentCardIndex + 1}/{cards.length} · {board.cells[question.cellRow][question.cellCol].points} pts
          </div>
        </div>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          fontSize: '0.85rem',
          color: 'var(--gold)',
          fontWeight: 700,
        }}>
          +{question.totalEarned + card.pointsEarned}
        </div>
      </div>

      {/* Contenu */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.dateId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Flashcard */}
            <Flashcard nd={nd} flipped={card.flipped} onFlip={handleFlip} />

            {/* Zone de réponse */}
            {card.flipped && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AnswerSteps
                  card={card}
                  nd={nd}
                  onAnswerYear={answerYear}
                  onAnswerMonth={answerMonth}
                  onAnswerDay={answerDay}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: bouton manuel si la carte est complète */}
      {card.completed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '10px 16px',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <button
            className={`btn btn-full ${allGood ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleNextManual}
          >
            {!allGood
              ? (isLastCard ? '✓ J\'ai retenu · Voir le résultat' : '✓ J\'ai retenu · Carte suivante')
              : (isLastCard ? 'Voir le résultat' : 'Carte suivante →')
            }
          </button>
        </motion.div>
      )}

      {/* Bouton flip si pas encore retourné */}
      {!card.flipped && !card.completed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '10px 16px',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleFlip}
          >
            Deviner la date 🎯
          </button>
        </motion.div>
      )}
    </Layout>
  );
}
