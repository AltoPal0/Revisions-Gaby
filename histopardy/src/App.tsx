import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import HomeScreen from './screens/HomeScreen';
import PlayerSelectScreen from './screens/PlayerSelectScreen';
import ModeSelectScreen from './screens/ModeSelectScreen';
import BoardScreen from './screens/BoardScreen';
import QuestionScreen from './screens/QuestionScreen';
import ScoresScreen from './screens/ScoresScreen';
import GameOverScreen from './screens/GameOverScreen';

const screenVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function App() {
  const screen = useGameStore(s => s.screen);

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen />;
      case 'playerSelect': return <PlayerSelectScreen />;
      case 'modeSelect': return <ModeSelectScreen />;
      case 'board': return <BoardScreen />;
      case 'question': return <QuestionScreen />;
      case 'scores': return <ScoresScreen />;
      case 'gameOver': return <GameOverScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ height: '100dvh', overflow: 'hidden' }}
      >
        {renderScreen()}
      </motion.div>
    </AnimatePresence>
  );
}
