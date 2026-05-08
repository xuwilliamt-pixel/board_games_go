import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FreeDice as FreeDiceType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

const DICE_SIDES: FreeDiceType['sides'][] = [4, 6, 8, 10, 12, 20];

export const FreeDice: React.FC<{ dice: FreeDiceType }> = ({ dice }) => {
  const moveDice = useGameStore((s) => s.moveDice);
  const rollDice = useGameStore((s) => s.rollDice);
  const changeDiceSides = useGameStore((s) => s.changeDiceSides);
  const bringDiceToFront = useGameStore((s) => s.bringDiceToFront);

  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(dice.currentValue);
  const [showSidesMenu, setShowSidesMenu] = useState(false);
  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });
  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      bringDiceToFront(dice.id);
      dragging.current = true;
      hasMoved.current = false;
      dragStart.current = { mx: e.clientX, my: e.clientY, dx: dice.x, dy: dice.y };
      setShowSidesMenu(false);

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const ddx = me.clientX - dragStart.current.mx;
        const ddy = me.clientY - dragStart.current.my;
        if (Math.abs(ddx) > 3 || Math.abs(ddy) > 3) hasMoved.current = true;
        moveDice(dice.id, dragStart.current.dx + ddx, dragStart.current.dy + ddy);
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [dice, bringDiceToFront, moveDice]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasMoved.current || isRolling) return;

      setIsRolling(true);
      // Shuffle display value rapidly for visual effect
      let count = 0;
      shuffleRef.current = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * dice.sides) + 1);
        count++;
        if (count > 14) {
          if (shuffleRef.current) clearInterval(shuffleRef.current);
          rollDice(dice.id);
          // Get the final value after rollDice updates the store
          setTimeout(() => {
            setIsRolling(false);
          }, 150);
        }
      }, 60);
    },
    [dice.id, dice.sides, isRolling, rollDice]
  );

  // Sync display value with store when not rolling
  React.useEffect(() => {
    if (!isRolling) {
      setDisplayValue(dice.currentValue);
    }
  }, [dice.currentValue, isRolling]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSidesMenu((v) => !v);
  }, []);

  // Dice shape path for each type
  const getDiceShape = () => {
    switch (dice.sides) {
      case 4:  return <polygon points="50,5 95,88 5,88" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
      case 6:  return <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
      case 8:  return <polygon points="50,5 95,50 50,95 5,50" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
      case 10: return <polygon points="50,5 95,35 80,90 20,90 5,35" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
      case 12: return <polygon points="50,4 93,33 78,82 22,82 7,33" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
      case 20: return <polygon points="50,5 96,85 4,85" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
      default: return <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />;
    }
  };

  return (
    <div
      style={{ position: 'absolute', left: dice.x, top: dice.y, zIndex: dice.zIndex, userSelect: 'none' }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      <motion.div
        className="cursor-grab active:cursor-grabbing relative"
        animate={isRolling ? {
          rotateX: [0, 360, 720, 1080],
          rotateY: [0, 180, 540, 900],
          rotateZ: [0, -90, 200, 0],
          scale: [1, 1.3, 0.85, 1],
        } : {
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
        }}
        transition={isRolling ? {
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        } : {
          type: 'spring',
          stiffness: 400,
          damping: 20,
        }}
        style={{ perspective: '400px' }}
        whileHover={!isRolling ? { scale: 1.1 } : {}}
      >
        <svg width={80} height={80} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="dg" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="60%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>
            <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#7c3aed" floodOpacity="0.6" />
            </filter>
          </defs>
          {getDiceShape()}
          <text
            x="50" y="58"
            textAnchor="middle"
            fontSize={dice.sides >= 20 ? "28" : "34"}
            fontWeight="900"
            fill="white"
            style={{ fontFamily: 'monospace', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            {displayValue}
          </text>
          <text x="50" y="92" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)" fontWeight="bold">
            D{dice.sides}
          </text>
        </svg>

        {/* Glow ring when rolling */}
        {isRolling && (
          <div className="absolute inset-0 rounded-full pointer-events-none">
            <div className="absolute inset-[-8px] rounded-full bg-violet-400/20 animate-ping" />
          </div>
        )}
      </motion.div>

      <div className="text-center text-[9px] text-white/25 mt-0.5 select-none">點擊搖骰 · 右鍵換面數</div>

      {/* Sides picker */}
      <AnimatePresence>
        {showSidesMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            className="absolute top-0 left-[88px] bg-[#1a1a2e]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[130px] z-50"
            onMouseLeave={() => setShowSidesMenu(false)}
          >
            <div className="px-3 py-1.5 text-[10px] text-white/30 font-bold uppercase tracking-wider">骰子面數</div>
            {DICE_SIDES.map((s) => (
              <button
                key={s}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${dice.sides === s ? 'text-violet-300 bg-violet-500/20' : 'text-white/70 hover:bg-white/8'}`}
                onClick={(e) => { e.stopPropagation(); changeDiceSides(dice.id, s); setShowSidesMenu(false); }}
              >
                <span>D{s}</span>
                {dice.sides === s && <span className="text-violet-400">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
