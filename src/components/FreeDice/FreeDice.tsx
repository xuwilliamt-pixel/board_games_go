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
  `;
  document.head.appendChild(s);
}

const ROLL_DURATION = 800;
const TICK_INTERVAL = 60;

// ── FreeDiceSingle ────────────────────────────────────────────
interface FreeDiceSingleProps {
  dice: FreeDiceType;
}

export const FreeDiceSingle: React.FC<FreeDiceSingleProps> = ({ dice }) => {
  const moveDice = useGameStore((s) => s.moveDice);
  const moveDiceEnd = useGameStore((s) => s.moveDiceEnd);
  const removeDice = useGameStore((s) => s.removeDice);
  const bringDiceToFront = useGameStore((s) => s.bringDiceToFront);
  const rollDice = useGameStore((s) => s.rollDice);

  const [isRolling, setIsRolling] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [tick, setTick] = useState(1);
  const [showMenu, setShowMenu] = useState(false);

  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = () => {
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }
  };

  useEffect(() => () => {
    if (rollTimer.current) clearTimeout(rollTimer.current);
    stopTick();
  }, []);

  // ── Drag ─────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    bringDiceToFront(dice.id);
    dragging.current = true;
    hasMoved.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, dx: dice.x, dy: dice.y };
    setShowMenu(false);

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      const ddx = me.clientX - dragStart.current.mx;
      const ddy = me.clientY - dragStart.current.my;
      if (Math.abs(ddx) > 3 || Math.abs(ddy) > 3) hasMoved.current = true;
      moveDice(dice.id, dragStart.current.dx + ddx, dragStart.current.dy + ddy);
    };
    const onUp = () => {
      dragging.current = false;
      if (hasMoved.current) moveDiceEnd(dice.id);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dice, bringDiceToFront, moveDice, moveDiceEnd]);

  // ── Roll ──────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMoved.current || isRolling) return;

    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 180);
    setIsRolling(true);
    rollDice(dice.id);

    stopTick();
    tickTimer.current = setInterval(() => {
      setTick(Math.ceil(Math.random() * dice.sides));
    }, TICK_INTERVAL);

    if (rollTimer.current) clearTimeout(rollTimer.current);
    rollTimer.current = setTimeout(() => {
      stopTick();
      setIsRolling(false);
    }, ROLL_DURATION);
  }, [dice, isRolling, rollDice]);

  // ── Right click ───────────────────────────────────────────────
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu((v) => !v);
  }, []);

  const displayNum = isRolling ? tick : dice.currentValue;

  return (
    <div
      style={{
        position: 'absolute',
        left: dice.x,
        top: dice.y,
        zIndex: dice.zIndex,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Die */}
      <div
        onClick={handleClick}
        onContextMenu={handleRightClick}
        title="點擊搖骰子 · 右鍵選單"
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: isRolling
            ? 'linear-gradient(145deg, #fff8e0 0%, #ffe88a 40%, #f5c842 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 40%, #d0d0d0 100%)',
          boxShadow: isPressing
            ? '0 2px 6px rgba(0,0,0,0.18), inset 0 2px 4px rgba(0,0,0,0.12)'
            : isRolling
              ? '0 6px 22px rgba(245,200,50,0.55), 0 2px 4px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)'
              : '0 6px 16px rgba(0,0,0,0.20), 0 2px 4px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          border: isRolling
            ? '1.5px solid rgba(240,180,30,0.8)'
            : '1px solid rgba(180,180,180,0.6)',
          animation: isPressing ? 'dice-press 180ms ease-out forwards' : 'none',
          transition: isPressing ? 'none' : 'box-shadow 150ms ease, background 200ms ease',
        }}
      >
        {/* Inner bevel */}
        <div style={{
          position: 'absolute', top: 4, left: 4, right: 4, height: 28,
          borderRadius: '14px 14px 50% 50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Corner dots */}
        {[
          { top: 10, left: 10 }, { top: 10, right: 10 },
          { bottom: 10, left: 10 }, { bottom: 10, right: 10 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: 5, height: 5, borderRadius: '50%',
            background: 'rgba(160,160,160,0.35)', ...pos,
          }} />
        ))}

        {/* Number */}
        <span
          key={isRolling ? `tick-${tick}` : `val-${dice.currentValue}`}
          style={{
            fontSize: displayNum >= 10 ? 28 : 32,
            fontWeight: 900,
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
            color: isRolling ? '#7a5000' : '#1a1a1a',
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

        {/* D-sides label */}
        <span style={{
          position: 'absolute', bottom: 5,
          fontSize: 8, fontWeight: 700,
          color: isRolling ? 'rgba(120,80,0,0.5)' : 'rgba(0,0,0,0.22)',
          letterSpacing: '0.08em',
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
        }}>D{dice.sides}</span>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute', top: 0, left: 80,
              background: 'rgba(10,10,20,0.97)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              padding: '6px 4px', minWidth: 140, zIndex: 50,
            }}
            onMouseLeave={() => setShowMenu(false)}
          >
            <div style={{
              padding: '4px 12px 6px', fontSize: 10,
              color: 'rgba(255,255,255,0.28)', fontWeight: 700,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
            }}>
              骰子選項
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); removeDice(dice.id); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', border: 'none', borderRadius: 8,
                background: 'transparent', color: 'rgba(255,100,100,0.7)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms',
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

// ── Legacy exports (backward compat) ─────────────────────────
export const FreeDicePair = FreeDiceSingle;
export const FreeDice: React.FC<{ dice: FreeDiceType }> = (_props) => null;