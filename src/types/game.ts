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
  sourceDeckId?: string; // which deck this card came from, for returning on clear
  sourceCardId?: string; // original template card id
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

export interface GameState {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
  freeCards: FreeCard[];
  freeDice: FreeDice[];
  diceHistory: DiceResult[];
  topZIndex: number;
}
