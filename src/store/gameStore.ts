import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Card, Deck, FreeCard, FreeDice, DiceResult, Character, BoardPiece } from '../types/game';

const DEFAULT_BACK_IMAGE = 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop';
const genId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// ── Initial Characters ─────────────────────────────────────────
const initialCharacters: Character[] = [
  { id: 'hero-1', name: '戰士', role: 'warrior', emoji: '⚔️', color: '#ef4444', hpBars: [true, true, true], attack: 4, defense: 3 },
  { id: 'hero-2', name: '法師', role: 'mage',    emoji: '🧙', color: '#8b5cf6', hpBars: [true, true, true], attack: 6, defense: 1 },
  { id: 'hero-3', name: '弓手', role: 'archer',  emoji: '🏹', color: '#10b981', hpBars: [true, true, true], attack: 4, defense: 2 },
  { id: 'hero-4', name: '治癒師', role: 'healer', emoji: '💊', color: '#06b6d4', hpBars: [true, true, true], attack: 2, defense: 2 },
  { id: 'boss-1', name: '魔王', role: 'boss',    emoji: '👾', color: '#f97316', hpBars: [true, true, true, true, true], attack: 8, defense: 5 },
];

// Pieces are positioned roughly where a centered 5x5 board would be on a 1280px screen
// Board left≈225, top≈120, each cell≈70px
const initialBoardPieces: BoardPiece[] = [
  { id: 'piece-1', label: '戰', role: 'warrior', emoji: '⚔️', color: '#ef4444', x: 295, y: 415, zIndex: 6 },
  { id: 'piece-2', label: '法', role: 'mage',    emoji: '🧙', color: '#8b5cf6', x: 365, y: 415, zIndex: 6 },
  { id: 'piece-3', label: '弓', role: 'archer',  emoji: '🏹', color: '#10b981', x: 435, y: 415, zIndex: 6 },
  { id: 'piece-4', label: '癒', role: 'healer',  emoji: '💊', color: '#06b6d4', x: 365, y: 345, zIndex: 6 },
  { id: 'piece-5', label: '魔', role: 'boss',    emoji: '👾', color: '#f97316', x: 365, y: 135, zIndex: 6 },
];

// ── Mock Cards ─────────────────────────────────────────────────
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
  'deck-1': { id: 'deck-1', name: 'Starter Deck', cards: defaultDeckCards, backImage: DEFAULT_BACK_IMAGE },
};

const initialState: GameState = {
  decks: initialDecks,
  cards: mockCards,
  freeCards: [],
  freeDice: [], // dice added by App.tsx useEffect at right-side position
  diceHistory: [],
  topZIndex: 10,
  characters: initialCharacters,
  boardPieces: initialBoardPieces,
};

// ── Store Interface ────────────────────────────────────────────
interface GameStore extends GameState {
  // Canvas
  placeCardOnCanvas: (templateId: string, x: number, y: number) => void;
  placeCardFromDeck: (deckId: string, x: number, y: number) => void;
  moveCard: (instanceId: string, x: number, y: number) => void;
  flipCard: (instanceId: string) => void;
  rotateCard: (instanceId: string, delta: number) => void;
  removeCard: (instanceId: string) => void;
  bringToFront: (instanceId: string) => void;
  updateFreeCard: (instanceId: string, fields: Partial<Card & { rotation?: number }>) => void;

  // Dice
  addDice: (x: number, y: number, sides?: FreeDice['sides']) => void;
  moveDice: (diceId: string, x: number, y: number) => void;
  rollDice: (diceId: string) => void;
  changeDiceSides: (diceId: string, sides: FreeDice['sides']) => void;
  removeDice: (diceId: string) => void;
  bringDiceToFront: (diceId: string) => void;

  // Characters
  toggleHPBar: (characterId: string, index: number) => void;
  updateCharacterStat: (characterId: string, stat: 'attack' | 'defense', delta: number) => void;
  resetCharacterHP: (characterId: string) => void;

  // Board Pieces
  addBoardPiece: (piece: Omit<BoardPiece, 'id' | 'zIndex'>) => void;
  moveBoardPiece: (pieceId: string, x: number, y: number) => void;
  removeBoardPiece: (pieceId: string) => void;
  updateBoardPieceLabel: (pieceId: string, label: string) => void;
  bringPieceToFront: (pieceId: string) => void;

  // Deck Builder
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  createDeck: () => void;
  updateDeck: (deckId: string, cardIds: string[]) => void;
  updateDeckInfo: (deckId: string, info: { name?: string; backImage?: string }) => void;
  deleteDeck: (deckId: string) => void;
  clearTable: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      // ── Canvas ──────────────────────────────────────────────────
      placeCardOnCanvas: (templateId, x, y) =>
        set((state) => {
          const template = state.cards[templateId];
          if (!template) return state;
          const newZ = state.topZIndex + 1;
          const newCard: FreeCard = { ...template, instanceId: `inst_${genId()}`, x, y, rotation: 0, zIndex: newZ };
          return { freeCards: [...state.freeCards, newCard], topZIndex: newZ };
        }),

      placeCardFromDeck: (deckId, x, y) =>
        set((state) => {
          const deck = state.decks[deckId];
          if (!deck || deck.cards.length === 0) return state;
          const idx = Math.floor(Math.random() * deck.cards.length);
          const template = deck.cards[idx];
          const newDeckCards = deck.cards.filter((_, i) => i !== idx);
          const newZ = state.topZIndex + 1;
          const newCard: FreeCard = {
            ...template, instanceId: `inst_${genId()}`,
            sourceDeckId: deckId, sourceCardId: template.id,
            x, y, rotation: 0, isFlipped: true, zIndex: newZ,
          };
          return { decks: { ...state.decks, [deckId]: { ...deck, cards: newDeckCards } }, freeCards: [...state.freeCards, newCard], topZIndex: newZ };
        }),

      moveCard: (instanceId, x, y) =>
        set((state) => ({ freeCards: state.freeCards.map((c) => c.instanceId === instanceId ? { ...c, x, y } : c) })),

      flipCard: (instanceId) =>
        set((state) => ({ freeCards: state.freeCards.map((c) => c.instanceId === instanceId ? { ...c, isFlipped: !c.isFlipped } : c) })),

      rotateCard: (instanceId, delta) =>
        set((state) => ({ freeCards: state.freeCards.map((c) => c.instanceId === instanceId ? { ...c, rotation: (c.rotation + delta) % 360 } : c) })),

      removeCard: (instanceId) =>
        set((state) => ({ freeCards: state.freeCards.filter((c) => c.instanceId !== instanceId) })),

      bringToFront: (instanceId) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          return { freeCards: state.freeCards.map((c) => c.instanceId === instanceId ? { ...c, zIndex: newZ } : c), topZIndex: newZ };
        }),

      updateFreeCard: (instanceId, fields) =>
        set((state) => ({ freeCards: state.freeCards.map((c) => c.instanceId === instanceId ? { ...c, ...fields } : c) })),

      // ── Dice ────────────────────────────────────────────────────
      addDice: (x, y, sides = 12) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          const newDice: FreeDice = { id: `dice_${genId()}`, x, y, sides, currentValue: 1, isRolling: false, zIndex: newZ };
          return { freeDice: [...state.freeDice, newDice], topZIndex: newZ };
        }),

      moveDice: (diceId, x, y) =>
        set((state) => ({ freeDice: state.freeDice.map((d) => d.id === diceId ? { ...d, x, y } : d) })),

      rollDice: (diceId) =>
        set((state) => {
          const dice = state.freeDice.find((d) => d.id === diceId);
          if (!dice) return state;
          const value = Math.floor(Math.random() * dice.sides) + 1;
          const newResult: DiceResult = { id: genId(), value, max: dice.sides, timestamp: Date.now() };
          return {
            freeDice: state.freeDice.map((d) => d.id === diceId ? { ...d, currentValue: value } : d),
            diceHistory: [newResult, ...state.diceHistory].slice(0, 20),
          };
        }),

      changeDiceSides: (diceId, sides) =>
        set((state) => ({ freeDice: state.freeDice.map((d) => d.id === diceId ? { ...d, sides, currentValue: 1 } : d) })),

      removeDice: (diceId) =>
        set((state) => ({ freeDice: state.freeDice.filter((d) => d.id !== diceId) })),

      bringDiceToFront: (diceId) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          return { freeDice: state.freeDice.map((d) => d.id === diceId ? { ...d, zIndex: newZ } : d), topZIndex: newZ };
        }),

      // ── Characters ──────────────────────────────────────────────
      toggleHPBar: (characterId, index) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            const newBars = [...c.hpBars];
            newBars[index] = !newBars[index];
            return { ...c, hpBars: newBars };
          }),
        })),

      updateCharacterStat: (characterId, stat, delta) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            return { ...c, [stat]: Math.max(0, c[stat] + delta) };
          }),
        })),

      resetCharacterHP: (characterId) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            return { ...c, hpBars: c.hpBars.map(() => true) };
          }),
        })),

      // ── Board Pieces ────────────────────────────────────────────
      addBoardPiece: (piece) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          return {
            boardPieces: [...state.boardPieces, { ...piece, id: `piece_${genId()}`, zIndex: newZ }],
            topZIndex: newZ,
          };
        }),

      moveBoardPiece: (pieceId, x, y) =>
        set((state) => ({
          boardPieces: state.boardPieces.map((p) => p.id === pieceId ? { ...p, x, y } : p),
        })),

      removeBoardPiece: (pieceId) =>
        set((state) => ({ boardPieces: state.boardPieces.filter((p) => p.id !== pieceId) })),

      updateBoardPieceLabel: (pieceId, label) =>
        set((state) => ({ boardPieces: state.boardPieces.map((p) => p.id === pieceId ? { ...p, label } : p) })),

      bringPieceToFront: (pieceId) =>
        set((state) => {
          const newZ = state.topZIndex + 1;
          return {
            boardPieces: state.boardPieces.map((p) => p.id === pieceId ? { ...p, zIndex: newZ } : p),
            topZIndex: newZ,
          };
        }),

      // ── Deck Builder ────────────────────────────────────────────
      addCard: (cardData) =>
        set((state) => {
          const newId = `card-${genId()}`;
          return { cards: { ...state.cards, [newId]: { ...cardData, id: newId } } };
        }),

      updateCard: (id, cardData) =>
        set((state) => {
          if (!state.cards[id]) return state;
          const updatedCard = { ...state.cards[id], ...cardData };
          const newDecks = { ...state.decks };
          for (const deckId in newDecks) {
            newDecks[deckId] = { ...newDecks[deckId], cards: newDecks[deckId].cards.map((c) => c.id === id ? updatedCard : c) };
          }
          return { cards: { ...state.cards, [id]: updatedCard }, decks: newDecks, freeCards: state.freeCards.map((c) => c.id === id ? { ...c, ...cardData } : c) };
        }),

      deleteCard: (id) =>
        set((state) => {
          const newCards = { ...state.cards };
          delete newCards[id];
          const newDecks = { ...state.decks };
          for (const deckId in newDecks) {
            newDecks[deckId] = { ...newDecks[deckId], cards: newDecks[deckId].cards.filter((c) => c.id !== id) };
          }
          return { cards: newCards, decks: newDecks };
        }),

      createDeck: () =>
        set((state) => {
          const newId = `deck-${genId()}`;
          return { decks: { ...state.decks, [newId]: { id: newId, name: 'New Deck', cards: [], backImage: DEFAULT_BACK_IMAGE } } };
        }),

      updateDeck: (deckId, cardIds) =>
        set((state) => {
          if (!state.decks[deckId]) return state;
          return { decks: { ...state.decks, [deckId]: { ...state.decks[deckId], cards: cardIds.map((id) => state.cards[id]).filter(Boolean) } } };
        }),

      updateDeckInfo: (deckId, info) =>
        set((state) => {
          if (!state.decks[deckId]) return state;
          return { decks: { ...state.decks, [deckId]: { ...state.decks[deckId], ...info } } };
        }),

      deleteDeck: (deckId) =>
        set((state) => {
          const newDecks = { ...state.decks };
          delete newDecks[deckId];
          return { decks: newDecks };
        }),

      clearTable: () =>
        set((state) => {
          // Return cards to their source decks
          const newDecks = { ...state.decks };
          for (const fCard of state.freeCards) {
            const deckId = fCard.sourceDeckId;
            const cardId = fCard.sourceCardId;
            if (deckId && cardId && newDecks[deckId] && state.cards[cardId]) {
              newDecks[deckId] = { ...newDecks[deckId], cards: [...newDecks[deckId].cards, state.cards[cardId]] };
            }
          }
          // Reset board pieces to initial positions
          return { freeCards: [], decks: newDecks, boardPieces: initialBoardPieces };
        }),
    }),
    {
      name: 'board-game-storage-v6',
      partialize: (state) => ({
        cards: state.cards,
        decks: state.decks,
        freeCards: state.freeCards,
        diceHistory: state.diceHistory,
        topZIndex: state.topZIndex,
        characters: state.characters,
        boardPieces: state.boardPieces,
      }),
    }
  )
);
