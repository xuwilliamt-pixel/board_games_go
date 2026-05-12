import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FreeCard } from '../FreeCard/FreeCard';
import { FreeDice } from '../FreeDice/FreeDice';
import { FreePiece } from '../FreePiece/FreePiece';
import { BoardGrid } from '../BoardGrid/BoardGrid';

interface FreeCanvasProps { theme: 'day' | 'night'; }

export const CARD_W = 74;
export const ZONE_W = CARD_W * 2 + 4;   // 152px — 2 cards wide
const Z_GAP = 8;

// ── Layout calculation (pure function, no side-effects) ────────
export function calcBoardLayout(canvasW = 0, canvasH = 0) {
  if (!canvasW) canvasW = window.innerWidth;
  if (!canvasH) canvasH = window.innerHeight - 56;

  const GAP = 10;
  const boardAvailW = canvasW - 2 * (ZONE_W + Z_GAP);
  const boardAvailH = canvasH - 60;
  const cellFromW = Math.floor((boardAvailW - 32 - GAP * 4) / 5);
  const cellFromH = Math.floor((boardAvailH - 32 - GAP * 4 - 68) / 5);
  const cellSize = Math.max(70, Math.min(110, Math.min(cellFromW, cellFromH)));

  const boardGrid = cellSize * 5 + GAP * 4;
  const boardW = boardGrid + 32;
  const boardH = boardGrid + 32 + 68;

  const boardLeft = Math.round((canvasW - boardW) / 2);
  const boardTop = Math.max(10, Math.round((canvasH - boardH) / 2));

  const handL = Math.max(0, boardLeft - ZONE_W - Z_GAP);
  const handW = boardLeft - Z_GAP - handL;

  const pieceL = boardLeft + boardW + Z_GAP;
  const pieceW = ZONE_W;

  return { canvasW, canvasH, boardLeft, boardTop, boardW, boardH, handL, handW, pieceL, pieceW, cellSize };
}

export const FreeCanvas: React.FC<FreeCanvasProps> = ({ theme }) => {
  const freeCards = useGameStore((s) => s.freeCards);
  const freeDice = useGameStore((s) => s.freeDice);
  const boardPieces = useGameStore((s) => s.boardPieces);
  const placeCardFromDeck = useGameStore((s) => s.placeCardFromDeck);
  const decks = useGameStore((s) => s.decks);

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = calcBoardLayout(
    canvasSize.w || undefined,
    canvasSize.h || undefined,
  );
  const { boardLeft, boardTop, boardH, handL, handW, pieceL, pieceW } = layout;

  const spawnCard = useCallback((deckId: string) => {
    const l = calcBoardLayout(
      containerRef.current?.clientWidth,
      containerRef.current?.clientHeight,
    );
    const n = useGameStore.getState().freeCards.length;
    const col = n % 2;
    const row = Math.floor(n / 2) % 8;
    const colW = Math.max(CARD_W, Math.floor(l.handW / 2));
    const x = l.handL + 4 + col * Math.min(colW, l.handW - CARD_W - 4);
    const y = l.boardTop + 30 + row * 52;
    placeCardFromDeck(deckId, x, y);
  }, [placeCardFromDeck]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement) !== e.currentTarget) return;
    const id = Object.keys(decks)[0];
    if (id) spawnCard(id);
  }, [decks, spawnCard]);

  const isDark = theme === 'night';

  const bg: React.CSSProperties = isDark
    ? {
      backgroundColor: '#070B14',
      backgroundImage: [
        'radial-gradient(ellipse at 20% 40%, rgba(139,92,255,0.07) 0%, transparent 55%)',
        'radial-gradient(ellipse at 80% 60%, rgba(36,216,255,0.05) 0%, transparent 50%)',
        'linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px)',
        'linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
    }
    : {
      backgroundColor: '#F3F6FB',
      backgroundImage: [
        'radial-gradient(ellipse at 20% 30%, rgba(107,63,212,0.06) 0%, transparent 55%)',
        'radial-gradient(ellipse at 80% 70%, rgba(14,165,201,0.05) 0%, transparent 50%)',
        'linear-gradient(rgba(26,35,64,0.04) 1px, transparent 1px)',
        'linear-gradient(90deg, rgba(26,35,64,0.04) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
    };

  const handBorder = isDark ? 'rgba(99,102,241,0.52)' : 'rgba(107,63,212,0.38)';
  const handBg = isDark ? 'rgba(99,102,241,0.06)' : 'rgba(107,63,212,0.05)';
  const pieceBorder = isDark ? 'rgba(255,157,66,0.68)' : 'rgba(224,122,32,0.52)';
  const pieceBg = isDark ? 'rgba(255,157,66,0.07)' : 'rgba(224,122,32,0.06)';
  const pieceShadow = isDark
    ? '0 0 32px rgba(255,157,66,0.18), inset 0 0 14px rgba(255,157,66,0.04)'
    : '0 0 18px rgba(224,122,32,0.14)';

  const zoneLabelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  return (
    <div
      ref={containerRef}
      data-canvas="true"
      className="absolute inset-0 overflow-hidden"
      style={{ ...bg, transition: 'background-color 0.5s' }}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── Hand Zone ── */}
      {handW > 20 && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: handL,
            top: boardTop,
            width: handW,
            height: boardH,
            border: `1.5px dashed ${handBorder}`,
            background: handBg,
            backdropFilter: 'blur(4px)',
            borderRadius: 16,
            transition: 'left 0.3s, width 0.3s, top 0.3s, height 0.3s',
          }}
        >
          <div style={{ ...zoneLabelStyle, color: handBorder }}>🃏 手牌區</div>
        </div>
      )}

      {/* ── Piece Zone ── */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: pieceL,
          top: boardTop,
          width: pieceW,
          height: boardH,
          border: `2px solid ${pieceBorder}`,
          background: pieceBg,
          backdropFilter: 'blur(4px)',
          borderRadius: 16,
          boxShadow: pieceShadow,
          transition: 'left 0.3s, top 0.3s, height 0.3s',
        }}
      >
        <div style={{ ...zoneLabelStyle, color: pieceBorder }}>♟️ 棋子區</div>
      </div>

      {/* ── Board ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: boardLeft,
          top: boardTop,
          zIndex: 2,
          transition: 'left 0.3s, top 0.3s',
        }}
      >
        <div className="pointer-events-auto">
          <BoardGrid theme={theme} canvasSize={canvasSize} />
        </div>
      </div>

      {/* ── Floating elements ── */}
      {freeDice.map((d) => <FreeDice key={d.id} dice={d} />)}
      {boardPieces.map((p) => <FreePiece key={p.id} piece={p} />)}
      {freeCards.map((c) => (
        <FreeCard
          key={c.instanceId}
          card={c}
          theme={theme}
          // ← 動態從牌組讀封面，改了封面場上卡片即時更新
          deckBackImage={c.sourceDeckId ? decks[c.sourceDeckId]?.backImage : undefined}
        />
      ))}
    </div>
  );
};