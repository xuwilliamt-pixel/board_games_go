import { create } from 'zustand';
import { ref, onValue, update, off } from 'firebase/database';
import { db } from '../firebase';
import type { GameState, Card, Deck, FreeCard, FreeDice, DiceResult, Character, BoardPiece } from '../types/game';
import defaultCardBack from '../assets/DigitalMonster.jpg';

// ── 房間 ID ────────────────────────────────────────────────────
const getRoomId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('room') || 'default-room';
};

export const ROOM_ID = getRoomId();


const DEFAULT_BACK_IMAGE = defaultCardBack;
const genId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// ── Firebase Array 修復工具 ────────────────────────────────────
// Firebase 在 array 有元素被刪除時，會把它存成 object（{0:..., 2:...}）
// 這個 helper 確保從 Firebase 拿回來的資料都是真正的 array
const toArray = <T>(val: unknown, fallback: T[]): T[] => {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  return Object.values(val as Record<string, T>);
};

// ── Initial Characters ─────────────────────────────────────────
const initialCharacters: Character[] = [
  { id: 'hero-1', name: '戰士', role: 'warrior', emoji: '⚔️', color: '#ef4444', hpBars: Array(10).fill(true), attack: 4, defense: 3 },
  { id: 'hero-2', name: '法師', role: 'mage', emoji: '🧙', color: '#8b5cf6', hpBars: Array(10).fill(true), attack: 6, defense: 1 },
  { id: 'hero-3', name: '弓手', role: 'archer', emoji: '🏹', color: '#10b981', hpBars: Array(10).fill(true), attack: 4, defense: 2 },
  { id: 'hero-4', name: '治癒師', role: 'healer', emoji: '💊', color: '#06b6d4', hpBars: Array(10).fill(true), attack: 2, defense: 2 },
  { id: 'boss-1', name: '魔王', role: 'boss', emoji: '👾', color: '#f97316', hpBars: Array(10).fill(true), attack: 8, defense: 5 },
  { id: 'bigFour-1', name: '猴', role: 'bigFour', emoji: '🐒', color: '#91eb75', hpBars: Array(10).fill(true), attack: 5, defense: 3 },
  { id: 'bigFour-2', name: '雞', role: 'bigFour', emoji: '🐔', color: '#fcb0a0', hpBars: Array(10).fill(true), attack: 5, defense: 3 },
  { id: 'bigFour-3', name: '狗', role: 'bigFour', emoji: '🐶', color: '#f2f555', hpBars: Array(10).fill(true), attack: 5, defense: 3 },
  { id: 'bigFour-4', name: '豬', role: 'bigFour', emoji: '🐷', color: '#d34cc8', hpBars: Array(10).fill(true), attack: 5, defense: 3 },
];

const Z_GAP = 8, MIN_ZONE = 80;

const getInitialBoardPieces = (): BoardPiece[] => {
  const GAP = 10;
  const LEFT_W = 240, RIGHT_W = 320;
  const canvasW = typeof window !== 'undefined' ? window.innerWidth - LEFT_W - RIGHT_W : 768;
  const canvasH = typeof window !== 'undefined' ? window.innerHeight - 56 : 664;
  const boardAvailW = canvasW - 2 * (MIN_ZONE + Z_GAP);
  const boardAvailH = canvasH - 60;
  const cellFromW = Math.floor((boardAvailW - 32 - GAP * 4) / 5);
  const cellFromH = Math.floor((boardAvailH - 32 - GAP * 4 - 68) / 5);
  const cell = Math.max(70, Math.min(110, Math.min(cellFromW, cellFromH)));
  const boardW = cell * 5 + GAP * 4 + 32;
  const boardH = cell * 5 + GAP * 4 + 32 + 68;
  const boardLeft = Math.round((canvasW - boardW) / 2);
  const boardTop = Math.max(10, Math.round((canvasH - boardH) / 2)) + 40;
  const pieceL = boardLeft + boardW + Z_GAP;
  const rx = pieceL + Math.round((MIN_ZONE + Z_GAP) / 2) - 16 + 310;
  const step = Math.min(80, (boardH - 60) / 5);
  return [
    { id: 'piece-1', label: '戰', role: 'warrior', emoji: '⚔️', color: '#FF5E7A', x: rx, y: boardTop + 30, zIndex: 6 },
    { id: 'piece-2', label: '法', role: 'mage', emoji: '🧙', color: '#8B5CFF', x: rx, y: boardTop + 30 + step, zIndex: 6 },
    { id: 'piece-3', label: '弓', role: 'archer', emoji: '🏹', color: '#35E0A1', x: rx, y: boardTop + 30 + step * 2, zIndex: 6 },
    { id: 'piece-4', label: '癒', role: 'healer', emoji: '💊', color: '#24D8FF', x: rx, y: boardTop + 30 + step * 3, zIndex: 6 },
    { id: 'piece-5', label: '魔', role: 'boss', emoji: '👾', color: '#FF9D42', x: rx, y: boardTop + 30 + step * 4, zIndex: 6 },
  ];
};

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

const getInitialDice = (): FreeDice[] => {
  const GAP = 10;
  const LEFT_W = 240, RIGHT_W = 320;
  const canvasW = typeof window !== 'undefined' ? window.innerWidth - LEFT_W - RIGHT_W : 768;
  const canvasH = typeof window !== 'undefined' ? window.innerHeight - 56 : 664;
  const boardAvailW = canvasW - 2 * (MIN_ZONE + Z_GAP);
  const boardAvailH = canvasH - 60;
  const cellFromW = Math.floor((boardAvailW - 32 - GAP * 4) / 5);
  const cellFromH = Math.floor((boardAvailH - 32 - GAP * 4 - 68) / 5);
  const cell = Math.max(70, Math.min(110, Math.min(cellFromW, cellFromH)));
  const boardW = cell * 5 + GAP * 4 + 32;
  const boardLeft = Math.round((canvasW - boardW) / 2);
  const diceX = boardLeft + Math.round(boardW / 2) - 340;
  return [{ id: 'dice-initial', x: diceX, y: 100, sides: 12, currentValue: 1, isRolling: false, zIndex: 8 }];
};

const initialState: GameState = {
  decks: initialDecks,
  cards: mockCards,
  freeCards: [],
  freeDice: getInitialDice(),
  diceHistory: [],
  topZIndex: 10,
  characters: initialCharacters,
  boardPieces: getInitialBoardPieces(),
  round: 1,
};

type SyncableState = Pick<GameState, 'freeCards' | 'freeDice' | 'diceHistory' | 'topZIndex' | 'characters' | 'boardPieces' | 'decks' | 'round' | 'cards'>;

// ── Firebase 寫入 ──────────────────────────────────────────────
const syncToFirebase = (patch: Partial<SyncableState>) => {
  const gameRef = ref(db, `rooms/${ROOM_ID}`);
  const clean = JSON.parse(JSON.stringify(patch));
  update(gameRef, clean);
};

// ── Store Interface ────────────────────────────────────────────
interface GameStore extends GameState {
  isConnected: boolean;
  round: number;
  setRound: (n: number) => void;
  initSync: () => () => void;

  // Canvas
  placeCardOnCanvas: (templateId: string, x: number, y: number) => void;
  placeCardFromDeck: (deckId: string, x: number, y: number) => void;
  moveCard: (instanceId: string, x: number, y: number) => void;
  moveCardEnd: (instanceId: string) => void;
  flipCard: (instanceId: string) => void;
  rotateCard: (instanceId: string, delta: number) => void;
  removeCard: (instanceId: string) => void;
  bringToFront: (instanceId: string) => void;
  updateFreeCard: (instanceId: string, fields: Partial<Card & { rotation?: number }>) => void;

  // Dice
  addDice: (x: number, y: number, sides?: FreeDice['sides']) => void;
  moveDice: (diceId: string, x: number, y: number) => void;
  moveDiceEnd: (diceId: string) => void;
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
  moveBoardPieceEnd: (pieceId: string) => void;
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

export const useGameStore = create<GameStore>()((set, get) => ({
  ...initialState,
  isConnected: false,

  // ── Firebase 同步初始化 ──────────────────────────────────────
  initSync: () => {
    const gameRef = ref(db, `rooms/${ROOM_ID}`);

    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // ✅ 修復：Firebase 儲存 array 時可能轉成 object，用 toArray 確保還原成真正的 array
        const characters = toArray<Character>(data.characters, initialCharacters).map((c) => ({
          ...c,
          // hpBars 也可能被 Firebase 轉成 object，同樣需要還原
          hpBars: toArray<boolean>(c.hpBars, Array(10).fill(true)),
        }));

        // 修復：Firebase 會把空 array 刪掉，deck.cards 可能是 undefined
        const rawDecks = data.decks ?? initialDecks;
        const fixedDecks: typeof initialDecks = {};
        for (const deckId in rawDecks) {
          fixedDecks[deckId] = {
            ...rawDecks[deckId],
            cards: toArray<Card>(rawDecks[deckId].cards, []),
          };
        }

        set({
          freeCards:   toArray<FreeCard>(data.freeCards,   []),
          freeDice:    toArray<FreeDice>(data.freeDice,    getInitialDice()),
          diceHistory: toArray<DiceResult>(data.diceHistory, []),
          topZIndex:   data.topZIndex ?? 10,
          characters,
          boardPieces: toArray<BoardPiece>(data.boardPieces, getInitialBoardPieces()),
          decks:       fixedDecks,
          cards:       data.cards ?? mockCards,
          round:       data.round ?? 1,
          isConnected: true,
        });
      } else {
        const state = get();
        syncToFirebase({
          freeCards: state.freeCards,
          freeDice: state.freeDice,
          diceHistory: state.diceHistory,
          topZIndex: state.topZIndex,
          characters: state.characters,
          boardPieces: state.boardPieces,
          decks: state.decks,
          cards: state.cards,
          round: state.round,
        });
        set({ isConnected: true });
      }
    });

    return () => off(gameRef);
  },

  // ── Round ────────────────────────────────────────────────────
  setRound: (n) => {
    set({ round: n });
    syncToFirebase({ round: n });
  },

  // ── Canvas ──────────────────────────────────────────────────
  placeCardOnCanvas: (templateId, x, y) => {
    const state = get();
    const template = state.cards[templateId];
    if (!template) return;
    const newZ = state.topZIndex + 1;
    const newCard: FreeCard = { ...template, instanceId: `inst_${genId()}`, x, y, rotation: 0, zIndex: newZ };
    const newFreeCards = [...state.freeCards, newCard];
    set({ freeCards: newFreeCards, topZIndex: newZ });
    syncToFirebase({ freeCards: newFreeCards, topZIndex: newZ });
  },

  placeCardFromDeck: (deckId, x, y) => {
    const state = get();
    const deck = state.decks[deckId];
    if (!deck || deck.cards.length === 0) return;
    const idx = Math.floor(Math.random() * deck.cards.length);
    const template = deck.cards[idx];
    const newDeckCards = deck.cards.filter((_, i) => i !== idx);
    const newZ = state.topZIndex + 1;
    const newCard: FreeCard = {
      ...template, instanceId: `inst_${genId()}`,
      sourceDeckId: deckId, sourceCardId: template.id,
      x, y, rotation: 0, isFlipped: true, zIndex: newZ,
    };
    const newDecks = { ...state.decks, [deckId]: { ...deck, cards: newDeckCards } };
    const newFreeCards = [...state.freeCards, newCard];
    set({ decks: newDecks, freeCards: newFreeCards, topZIndex: newZ });
    syncToFirebase({ decks: newDecks, freeCards: newFreeCards, topZIndex: newZ });
  },

  moveCard: (instanceId, x, y) => {
    const newFreeCards = get().freeCards.map((c) => c.instanceId === instanceId ? { ...c, x, y } : c);
    set({ freeCards: newFreeCards });
  },

  moveCardEnd: (_instanceId) => {
    const newFreeCards = get().freeCards;
    syncToFirebase({ freeCards: newFreeCards });
  },

  flipCard: (instanceId) => {
    const newFreeCards = get().freeCards.map((c) => c.instanceId === instanceId ? { ...c, isFlipped: !c.isFlipped } : c);
    set({ freeCards: newFreeCards });
    syncToFirebase({ freeCards: newFreeCards });
  },

  rotateCard: (instanceId, delta) => {
    const newFreeCards = get().freeCards.map((c) => c.instanceId === instanceId ? { ...c, rotation: (c.rotation + delta) % 360 } : c);
    set({ freeCards: newFreeCards });
    syncToFirebase({ freeCards: newFreeCards });
  },

  removeCard: (instanceId) => {
    const newFreeCards = get().freeCards.filter((c) => c.instanceId !== instanceId);
    set({ freeCards: newFreeCards });
    syncToFirebase({ freeCards: newFreeCards });
  },

  bringToFront: (instanceId) => {
    const newZ = get().topZIndex + 1;
    const newFreeCards = get().freeCards.map((c) => c.instanceId === instanceId ? { ...c, zIndex: newZ } : c);
    set({ freeCards: newFreeCards, topZIndex: newZ });
    syncToFirebase({ freeCards: newFreeCards, topZIndex: newZ });
  },

  updateFreeCard: (instanceId, fields) => {
    const newFreeCards = get().freeCards.map((c) => c.instanceId === instanceId ? { ...c, ...fields } : c);
    set({ freeCards: newFreeCards });
    syncToFirebase({ freeCards: newFreeCards });
  },

  // ── Dice ────────────────────────────────────────────────────
  addDice: (x, y, sides = 12) => {
    const newZ = get().topZIndex + 1;
    const newDice: FreeDice = { id: `dice_${genId()}`, x, y, sides, currentValue: 1, isRolling: false, zIndex: newZ };
    const newFreeDice = [...get().freeDice, newDice];
    set({ freeDice: newFreeDice, topZIndex: newZ });
    syncToFirebase({ freeDice: newFreeDice, topZIndex: newZ });
  },

  moveDice: (diceId, x, y) => {
    const newFreeDice = get().freeDice.map((d) => d.id === diceId ? { ...d, x, y } : d);
    set({ freeDice: newFreeDice });
  },

  moveDiceEnd: (_diceId) => {
    syncToFirebase({ freeDice: get().freeDice });
  },

  rollDice: (diceId) => {
    const state = get();
    const dice = state.freeDice.find((d) => d.id === diceId);
    if (!dice) return;
    const value = Math.floor(Math.random() * dice.sides) + 1;
    const newResult: DiceResult = { id: genId(), value, max: dice.sides, timestamp: Date.now() };
    const newFreeDice = state.freeDice.map((d) => d.id === diceId ? { ...d, currentValue: value } : d);
    const newDiceHistory = [newResult, ...state.diceHistory].slice(0, 20);
    set({ freeDice: newFreeDice, diceHistory: newDiceHistory });
    syncToFirebase({ freeDice: newFreeDice, diceHistory: newDiceHistory });
  },

  changeDiceSides: (diceId, sides) => {
    const newFreeDice = get().freeDice.map((d) => d.id === diceId ? { ...d, sides, currentValue: 1 } : d);
    set({ freeDice: newFreeDice });
    syncToFirebase({ freeDice: newFreeDice });
  },

  removeDice: (diceId) => {
    const newFreeDice = get().freeDice.filter((d) => d.id !== diceId);
    set({ freeDice: newFreeDice });
    syncToFirebase({ freeDice: newFreeDice });
  },

  bringDiceToFront: (diceId) => {
    const newZ = get().topZIndex + 1;
    const newFreeDice = get().freeDice.map((d) => d.id === diceId ? { ...d, zIndex: newZ } : d);
    set({ freeDice: newFreeDice, topZIndex: newZ });
    syncToFirebase({ freeDice: newFreeDice, topZIndex: newZ });
  },

  // ── Characters ──────────────────────────────────────────────
  toggleHPBar: (characterId, index) => {
    const newCharacters = get().characters.map((c) => {
      if (c.id !== characterId) return c;
      // ✅ 修復：hpBars 從 Firebase 拿回來可能是 object，確保是 array
      const bars = Array.isArray(c.hpBars) ? c.hpBars : Object.values(c.hpBars) as boolean[];
      const newBars = [...bars];
      newBars[index] = !newBars[index];
      return { ...c, hpBars: newBars };
    });
    set({ characters: newCharacters });
    syncToFirebase({ characters: newCharacters });
  },

  updateCharacterStat: (characterId, stat, delta) => {
    const newCharacters = get().characters.map((c) => {
      if (c.id !== characterId) return c;
      return { ...c, [stat]: Math.max(0, c[stat] + delta) };
    });
    set({ characters: newCharacters });
    syncToFirebase({ characters: newCharacters });
  },

  resetCharacterHP: (characterId) => {
    const newCharacters = get().characters.map((c) => {
      if (c.id !== characterId) return c;
      return { ...c, hpBars: c.hpBars.map(() => true) };
    });
    set({ characters: newCharacters });
    syncToFirebase({ characters: newCharacters });
  },

  // ── Board Pieces ────────────────────────────────────────────
  addBoardPiece: (piece) => {
    const newZ = get().topZIndex + 1;
    const newBoardPieces = [...get().boardPieces, { ...piece, id: `piece_${genId()}`, zIndex: newZ }];
    set({ boardPieces: newBoardPieces, topZIndex: newZ });
    syncToFirebase({ boardPieces: newBoardPieces, topZIndex: newZ });
  },

  moveBoardPiece: (pieceId, x, y) => {
    const newBoardPieces = get().boardPieces.map((p) => p.id === pieceId ? { ...p, x, y } : p);
    set({ boardPieces: newBoardPieces });
  },

  moveBoardPieceEnd: (_pieceId) => {
    syncToFirebase({ boardPieces: get().boardPieces });
  },

  removeBoardPiece: (pieceId) => {
    const newBoardPieces = get().boardPieces.filter((p) => p.id !== pieceId);
    set({ boardPieces: newBoardPieces });
    syncToFirebase({ boardPieces: newBoardPieces });
  },

  updateBoardPieceLabel: (pieceId, label) => {
    const newBoardPieces = get().boardPieces.map((p) => p.id === pieceId ? { ...p, label } : p);
    set({ boardPieces: newBoardPieces });
    syncToFirebase({ boardPieces: newBoardPieces });
  },

  bringPieceToFront: (pieceId) => {
    const newZ = get().topZIndex + 1;
    const newBoardPieces = get().boardPieces.map((p) => p.id === pieceId ? { ...p, zIndex: newZ } : p);
    set({ boardPieces: newBoardPieces, topZIndex: newZ });
    syncToFirebase({ boardPieces: newBoardPieces, topZIndex: newZ });
  },

  // ── Deck Builder ────────────────────────────────────────────
  addCard: (cardData) => {
    const state = get();
    const newId = `card-${genId()}`;
    const newCards = { ...state.cards, [newId]: { ...cardData, id: newId } };
    set({ cards: newCards });
    syncToFirebase({ cards: newCards });
  },

  updateCard: (id, cardData) => {
    const state = get();
    if (!state.cards[id]) return;
    const updatedCard = { ...state.cards[id], ...cardData };
    const newCards = { ...state.cards, [id]: updatedCard };
    const newDecks = { ...state.decks };
    for (const deckId in newDecks) {
      newDecks[deckId] = { ...newDecks[deckId], cards: newDecks[deckId].cards.map((c) => c.id === id ? updatedCard : c) };
    }
    const newFreeCards = state.freeCards.map((c) => c.id === id ? { ...c, ...cardData } : c);
    set({ cards: newCards, decks: newDecks, freeCards: newFreeCards });
    syncToFirebase({ cards: newCards, decks: newDecks, freeCards: newFreeCards });
  },

  deleteCard: (id) => {
    const state = get();
    const newCards = { ...state.cards };
    delete newCards[id];
    const newDecks = { ...state.decks };
    for (const deckId in newDecks) {
      newDecks[deckId] = { ...newDecks[deckId], cards: newDecks[deckId].cards.filter((c) => c.id !== id) };
    }
    set({ cards: newCards, decks: newDecks });
    syncToFirebase({ cards: newCards, decks: newDecks });
  },

  createDeck: () =>
    set((state) => {
      const newId = `deck-${genId()}`;
      return { decks: { ...state.decks, [newId]: { id: newId, name: 'New Deck', cards: [], backImage: DEFAULT_BACK_IMAGE } } };
    }),

  updateDeck: (deckId, cardIds) => {
    const state = get();
    if (!state.decks[deckId]) return;
    const newDecks = { ...state.decks, [deckId]: { ...state.decks[deckId], cards: cardIds.map((id) => state.cards[id]).filter(Boolean) } };
    set({ decks: newDecks });
    syncToFirebase({ decks: newDecks });
  },

  updateDeckInfo: (deckId, info) => {
    const state = get();
    if (!state.decks[deckId]) return;
    const newDecks = { ...state.decks, [deckId]: { ...state.decks[deckId], ...info } };
    set({ decks: newDecks });
    syncToFirebase({ decks: newDecks });
  },

  deleteDeck: (deckId) => {
    const newDecks = { ...get().decks };
    delete newDecks[deckId];
    set({ decks: newDecks });
    syncToFirebase({ decks: newDecks });
  },

  clearTable: () => {
    const state = get();
    const newDecks = { ...state.decks };
    for (const fCard of state.freeCards) {
      const deckId = fCard.sourceDeckId;
      const cardId = fCard.sourceCardId;
      if (deckId && cardId && newDecks[deckId] && state.cards[cardId]) {
        newDecks[deckId] = { ...newDecks[deckId], cards: [...newDecks[deckId].cards, state.cards[cardId]] };
      }
    }
    const newBoardPieces = getInitialBoardPieces();
    set({ freeCards: [], decks: newDecks, boardPieces: newBoardPieces });
    syncToFirebase({ freeCards: [], decks: newDecks, boardPieces: newBoardPieces });
  },
}));