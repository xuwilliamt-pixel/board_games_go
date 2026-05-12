import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FreeDice as FreeDiceType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

const DICE_SIDES: FreeDiceType['sides'][] = [4, 6, 8, 10, 12, 20];

const DICE_THEME: Record<number, { from: string; mid: string; to: string; glow: string; accent: string; textColor: string }> = {
  4: { from: '#f97316', mid: '#ea580c', to: '#7c2d12', glow: '#f97316', accent: '#fed7aa', textColor: '#fff' },
  6: { from: '#f0f0f0', mid: '#d8d8d8', to: '#a0a0a0', glow: '#cccccc', accent: '#1a1a1a', textColor: '#1a1a1a' },
  8: { from: '#34d399', mid: '#059669', to: '#064e3b', glow: '#10b981', accent: '#a7f3d0', textColor: '#fff' },
  10: { from: '#38bdf8', mid: '#0284c7', to: '#0c4a6e', glow: '#0ea5e9', accent: '#bae6fd', textColor: '#fff' },
  12: { from: '#f472b6', mid: '#db2777', to: '#831843', glow: '#ec4899', accent: '#fbcfe8', textColor: '#fff' },
  20: { from: '#fbbf24', mid: '#d97706', to: '#78350f', glow: '#f59e0b', accent: '#fde68a', textColor: '#fff' },
};

const DiceShape: React.FC<{ sides: number; gradId: string; shadowId: string; highlightId: string; bevelId: string }> = ({ sides, gradId, shadowId, highlightId, bevelId }) => {
  const sharedProps = {
    fill: `url(#${gradId})`,
    filter: `url(#${shadowId})`,
    stroke: `url(#${highlightId})`,
    strokeWidth: 1.5,
  };

  // Bevel bottom-right shadow layer (offset dark copy for 3D depth)
  const bevelProps = {
    fill: `url(#${bevelId})`,
    stroke: 'none',
  };

  switch (sides) {
    case 4:
      return (
        <>
          <polygon points="52,9 97,90 7,90" {...bevelProps} />
          <polygon points="50,6 95,87 5,87" {...sharedProps} />
          <polygon points="50,20 82,76 18,76" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        </>
      );
    case 6:
      return (
        <>
          {/* bevel shadow */}
          <rect x="10" y="10" width="86" height="86" rx="16" {...bevelProps} />
          <rect x="7" y="7" width="86" height="86" rx="16" {...sharedProps} />
          {/* inner groove */}
          <rect x="14" y="14" width="72" height="72" rx="12" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
          {/* dots for D6 */}
          {[
            [28, 28], [72, 28],
            [28, 50], [72, 50],
            [28, 72], [72, 72],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="4.5" fill="rgba(0,0,0,0.18)" />
          ))}
        </>
      );
    case 8:
      return (
        <>
          <polygon points="52,7 97,52 52,97 7,52" {...bevelProps} />
          <polygon points="50,5 95,50 50,95 5,50" {...sharedProps} />
          <polygon points="50,18 82,50 50,82 18,50" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        </>
      );
    case 10:
      return (
        <>
          <polygon points="52,8 96,36 82,90 22,90 8,36" {...bevelProps} />
          <polygon points="50,6 94,34 80,88 20,88 6,34" {...sharedProps} />
          <polygon points="50,18 82,38 72,76 28,76 18,38" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        </>
      );
    case 12:
      return (
        <>
          <polygon points="52,7 93,25 97,70 64,97 40,97 7,70 11,25" {...bevelProps} />
          <polygon points="50,5 91,23 95,68 62,95 38,95 5,68 9,23" {...sharedProps} />
          <polygon points="50,16 82,30 86,64 58,86 42,86 14,64 18,30" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        </>
      );
    case 20:
      return (
        <>
          <polygon points="52,7 98,86 6,86" {...bevelProps} />
          <polygon points="50,5 96,84 4,84" {...sharedProps} />
          <polygon points="50,22 80,76 20,76" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <line x1="50" y1="22" x2="50" y2="76" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="22" x2="20" y2="76" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="22" x2="80" y2="76" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </>
      );
    default:
      return <rect x="7" y="7" width="86" height="86" rx="16" {...sharedProps} />;
  }
};

export const FreeDice: React.FC<{ dice: FreeDiceType }> = ({ dice }) => {
  const moveDice = useGameStore((s) => s.moveDice);
  const moveDiceEnd = useGameStore((s) => s.moveDiceEnd);
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

  const theme = DICE_THEME[dice.sides] ?? DICE_THEME[6];
  const gradId = `dg-${dice.id}`;
  const shadowId = `ds-${dice.id}`;
  const highlightId = `dh-${dice.id}`;
  const glowId = `dglow-${dice.id}`;
  const bevelId = `dbevel-${dice.id}`;

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
        if (hasMoved.current) moveDiceEnd(dice.id);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [dice, bringDiceToFront, moveDice, moveDiceEnd]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasMoved.current || isRolling) return;

      setIsRolling(true);
      let count = 0;
      const totalFrames = 18;
      shuffleRef.current = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * dice.sides) + 1);
        count++;
        if (count >= totalFrames) {
          if (shuffleRef.current) clearInterval(shuffleRef.current);
          rollDice(dice.id);
          setTimeout(() => setIsRolling(false), 200);
        }
      }, 50);
    },
    [dice.id, dice.sides, isRolling, rollDice]
  );

  React.useEffect(() => {
    if (!isRolling) setDisplayValue(dice.currentValue);
  }, [dice.currentValue, isRolling]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSidesMenu((v) => !v);
  }, []);

  const textY = dice.sides === 4 ? 66 : dice.sides === 20 ? 63 : 58;
  const fontSize = dice.sides >= 20 ? 26 : dice.sides === 4 ? 28 : 32;

  // White D6 needs darker shadow
  const isWhite = dice.sides === 6;

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
          rotateZ: [0, -25, 30, -40, 20, -15, 8, 0],
          rotateX: [0, 30, -20, 40, -10, 20, 0],
          rotateY: [0, -40, 60, -30, 50, -20, 0],
          scale: [1, 1.25, 0.9, 1.2, 0.95, 1.1, 1],
          y: [0, -18, 4, -12, 2, -6, 0],
        } : { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, y: 0 }}
        transition={isRolling
          ? { duration: 0.85, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 380, damping: 22 }}
        style={{ transformStyle: 'preserve-3d', perspective: 500 }}
        whileHover={!isRolling ? { scale: 1.12, y: -3 } : {}}
      >
        {/* 外層光暈 */}
        <motion.div
          animate={isRolling
            ? { opacity: [0.4, 1, 0.6, 1, 0.5, 1, 0.3], scale: [1, 1.6, 1.2, 1.5, 1.1, 1.3, 1] }
            : { opacity: isWhite ? 0.15 : 0.25, scale: 1 }}
          transition={isRolling ? { duration: 0.85 } : { duration: 0.3 }}
          style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            background: `radial-gradient(circle, ${isWhite ? '#aaaaaa' : theme.glow}55 0%, transparent 70%)`,
            pointerEvents: 'none', zIndex: -1,
          }}
        />

        <svg width={88} height={88} viewBox="0 0 100 100" style={{ overflow: 'visible', display: 'block' }}>
          <defs>
            {/* Main gradient */}
            <radialGradient id={gradId} cx="30%" cy="22%" r="75%">
              <stop offset="0%" stopColor={theme.from} />
              <stop offset="50%" stopColor={theme.mid} />
              <stop offset="100%" stopColor={theme.to} />
            </radialGradient>
            {/* Bevel bottom-right dark gradient */}
            <radialGradient id={bevelId} cx="70%" cy="75%" r="60%">
              <stop offset="0%" stopColor={isWhite ? 'rgba(100,100,100,0.55)' : 'rgba(0,0,0,0.55)'} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            {/* Top-left highlight border */}
            <linearGradient id={highlightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'} />
              <stop offset="45%" stopColor={isWhite ? 'rgba(220,220,220,0.4)' : 'rgba(255,255,255,0.10)'} />
              <stop offset="100%" stopColor={isWhite ? 'rgba(150,150,150,0.15)' : 'rgba(255,255,255,0.02)'} />
            </linearGradient>
            {/* Drop shadow */}
            <filter id={shadowId} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="2" dy="5" stdDeviation="5" floodColor={isWhite ? '#888888' : theme.glow} floodOpacity={isWhite ? '0.45' : '0.55'} />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" floodOpacity="1" />
            </filter>
            {/* Glow filter for number when rolling */}
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <DiceShape sides={dice.sides} gradId={gradId} shadowId={shadowId} highlightId={highlightId} bevelId={bevelId} />

          {/* Top-left specular highlight */}
          <ellipse cx="36" cy="28" rx="15" ry="9"
            fill={isWhite ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)'}
            style={{ pointerEvents: 'none' }}
          />
          {/* Secondary softer highlight */}
          <ellipse cx="30" cy="24" rx="7" ry="4"
            fill={isWhite ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.10)'}
            style={{ pointerEvents: 'none' }}
          />

          {/* Number (hide for D6 since dots show instead) */}
          {dice.sides !== 6 && (
            <text
              x="50" y={textY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight="900"
              fill={theme.textColor}
              filter={isRolling ? `url(#${glowId})` : undefined}
              style={{
                fontFamily: '"Courier New", monospace',
                letterSpacing: '-1px',
                paintOrder: 'stroke fill',
                stroke: isWhite ? 'transparent' : 'rgba(0,0,0,0.25)',
                strokeWidth: 2,
              }}
            >
              {displayValue}
            </text>
          )}

          {/* For D6: show number on top of dots */}
          {dice.sides === 6 && (
            <text
              x="50" y={textY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={28}
              fontWeight="900"
              fill="rgba(0,0,0,0.55)"
              filter={isRolling ? `url(#${glowId})` : undefined}
              style={{ fontFamily: '"Courier New", monospace', letterSpacing: '-1px' }}
            >
              {displayValue}
            </text>
          )}

          {/* D{n} label */}
          <text x="50" y="93" textAnchor="middle" fontSize="8.5"
            fill={isWhite ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.30)'}
            fontWeight="700" letterSpacing="0.5"
          >
            D{dice.sides}
          </text>
        </svg>

        {/* Ground shadow */}
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          width: 48, height: 8, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${isWhite ? '#88888840' : theme.glow + '40'} 0%, transparent 70%)`,
          filter: 'blur(3px)',
          pointerEvents: 'none',
        }} />
      </motion.div>

      {/* Hint text */}
      <div style={{
        textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.22)',
        marginTop: 3, userSelect: 'none', letterSpacing: '0.03em',
      }}>
        點擊搖骰 · 右鍵換面數
      </div>

      {/* Sides menu */}
      <AnimatePresence>
        {showSidesMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute', top: 0, left: 96,
              background: 'rgba(10,10,20,0.97)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              padding: '6px 4px',
              minWidth: 140,
              zIndex: 50,
            }}
            onMouseLeave={() => setShowSidesMenu(false)}
          >
            <div style={{ padding: '4px 12px 6px', fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              骰子面數
            </div>
            {DICE_SIDES.map((s) => {
              const t = DICE_THEME[s];
              const isActive = dice.sides === s;
              const isW = s === 6;
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); changeDiceSides(dice.id, s); setShowSidesMenu(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 12px', border: 'none', borderRadius: 8,
                    background: isActive ? (isW ? 'rgba(220,220,220,0.18)' : `${t.glow}25`) : 'transparent',
                    color: isActive ? (isW ? '#f0f0f0' : t.accent) : 'rgba(255,255,255,0.65)',
                    fontSize: 13, fontWeight: isActive ? 800 : 500,
                    cursor: 'pointer', transition: 'all 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = isW ? 'rgba(220,220,220,0.10)' : `${t.glow}18`;
                      (e.currentTarget as HTMLElement).style.color = isW ? '#f0f0f0' : t.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)';
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                      boxShadow: isW ? '0 0 6px rgba(180,180,180,0.5)' : `0 0 6px ${t.glow}60`,
                      flexShrink: 0,
                      border: isW ? '1px solid rgba(0,0,0,0.15)' : 'none',
                    }} />
                    D{s}
                  </span>
                  {isActive && <span style={{ color: isW ? '#ccc' : t.accent, fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};