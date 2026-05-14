export type CardType = 'creature' | 'spell' | 'item' | 'hero';

export interface Card {
  id: string;
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  isFlipped: boolean;
  type: CardType;
  value?: number;
  attack?: number;
  health?: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  backImage: string;
}

/** A card placed on the free canvas */
export interface FreeCard extends Card {
  instanceId: string;
  sourceDeckId?: string;
  sourceCardId?: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

/** A dice on the free canvas */
export interface FreeDice {
  id: string;
  x: number;
  y: number;
  sides: 4 | 6 | 8 | 10 | 12 | 20;
  currentValue: number;
  isRolling: boolean;
  zIndex: number;
}

export interface DiceResult {
  id: string;
  value: number;
  max: number;
  timestamp: number;
}

// ── Character System ─────────────────────────────────────────────

export type CharacterRole = 'warrior' | 'mage' | 'archer' | 'healer' | 'boss' | 'monster' | 'Slime' | 'bigFour';

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  emoji: string;
  color: string;
  hpBars: boolean[];
  attack: number;
  defense: number;
}

/** A token/piece — free-floating anywhere on the canvas */
export interface BoardPiece {
  id: string;
  label: string;
  role: CharacterRole;
  emoji: string;
  color: string;
  x: number;
  y: number;
  zIndex: number;
}

/** A card that has been discarded — carries the deck it came from */
export interface DiscardCard {
  instanceId: string;    // 原 FreeCard.instanceId（唯一 key）
  id: string;            // 原 Card.id（template id）
  name: string;
  description: string;
  type: CardType;
  originDeckId: string;  // 回復時回去的 deckId
  backImage?: string;
  frontImage?: string;
  value?: number;
  attack?: number;
  health?: number;
}

export interface GameState {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
  freeCards: FreeCard[];
  freeDice: FreeDice[];
  diceHistory: DiceResult[];
  topZIndex: number;
  characters: Character[];
  boardPieces: BoardPiece[];
  round: number;          // ← 新增，回合數同步用
  discardPile: DiscardCard[];
}