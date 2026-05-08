import React, { useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FreeCard } from '../FreeCard/FreeCard';
import { FreeDice } from '../FreeDice/FreeDice';
import { FreePiece } from '../FreePiece/FreePiece';
import { BoardGrid } from '../BoardGrid/BoardGrid';

interface FreeCanvasProps { theme: 'day' | 'night'; }

export const CARD_W  = 74;  // card pixel width
export const ZONE_W  = CARD_W * 2 + 4; // 152px — 2 cards wide
const Z_GAP = 8;

export function calcBoardLayout() {
  const GAP = 8;
  const canvasW = window.innerWidth  - 226 - 286;
  const canvasH = window.innerHeight - 56;

  // Cell size: board must leave ZONE_W+gap on each side
  const boardAvailW = canvasW - 2 * (ZONE_W + Z_GAP);
  const boardAvailH = canvasH - 60;
  const cellFromW   = Math.floor((boardAvailW - 32 - GAP * 4) / 5);
  const cellFromH   = Math.floor((boardAvailH - 32 - GAP * 4 - 58) / 5);
  const cellSize    = Math.max(55, Math.min(100, Math.min(cellFromW, cellFromH)));

  const boardGrid = cellSize * 5 + GAP * 4;
  const boardW    = boardGrid + 32;
  const boardH    = boardGrid + 32 + 58;

  // Center board in FULL WINDOW (compensate for panel asymmetry)
  // Panel asymmetry = (rightPanel - leftPanel)/2 = (286-226)/2 = 30px
  const boardLeftCanvas = Math.round((canvasW - boardW) / 2) + 30;
  const boardLeft       = Math.max(ZONE_W + Z_GAP, boardLeftCanvas);
  const boardTop        = Math.max(10, Math.round((canvasH - boardH) / 2));

  // Hand zone: left of board
  const handL = Math.max(0, boardLeft - ZONE_W - Z_GAP);
  const handW = boardLeft - Z_GAP - handL;  // actual width (may be < ZONE_W on tiny screens)

  // Piece zone: right of board, same width as hand zone
  const pieceL = boardLeft + boardW + Z_GAP;
  const pieceW = ZONE_W;

  return { canvasW, canvasH, boardLeft, boardTop, boardW, boardH, handL, handW, pieceL, pieceW };
}

export const FreeCanvas: React.FC<FreeCanvasProps> = ({ theme }) => {
  const freeCards   = useGameStore((s) => s.freeCards);
  const freeDice    = useGameStore((s) => s.freeDice);
  const boardPieces = useGameStore((s) => s.boardPieces);
  const placeCardFromDeck = useGameStore((s) => s.placeCardFromDeck);
  const decks = useGameStore((s) => s.decks);

  const { boardLeft, boardTop, boardH, handL, handW, pieceL, pieceW } = useMemo(calcBoardLayout, []);

  // Card spawn: 2 columns inside hand zone, stacking downward
  const colW = Math.max(CARD_W, Math.floor(handW / 2));
  const spawnCard = useCallback((deckId: string) => {
    const n = useGameStore.getState().freeCards.length;
    const col = n % 2;
    const row = Math.floor(n / 2) % 8;
    const x = handL + 4 + col * Math.min(colW, handW - CARD_W - 4);
    const y = boardTop + 30 + row * 52;
    placeCardFromDeck(deckId, x, y);
  }, [handL, handW, boardTop, colW, placeCardFromDeck]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement) !== e.currentTarget) return;
    const id = Object.keys(decks)[0];
    if (id) spawnCard(id);
  }, [decks, spawnCard]);

  const isDark = theme === 'night';
  const bg: React.CSSProperties = isDark ? {
    backgroundColor: '#0d0d1a',
    backgroundImage: ['radial-gradient(ellipse at 20% 50%, rgba(109,40,217,0.07) 0%, transparent 60%)',
      'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)'].join(', '),
    backgroundSize: '100% 100%, 40px 40px, 40px 40px',
  } : {
    backgroundColor: '#e8e0d0',
    backgroundImage: ['radial-gradient(ellipse at 15% 30%, rgba(255,220,150,0.4) 0%, transparent 55%)',
      'linear-gradient(rgba(100,80,60,0.06) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(100,80,60,0.06) 1px, transparent 1px)'].join(', '),
    backgroundSize: '100% 100%, 40px 40px, 40px 40px',
  };

  const handAccent  = isDark ? 'rgba(99,102,241,0.55)' : 'rgba(79,70,229,0.4)';
  const pieceAccent = isDark ? 'rgba(249,115,22,0.72)' : 'rgba(217,85,10,0.55)';
  const lbl: React.CSSProperties = { position:'absolute', top:8, left:0, right:0, textAlign:'center', fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase' };

  return (
    <div className="absolute inset-0 overflow-hidden transition-all duration-700" style={bg} onDoubleClick={handleDoubleClick}>

      {/* Hand zone */}
      <div className="pointer-events-none absolute" style={{ left:handL, top:boardTop, width:handW, height:boardH, border:`1.5px dashed ${handAccent}`, background: isDark?'rgba(99,102,241,0.05)':'rgba(99,102,241,0.07)', backdropFilter:'blur(4px)', borderRadius:16 }}>
        <div style={{ ...lbl, color:handAccent }}>🃏 手牌區</div>
      </div>

      {/* Piece zone */}
      <div className="pointer-events-none absolute" style={{ left:pieceL, top:boardTop, width:pieceW, height:boardH, border:`2px solid ${pieceAccent}`, background: isDark?'rgba(249,115,22,0.06)':'rgba(249,115,22,0.08)', backdropFilter:'blur(4px)', borderRadius:16, boxShadow: isDark?'0 0 24px rgba(249,115,22,0.15)':'0 0 14px rgba(249,115,22,0.12)' }}>
        <div style={{ ...lbl, color:pieceAccent }}>♟️ 棋子區</div>
      </div>

      {/* Board */}
      <div className="absolute pointer-events-none" style={{ left:boardLeft, top:boardTop, zIndex:2 }}>
        <div className="pointer-events-auto"><BoardGrid theme={theme} /></div>
      </div>

      {freeDice.map((d)    => <FreeDice  key={d.id}         dice={d}  />)}
      {boardPieces.map((p) => <FreePiece key={p.id}         piece={p} />)}
      {freeCards.map((c)   => <FreeCard  key={c.instanceId} card={c}  theme={theme} />)}
    </div>
  );
};
