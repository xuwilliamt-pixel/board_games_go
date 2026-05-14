import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FreeCard } from '../FreeCard/FreeCard';
import { FreeDicePair } from '../FreeDice/FreeDice';
import { FreePiece } from '../FreePiece/FreePiece';
import { BoardGrid } from '../BoardGrid/BoardGrid';

interface FreeCanvasProps { theme: 'day' | 'night'; }

export const CARD_W = 74;
export const ZONE_W = CARD_W * 2 + 4;
const Z_GAP = 8;

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

  const handZoneH = boardH;
  const handH = Math.floor(handZoneH / 2);
  const discardH = handZoneH - handH;
  const discardTop = boardTop + handH;

  return {
    canvasW, canvasH,
    boardLeft, boardTop, boardW, boardH,
    handL, handW, handH,
    discardTop, discardH,
    pieceL, pieceW,
    cellSize,
  };
}

export function isInDiscardZone(x: number, y: number): boolean {
  const l = calcBoardLayout();
  return (
    x >= l.handL &&
    x <= l.handL + l.handW &&
    y >= l.discardTop &&
    y <= l.discardTop + l.discardH
  );
}

export const FreeCanvas: React.FC<FreeCanvasProps> = ({ theme }) => {
  const freeCards = useGameStore((s) => s.freeCards);
  const freeDice = useGameStore((s) => s.freeDice);
  const boardPieces = useGameStore((s) => s.boardPieces);
  const discardPile = useGameStore((s) => s.discardPile);
  const placeCardFromDeck = useGameStore((s) => s.placeCardFromDeck);
  const restoreDiscardPile = useGameStore((s) => s.restoreDiscardPile);
  const decks = useGameStore((s) => s.decks);

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [discardHover, setDiscardHover] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

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
  const { boardLeft, boardTop, boardH, handL, handW, handH, discardTop, discardH, pieceL, pieceW } = layout;

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

  const handleRestoreConfirm = () => {
    restoreDiscardPile();
    setConfirmRestore(false);
  };

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

  const discardBorder = discardHover
    ? (isDark ? 'rgba(255,160,50,0.85)' : 'rgba(200,110,10,0.75)')
    : (isDark ? 'rgba(255,160,50,0.45)' : 'rgba(200,110,10,0.38)');
  const discardBg = discardHover
    ? (isDark ? 'rgba(255,160,50,0.14)' : 'rgba(255,160,50,0.10)')
    : (isDark ? 'rgba(255,160,50,0.06)' : 'rgba(255,160,50,0.04)');
  const discardShadow = discardHover
    ? (isDark ? '0 0 24px rgba(255,160,50,0.28)' : '0 0 16px rgba(200,110,10,0.18)')
    : 'none';

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

  // ── 將 freeDice 配對成一組組 FreeDicePair ──────────────────
  // 策略：每兩顆一組（index 0+1, 2+3, ...），若奇數顆則最後一顆略過
  const dicePairs: Array<{ a: (typeof freeDice)[0]; b: (typeof freeDice)[0] }> = [];
  for (let i = 0; i + 1 < freeDice.length; i += 2) {
    dicePairs.push({ a: freeDice[i], b: freeDice[i + 1] });
  }

  return (
    <div
      ref={containerRef}
      data-canvas="true"
      className="absolute inset-0 overflow-hidden"
      style={{ ...bg, transition: 'background-color 0.5s' }}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── Hand Zone (top half) ── */}
      {handW > 20 && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: handL, top: boardTop, width: handW, height: handH,
            border: `1.5px dashed ${handBorder}`,
            borderBottom: 'none',
            background: handBg,
            backdropFilter: 'blur(4px)',
            borderRadius: '16px 16px 0 0',
            transition: 'left 0.3s, width 0.3s, top 0.3s, height 0.3s',
          }}
        >
          <div style={{ ...zoneLabelStyle, color: handBorder }}>🃏 手牌區</div>
        </div>
      )}

      {/* ── Discard Zone (bottom half) ── */}
      {handW > 20 && (
        <div
          data-discard-zone="true"
          className="absolute overflow-hidden"
          style={{
            left: handL, top: discardTop, width: handW, height: discardH,
            border: `1.5px dashed ${discardBorder}`,
            background: discardBg,
            backdropFilter: 'blur(4px)',
            borderRadius: '0 0 16px 16px',
            boxShadow: discardShadow,
            transition: 'left 0.3s, width 0.3s, top 0.3s, height 0.3s, border-color 0.2s, background 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            ...zoneLabelStyle, position: 'relative', top: 'unset', left: 'unset', right: 'unset',
            padding: '8px 6px 4px',
            color: isDark ? 'rgba(255,160,50,0.8)' : 'rgba(160,90,10,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0,
          }}>
            <span>🗂️ 棄牌區</span>
            {discardPile.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 800,
                background: isDark ? 'rgba(255,160,50,0.2)' : 'rgba(255,160,50,0.15)',
                border: `1px solid ${isDark ? 'rgba(255,160,50,0.4)' : 'rgba(200,110,10,0.3)'}`,
                borderRadius: 99, padding: '0 6px',
                color: isDark ? '#FFBB55' : '#A05A0A',
              }}>
                {discardPile.length}
              </span>
            )}
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '0 6px 4px',
            display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'auto',
          }}>
            {discardPile.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: isDark ? 'rgba(255,160,50,0.35)' : 'rgba(160,90,10,0.4)',
                fontWeight: 500, textAlign: 'center', padding: '8px 4px', userSelect: 'none',
              }}>
                拖曳卡牌至此<br />棄入此區
              </div>
            ) : (
              discardPile.map((dc) => (
                <div key={dc.instanceId} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 6px', borderRadius: 8,
                  background: isDark ? 'rgba(255,160,50,0.08)' : 'rgba(255,160,50,0.07)',
                  border: `1px solid ${isDark ? 'rgba(255,160,50,0.2)' : 'rgba(200,110,10,0.2)'}`,
                  fontSize: 11, fontWeight: 500,
                  color: isDark ? 'rgba(255,220,140,0.9)' : '#7A4A08', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>🃏</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dc.name}
                  </span>
                </div>
              ))
            )}
          </div>

          {discardPile.length > 0 && (
            <div style={{ padding: '4px 6px 8px', flexShrink: 0, pointerEvents: 'auto' }}>
              <button
                style={{
                  width: '100%', padding: '6px 0', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: isDark ? 'rgba(255,160,50,0.16)' : 'rgba(255,160,50,0.13)',
                  border: `1.5px solid ${isDark ? 'rgba(255,160,50,0.4)' : 'rgba(200,110,10,0.35)'}`,
                  color: isDark ? '#FFBB55' : '#9A5200',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,160,50,0.28)' : 'rgba(255,160,50,0.22)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,160,50,0.16)' : 'rgba(255,160,50,0.13)';
                }}
                onClick={() => setConfirmRestore(true)}
              >
                ♻️ 回復全部牌組
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Piece Zone ── */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: pieceL, top: boardTop, width: pieceW, height: boardH,
          border: `2px solid ${pieceBorder}`,
          background: pieceBg, backdropFilter: 'blur(4px)',
          borderRadius: 16, boxShadow: pieceShadow,
          transition: 'left 0.3s, top 0.3s, height 0.3s',
        }}
      >
        <div style={{ ...zoneLabelStyle, color: pieceBorder }}>♟️ 棋子區</div>
      </div>

      {/* ── Board ── */}
      <div
        className="absolute pointer-events-none"
        style={{ left: boardLeft, top: boardTop, zIndex: 2, transition: 'left 0.3s, top 0.3s' }}
      >
        <div className="pointer-events-auto">
          <BoardGrid theme={theme} canvasSize={canvasSize} />
        </div>
      </div>

      {/* ── Floating elements ── */}

      {/* 骰子：每兩顆配成一組 FreeDicePair */}
      {dicePairs.map(({ a, b }) => (
        <FreeDicePair key={`pair-${a.id}-${b.id}`} diceA={a} diceB={b} />
      ))}

      {boardPieces.map((p) => <FreePiece key={p.id} piece={p} />)}

      {freeCards.map((c) => (
        <FreeCard
          key={c.instanceId}
          card={c}
          theme={theme}
          deckBackImage={c.sourceDeckId ? decks[c.sourceDeckId]?.backImage : undefined}
          onDiscardHoverChange={setDiscardHover}
        />
      ))}

      {/* ── Confirm Restore Modal ── */}
      {confirmRestore && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          }}
          onClick={() => setConfirmRestore(false)}
        >
          <div
            style={{
              background: '#12121f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '28px 24px', width: 300,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>♻️</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 8 }}>
              回復棄牌區？
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>
              將 {discardPile.length} 張棄牌全數放回<br />原本的牌組，棄牌區會清空。
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(255,160,50,0.18)',
                  border: '1.5px solid rgba(255,160,50,0.4)',
                  color: '#FFBB55', transition: 'all 150ms',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,160,50,0.32)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,160,50,0.18)')}
                onClick={handleRestoreConfirm}
              >
                確認回復
              </button>
              <button
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', transition: 'all 150ms',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
                onClick={() => setConfirmRestore(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};