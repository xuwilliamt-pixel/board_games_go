import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FreeDice as FreeDiceType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

// ── Injected keyframes ────────────────────────────────────────
const STYLE_ID = 'freedice-keyframes-v2';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes slot-tick {
      0%   { transform: translateY(0px);   opacity: 1; }
      25%  { transform: translateY(-8px);  opacity: 0.3; }
      50%  { transform: translateY(6px);   opacity: 0.2; }
      75%  { transform: translateY(-4px);  opacity: 0.6; }
      100% { transform: translateY(0px);   opacity: 1; }
    }
    @keyframes dice-settle {
      0%   { transform: scale(1.18); }
      55%  { transform: scale(0.95); }
      80%  { transform: scale(1.04); }
      100% { transform: scale(1); }
    }
    @keyframes dice-press {
      0%   { transform: scale(1); }
      40%  { transform: scale(0.92); }
      100% { transform: scale(1); }
    }
    @keyframes sum-pop {
      0%   { transform: scale(0.7) translateY(4px); opacity: 0; }
      60%  { transform: scale(1.12) translateY(-1px); opacity: 1; }
      100% { transform: scale(1) translateY(0px); opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

const ROLL_DURATION = 800; // ms
const TICK_INTERVAL = 60;  // ms between random number flashes

// ── Single die display ────────────────────────────────────────
interface SingleDieProps {
  value: number;
  isRolling: boolean;
  tickValue: number;
  isPressing: boolean;
  onInteract: (e: React.MouseEvent) => void;
  onRightClick: (e: React.MouseEvent) => void;
  zIndex: number;
}

const SingleDie: React.FC<SingleDieProps> = ({
  value, isRolling, tickValue, isPressing, onInteract, onRightClick, zIndex
}) => {
  const displayNum = isRolling ? tickValue : value;

  return (
    <div
      onClick={onInteract}
      onContextMenu={onRightClick}
      style={{
        width: 72,
        height: 72,
        borderRadius: 18,
        background: 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 40%, #d0d0d0 100%)',
        boxShadow: isPressing
          ? '0 2px 6px rgba(0,0,0,0.18), inset 0 2px 4px rgba(0,0,0,0.12)'
          : '0 6px 16px rgba(0,0,0,0.20), 0 2px 4px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(180,180,180,0.6)',
        animation: isPressing
          ? `dice-press 180ms ease-out forwards`
          : isRolling
            ? 'none'
            : 'none',
        transition: isPressing ? 'none' : 'box-shadow 150ms ease',
        zIndex,
      }}
    >
      {/* Inner bevel top-left highlight */}
      <div style={{
        position: 'absolute',
        top: 4, left: 4, right: 4,
        height: 28,
        borderRadius: '14px 14px 50% 50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Corner dots (like real D6 but subtle) */}
      {[
        { top: 10, left: 10 }, { top: 10, right: 10 },
        { bottom: 10, left: 10 }, { bottom: 10, right: 10 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 5, height: 5,
          borderRadius: '50%',
          background: 'rgba(160,160,160,0.35)',
          ...pos,
        }} />
      ))}

      {/* Number */}
      <span
        key={isRolling ? `tick-${tickValue}` : `val-${value}`}
        style={{
          fontSize: displayNum >= 10 ? 28 : 32,
          fontWeight: 900,
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          color: '#1a1a1a',
          letterSpacing: '-1px',
          lineHeight: 1,
          animation: isRolling
            ? `slot-tick ${TICK_INTERVAL * 2}ms ease-in-out`
            : `dice-settle 320ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
          display: 'block',
          position: 'relative',
          zIndex: 2,
          textShadow: '0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {displayNum}
      </span>

      {/* D12 label bottom */}
      <span style={{
        position: 'absolute',
        bottom: 5,
        fontSize: 8,
        fontWeight: 700,
        color: 'rgba(0,0,0,0.22)',
        letterSpacing: '0.08em',
        fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
      }}>D12</span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
// This component renders BOTH dice together as one unit.
// It should be placed once in FreeCanvas, not once per die.
// Props: pass both dice objects.
interface FreeDicePairProps {
  diceA: FreeDiceType;
  diceB: FreeDiceType;
}

export const FreeDicePair: React.FC<FreeDicePairProps> = ({ diceA, diceB }) => {
  const moveDice = useGameStore((s) => s.moveDice);
  const moveDiceEnd = useGameStore((s) => s.moveDiceEnd);
  const rollDice = useGameStore((s) => s.rollDice);
  const removeDice = useGameStore((s) => s.removeDice);
  const bringDiceToFront = useGameStore((s) => s.bringDiceToFront);

  const [isRolling, setIsRolling] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [tickA, setTickA] = useState(diceA.currentValue);
  const [tickB, setTickB] = useState(diceB.currentValue);
  const [sumKey, setSumKey] = useState(0);
  const [showSidesMenu, setShowSidesMenu] = useState(false);

  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use diceA position as anchor for both
  const x = diceA.x;
  const y = diceA.y;

  const stopTick = () => {
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }
  };

  // ── Drag ──────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    bringDiceToFront(diceA.id);
    bringDiceToFront(diceB.id);
    dragging.current = true;
    hasMoved.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, dx: x, dy: y };
    setShowSidesMenu(false);

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      const ddx = me.clientX - dragStart.current.mx;
      const ddy = me.clientY - dragStart.current.my;
      if (Math.abs(ddx) > 3 || Math.abs(ddy) > 3) hasMoved.current = true;
      const nx = dragStart.current.dx + ddx;
      const ny = dragStart.current.dy + ddy;
      moveDice(diceA.id, nx, ny);
      moveDice(diceB.id, nx + 84, ny); // keep B offset
    };
    const onUp = () => {
      dragging.current = false;
      if (hasMoved.current) {
        moveDiceEnd(diceA.id);
        moveDiceEnd(diceB.id);
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [diceA, diceB, x, y, bringDiceToFront, moveDice, moveDiceEnd]);

  // ── Roll both dice ─────────────────────────────────────────
  const handleDiceClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMoved.current || isRolling) return;

    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 180);

    setIsRolling(true);

    // Roll both in store
    rollDice(diceA.id);
    rollDice(diceB.id);

    // Slot machine tick
    stopTick();
    tickTimer.current = setInterval(() => {
      setTickA(Math.ceil(Math.random() * 12));
      setTickB(Math.ceil(Math.random() * 12));
    }, TICK_INTERVAL);

    if (rollTimer.current) clearTimeout(rollTimer.current);
    rollTimer.current = setTimeout(() => {
      stopTick();
      setIsRolling(false);
      setSumKey((k) => k + 1);
    }, ROLL_DURATION);
  }, [diceA.id, diceB.id, isRolling, rollDice]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSidesMenu((v) => !v);
  }, []);

  useEffect(() => () => {
    if (rollTimer.current) clearTimeout(rollTimer.current);
    stopTick();
  }, []);

  const sum = diceA.currentValue + diceB.currentValue;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: Math.max(diceA.zIndex, diceB.zIndex),
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Dice pair container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>

        {/* Two dice side by side */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SingleDie
            value={diceA.currentValue}
            isRolling={isRolling}
            tickValue={tickA}
            isPressing={isPressing}
            onInteract={handleDiceClick}
            onRightClick={handleRightClick}
            zIndex={diceA.zIndex}
          />
          <SingleDie
            value={diceB.currentValue}
            isRolling={isRolling}
            tickValue={tickB}
            isPressing={isPressing}
            onInteract={handleDiceClick}
            onRightClick={handleRightClick}
            zIndex={diceB.zIndex}
          />
        </div>

        {/* Sum display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 14px',
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <span style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          }}>
            {isRolling ? `${tickA} + ${tickB}` : `${diceA.currentValue} + ${diceB.currentValue}`}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>=</span>
          <span
            key={sumKey}
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
              animation: !isRolling ? `sum-pop 280ms cubic-bezier(0.34,1.56,0.64,1) forwards` : 'none',
              letterSpacing: '-0.5px',
            }}
          >
            {isRolling ? tickA + tickB : sum}
          </span>
        </div>

        {/* Hint */}
        <div style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.20)',
          letterSpacing: '0.04em',
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
        }}>
          點擊搖骰 · 右鍵選單
        </div>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {showSidesMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 172,
              background: 'rgba(10,10,20,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              padding: '6px 4px',
              minWidth: 140,
              zIndex: 50,
            }}
            onMouseLeave={() => setShowSidesMenu(false)}
          >
            <div style={{
              padding: '4px 12px 6px',
              fontSize: 10,
              color: 'rgba(255,255,255,0.28)',
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
            }}>
              骰子選項
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); removeDice(diceA.id); removeDice(diceB.id); }}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', border: 'none', borderRadius: 8,
                background: 'transparent',
                color: 'rgba(255,100,100,0.7)',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 120ms',
                fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,80,80,0.12)';
                (e.currentTarget as HTMLElement).style.color = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,100,100,0.7)';
              }}
            >
              🗑️ 移除骰子
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Legacy single die export (for backward compat) ────────────
export const FreeDice: React.FC<{ dice: FreeDiceType }> = ({ dice }) => {
  // This is kept for backward compatibility but the pair version is preferred.
  // In FreeCanvas, replace two <FreeDice> with one <FreeDicePair>.
  return null;
};