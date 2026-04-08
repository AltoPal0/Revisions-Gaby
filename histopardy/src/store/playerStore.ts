import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, DateKnowledge, DatePrecision } from '../types';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback pour HTTP sur réseau local (crypto.randomUUID requiert HTTPS)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

interface PlayerState {
  players: Record<string, Player>;
  // Actions
  createPlayer: (name: string) => Player;
  getPlayer: (id: string) => Player | undefined;
  updateKnowledge: (playerId: string, dateId: string, yearCorrect: boolean, allCorrect: boolean) => void;
  setDatePrecision: (playerId: string, dateId: string, precision: DatePrecision) => void;
  addScore: (playerId: string, points: number) => void;
  incrementGamesPlayed: (playerId: string) => void;
  deletePlayer: (id: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      players: {},

      createPlayer: (name: string) => {
        const player: Player = {
          id: generateId(),
          name: name.trim(),
          createdAt: Date.now(),
          totalScore: 0,
          gamesPlayed: 0,
          dateKnowledge: {},
        };
        set(state => ({ players: { ...state.players, [player.id]: player } }));
        return player;
      },

      getPlayer: (id: string) => {
        return get().players[id];
      },

      updateKnowledge: (playerId: string, dateId: string, yearCorrect: boolean, allCorrect: boolean) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) return state;
          const existing: DateKnowledge = player.dateKnowledge[dateId] ?? {
            attempts: 0, successes: 0, perfectCount: 0, lastAttempt: 0,
          };
          const updated: DateKnowledge = {
            attempts: existing.attempts + 1,
            successes: existing.successes + (yearCorrect ? 1 : 0),
            perfectCount: existing.perfectCount + (allCorrect ? 1 : 0),
            lastAttempt: Date.now(),
          };
          return {
            players: {
              ...state.players,
              [playerId]: {
                ...player,
                dateKnowledge: { ...player.dateKnowledge, [dateId]: updated },
              },
            },
          };
        });
      },

      setDatePrecision: (playerId: string, dateId: string, precision: DatePrecision) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) return state;
          const existing: DateKnowledge = player.dateKnowledge[dateId] ?? {
            attempts: 0, successes: 0, perfectCount: 0, lastAttempt: 0,
          };
          return {
            players: {
              ...state.players,
              [playerId]: {
                ...player,
                dateKnowledge: {
                  ...player.dateKnowledge,
                  [dateId]: { ...existing, precision },
                },
              },
            },
          };
        });
      },

      addScore: (playerId: string, points: number) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) return state;
          return {
            players: {
              ...state.players,
              [playerId]: { ...player, totalScore: player.totalScore + points },
            },
          };
        });
      },

      incrementGamesPlayed: (playerId: string) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) return state;
          return {
            players: {
              ...state.players,
              [playerId]: { ...player, gamesPlayed: player.gamesPlayed + 1 },
            },
          };
        });
      },

      deletePlayer: (id: string) => {
        set(state => {
          const { [id]: _, ...rest } = state.players;
          return { players: rest };
        });
      },
    }),
    {
      name: 'histopardy-players',
    }
  )
);
