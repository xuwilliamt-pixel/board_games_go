import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Card, Deck, FreeCard, FreeDice, DiceResult } from '../types/game';

const DEFAULT_BACK_IMAGE = 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop';

interface GameStore extends GameState {
  // Canvas actions
  placeCardOnCanvas: (templateId: string, x: number, y: number) => void;
  placeCardFromDeck: (deckId: string, x: number, y: number) => void;
  moveCard: (instanceId: string, x: number, y: number) => void;
  flipCard: (instanceId: string) => void;
  rotateCard: (instanceId: string, delta: number) => void;
  removeCard: (instanceId: string) => void;
  bringToFront: (instanceId: string) => void;
  updateFreeCard: (instanceId: string, fields: Partial<Card & { rotation?: number }>) => void;

  // Dice actions
  addDice: (x: number, y: number, sides?: FreeDice['sides']) => void;
  moveDice: (diceId: string, x: number, y: number) => void;
  rollDice: (diceId: string) => void;
  changeDiceSides: (diceId: string, sides: FreeDice['sides']) => void;
  removeDice: (diceId: string) => void;
  bringDiceToFront: (diceId: string) => void;

  // Deck builder actions
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  createDeck: () => void;
  updateDeck: (deckId: string, cardIds: string[]) => void;
  updateDeckInfo: (deckId: string, info: { name?: string; backImage?: string }) => void;
  deleteDeck: (deckId: string) => void;

  // Utility
  clearTable: () => void;
}

const mockCards: Record<string, Card> = {
  'card-1': { id: 'card-1', name: '火球術', description: '造成 3 點傷害', isFlipped: false, type: 'spell', value: 3 },
  'card-2': { id: 'card-2', name: '哥布林', description: '一個弱小的生物', isFlipped: false, type: 'creature', attack: 1, health: 2 },
  'card-3': { id: 'card-3', name: '騎士', description: '堅毅的戰士', isFlipped: false, type: 'creature', attack: 3, health: 5 },
  'card-4': { id: 'card-4', name: '魔法劍', description: '攻擊力 +2', isFlipped: false, type: 'item', value: 2 },
  'card-5': { id: 'card-5', name: '治療藥水', description: '恢復 2 點生命', isFlipped: false, type: 'item', value: 2 },
  'card-6': { id: 'card-6', name: '精靈弓手', description: '遠程攻擊，命中率高', isFlipped: false, type: 'creature', attack: 2, health: 3 },
  'card-7': { id: 'card-7', name: '冰霜新星', description: '冰凍所有敵方', isFlipped: false, type: 'spell', value: 4 },
};

const defaultDeckCards: Card[] = [
  ...Array(4).fill(mockCards['card-2']),
  ...Array(3).fill(mockCards['card-3']),
  ...Array(4).fill(mockCards['card-1']),
  ...Array(2).fill(mockCards['card-7']),
  ...Array(3).fill(mockCards['card-5']),
  ...Array(2).fill(mockCards['card-4']),
  ...Array(2).fill(mockCards['card-6']),
];

const initialDecks: Record<string, Deck> = {
  'deck-1': {
    id: 'deck-1',
    name: 'Starter Deck',
    cards: defaultDeckCards,
    backImage: DEFAULT_BACK_IMAGE,
  },
};

const initialState: GameState = {
  decks: initialDecks,
  cards: mockCards,
  freeCards: [],
  freeDice: [
    { id: 'dice-1', x: 40, y: 40, sides: 12, currentValue: 1, isRolling: false, zIndex: 5 },
  ],
  diceHistory: [],
  topZIndex: 10,
};

const genId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      // ── Canvas Actions ──────────────────────────────────────────

      placeCardOnCanvas: (templateId, x, y) =>
        set((state) => {
          const template = state.cards[templateId];
          if (!template) return state;
          const newZ = state.topZIndex + 1;
          const newCard: FreeCard = {
            ...template,
            instanceId: `inst_${genId()}`,
            x,
            y,
            rotation: 0,
            zIndex: newZ,
          };
          return {
            freeCards: [...state.freeCards, newCard],
            topZIndex: newZ,
          };
        }),

      placeCardFromDeck: (deckId, x, y) =>
        set((state) => {
          const deck = state.decks[deckId];
          if (!deck || deck.cards.length === 0) return state;
          // Pick random card from deck
          const idx = Math.floor(Math.random() * deck.cards.length);
          const template = deck.cards[idx];
          const newDeckCards = deck.cards.filter((_, i) => i !== idx);
          const newZ = state.topZIndex + 1;
          const newCard: FreeCard = {
            ...template,
            instanceId: `inst_${genId()}`,
            sourceDeckId: deckId,
            sourceCardId: template.id,
            x,
            y,
            rotation: 0,
            isFlipped: true, // drawn face-down (back showing)
            zIndex: newZ,
          };
          return {
            decks: { ...state.decks, [deckId]: { ...deck, cards: newDeckCards } },
            freeCards: [...state.freeCards, newCard],
            topZIndex: newZ,
          };
        }),

      moveCard: (instanceId, x, y) =>
        set((state) => ({
          freeCards: state.freeCards.map((c) =>
            c.instanceId === instanceId ? { ...c, x, y } : c
          ),
        })),

      flipCard: (instanceId) =>
        set((state) => ({
          freeCards: state.freeCards.map((c) =>
            c.instanceId === instanceId ? { ...c, isFlipped: !c.isFlipped } : c
          ),
        })),

      rotateCard: (instanceId, delta) =>
        set((state) => ({
          freeCards: state.freeCards.map((c) =>
            c.instanceId === instanceId ? { ...c, rotation: (c.rotation + delta) % 360 } : c
          ),
        })),

      removeCard: (instanceId) =>
        set((state) => ({
          freeCards: state.freeCards.filter((c) => c.instanceId !== instanceId),
        })),

      bringToFront: (instanceId) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          return {
            freeCards: state.freeCards.map((c) =>
              c.instanceId === instanceId ? { ...c, zIndex: newZ } : c
            ),
            topZIndex: newZ,
          };
        }),

      updateFreeCard: (instanceId, fields) =>
        set((state) => ({
          freeCards: state.freeCards.map((c) =>
            c.instanceId === instanceId ? { ...c, ...fields } : c
          ),
        })),

      // ── Dice Actions ─────────────────────────────────────────────

      addDice: (x, y, sides = 12) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          const newDice: FreeDice = {
            id: `dice_${genId()}`,
            x,
            y,
            sides,
            currentValue: 1,
            isRolling: false,
            zIndex: newZ,
          };
          return {
            freeDice: [...state.freeDice, newDice],
            topZIndex: newZ,
          };
        }),

      moveDice: (diceId, x, y) =>
        set((state) => ({
          freeDice: state.freeDice.map((d) =>
            d.id === diceId ? { ...d, x, y } : d
          ),
        })),

      rollDice: (diceId) =>
        set((state) => {
          const dice = state.freeDice.find((d) => d.id === diceId);
          if (!dice) return state;
          const value = Math.floor(Math.random() * dice.sides) + 1;
          const newResult: DiceResult = {
            id: genId(),
            value,
            max: dice.sides,
            timestamp: Date.now(),
          };
          return {
            freeDice: state.freeDice.map((d) =>
              d.id === diceId ? { ...d, currentValue: value, isRolling: false } : d
            ),
            diceHistory: [newResult, ...state.diceHistory].slice(0, 20),
          };
        }),

      changeDiceSides: (diceId, sides) =>
        set((state) => ({
          freeDice: state.freeDice.map((d) =>
            d.id === diceId ? { ...d, sides, currentValue: 1 } : d
          ),
        })),

      removeDice: (diceId) =>
        set((state) => ({
          freeDice: state.freeDice.filter((d) => d.id !== diceId),
        })),

      bringDiceToFront: (diceId) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          return {
            freeDice: state.freeDice.map((d) =>
              d.id === diceId ? { ...d, zIndex: newZ } : d
            ),
            topZIndex: newZ,
          };
        }),

      // ── Deck Builder Actions ──────────────────────────────────────

      addCard: (cardData) =>
        set((state) => {
          const newId = `card-${genId()}`;
          const newCard: Card = { ...cardData, id: newId };
          return { cards: { ...state.cards, [newId]: newCard } };
        }),

      updateCard: (id, cardData) =>
        set((state) => {
          if (!state.cards[id]) return state;
          const updatedCard = { ...state.cards[id], ...cardData };
          const newDecks = { ...state.decks };
          for (const deckId in newDecks) {
            newDecks[deckId] = {
              ...newDecks[deckId],
              cards: newDecks[deckId].cards.map((c) => (c.id === id ? updatedCard : c)),
            };
          }
          // Also update live instances on canvas
          const newFreeCards = state.freeCards.map((c) =>
            c.id === id ? { ...c, ...cardData } : c
          );
          return { cards: { ...state.cards, [id]: updatedCard }, decks: newDecks, freeCards: newFreeCards };
        }),

      deleteCard: (id) =>
        set((state) => {
          const newCards = { ...state.cards };
          delete newCards[id];
          const newDecks = { ...state.decks };
          for (const deckId in newDecks) {
            newDecks[deckId] = {
              ...newDecks[deckId],
              cards: newDecks[deckId].cards.filter((c) => c.id !== id),
            };
          }
          return { cards: newCards, decks: newDecks };
        }),

      createDeck: () =>
        set((state) => {
          const newId = `deck-${genId()}`;
          const newDeck: Deck = {
            id: newId,
            name: 'New Deck',
            cards: [],
            backImage: DEFAULT_BACK_IMAGE,
          };
          return { decks: { ...state.decks, [newId]: newDeck } };
        }),

      updateDeck: (deckId, cardIds) =>
        set((state) => {
          if (!state.decks[deckId]) return state;
          const deckCards = cardIds.map((id) => state.cards[id]).filter(Boolean);
          return {
            decks: {
              ...state.decks,
              [deckId]: { ...state.decks[deckId], cards: deckCards },
            },
          };
        }),

      updateDeckInfo: (deckId, info) =>
        set((state) => {
          if (!state.decks[deckId]) return state;
          return {
            decks: {
              ...state.decks,
              [deckId]: { ...state.decks[deckId], ...info },
            },
          };
        }),

      deleteDeck: (deckId) =>
        set((state) => {
          const newDecks = { ...state.decks };
          delete newDecks[deckId];
          return { decks: newDecks };
        }),

      clearTable: () =>
        set((state) => {
          // Return each free card back to its source deck
          const newDecks = { ...state.decks };
          for (const fCard of state.freeCards) {
            const deckId = fCard.sourceDeckId;
            const cardId = fCard.sourceCardId;
            if (deckId && cardId && newDecks[deckId] && state.cards[cardId]) {
              newDecks[deckId] = {
                ...newDecks[deckId],
                cards: [...newDecks[deckId].cards, state.cards[cardId]],
              };
            }
          }
          return { freeCards: [], decks: newDecks };
        }),
    }),
    {
      name: 'board-game-storage-v3',
      partialize: (state) => ({
        cards: state.cards,
        decks: state.decks,
        freeCards: state.freeCards,
        // freeDice intentionally NOT persisted — always loads from initialState
        diceHistory: state.diceHistory,
        topZIndex: state.topZIndex,
      }),
    }
  )
);
