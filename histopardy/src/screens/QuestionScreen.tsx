import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import Flashcard from '../components/Flashcard/Flashcard';
import AnswerSteps from '../components/Flashcard/AnswerSteps';
import Confetti from '../components/ui/Confetti';
import Layout from '../components/Layout';
import ProximityMCQ from '../components/MiniInteractions/ProximityMCQ';
import ChronologicalOrder from '../components/MiniInteractions/ChronologicalOrder';
import TimelineCarousel from '../components/MiniInteractions/TimelineCarousel';

export default function QuestionScreen() {
  const {
    question, board, config, allDates,
    flipCard, answerContext, answerYear, answerMonth, answerDay,
    triggerMiniInteraction, resolveMiniInteraction,
    nextCard, finishQuestion,
  } = useGameStore();
  const { players } = usePlayerStore();
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Dériver les valeurs avant les hooks (peuvent être undefined)
  const cards = question?.cards ?? [];
  const currentCardIndex = question?.currentCardIndex ?? 0;
  const card = cards[currentCardIndex];
  const nd = card ? allDates.find(d => d.id === card.dateId) : undefined;
  const activeMini = question?.activeMiniInteraction ?? null;

  const isLastCard = currentCardIndex === cards.length - 1;
  const allGood = !!(card?.completed && (
    card.isContextOnly
      ? card.contextResult === 'correct'
      : card.contextResult !== 'wrong' &&
        card.yearResult === 'correct' &&
        (!nd?.date.hasMonth || card.monthResult === 'correct') &&
        (!nd?.date.hasDay || card.dayResult === 'correct')
  ));

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

  // Déclencher la mini-interaction sur mauvaise réponse (une seule fois)
  // Pas de mini-interaction pour les questions contexte-only (pas de date à pratiquer)
  useEffect(() => {
    if (!card?.completed || allGood || activeMini !== null) return;
    if (card.isContextOnly) return;
    triggerMiniInteraction();
  }, [card?.completed]);

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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {config.mode === 'duel' ? playerName : 'Question'}
            {card.isBonus && (
              <span style={{
                background: 'rgba(232,184,75,0.2)',
                border: '1px solid var(--gold)',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: '0.68rem',
                color: 'var(--gold)',
                fontWeight: 800,
              }}>🎯 Bonus +20%</span>
            )}
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
            {/* Flashcard — masquée pour les questions contexte-only */}
            {!card.isContextOnly && (
              <Flashcard nd={nd} flipped={card.flipped} onFlip={handleFlip} />
            )}

            {/* Indicateur multi-cartes */}
            {cards.length > 1 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                  {cards.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === currentCardIndex ? 18 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: i === currentCardIndex
                          ? 'var(--gold)'
                          : i < currentCardIndex
                            ? 'var(--green)'
                            : 'var(--border-bright)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}>
                  {currentCardIndex + 1} / {cards.length}
                </div>
              </div>
            )}

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
                  playerId={currentPlayerId}
                  onAnswerContext={answerContext}
                  onAnswerYear={answerYear}
                  onAnswerMonth={answerMonth}
                  onAnswerDay={answerDay}
                />
              </motion.div>
            )}

            {/* Mini-interaction de rattrapage */}
            {activeMini && !activeMini.resolved && (() => {
              const targetNd = allDates.find(d => d.id === activeMini.dateId);
              const helperNds = activeMini.helperDateIds.map(id => allDates.find(d => d.id === id)).filter(Boolean) as typeof allDates;
              if (!targetNd) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {activeMini.type === 'proximity' && (
                    <ProximityMCQ
                      targetNd={targetNd}
                      helperNds={helperNds}
                      onResolve={resolveMiniInteraction}
                    />
                  )}
                  {activeMini.type === 'ordering' && (
                    <ChronologicalOrder
                      targetNd={targetNd}
                      helperNds={helperNds}
                      onResolve={resolveMiniInteraction}
                    />
                  )}
                  {activeMini.type === 'timeline' && (
                    <TimelineCarousel
                      targetNd={targetNd}
                      helperNds={helperNds}
                      onResolve={resolveMiniInteraction}
                    />
                  )}
                </motion.div>
              );
            })()}

            {/* Résultat mini-interaction résolue */}
            {activeMini?.resolved && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '10px 14px',
                  background: activeMini.success ? 'rgba(46,204,113,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeMini.success ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: activeMini.success ? 'var(--green)' : 'var(--text-muted)',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {activeMini.success
                  ? `✓ Rattrapage réussi · +${activeMini.halfPoints} pts · Question bonus dans 2 cases`
                  : '→ Question bonus dans 2 cases avec +20%'}
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
            disabled={!!(activeMini && !activeMini.resolved)}
            style={{ opacity: activeMini && !activeMini.resolved ? 0.4 : 1 }}
          >
            {activeMini && !activeMini.resolved
              ? '⏳ Termine l\'exercice d\'abord'
              : !allGood
                ? (isLastCard ? '✓ J\'ai retenu · Voir le résultat' : '✓ J\'ai retenu · Carte suivante')
                : (isLastCard ? 'Voir le résultat' : 'Carte suivante →')
            }
          </button>
        </motion.div>
      )}

      {/* Bouton flip si pas encore retourné — masqué pour les questions contexte-only */}
      {!card.flipped && !card.completed && !card.isContextOnly && (
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
