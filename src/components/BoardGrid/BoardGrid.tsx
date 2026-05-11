import React, { useMemo, useState } from 'react';
import { calcBoardLayout } from '../FreeCanvas/FreeCanvas';

interface BoardGridProps {
  theme?: 'day' | 'night';
  canvasSize?: { w: number; h: number };
}

const GAP = 10;

export const BoardGrid: React.FC<BoardGridProps> = ({ theme = 'night', canvasSize }) => {
  const isDark = theme === 'night';
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const { cellSize, boardTotal } = useMemo(() => {
    const layout = calcBoardLayout(
      canvasSize?.w || undefined,
      canvasSize?.h || undefined,
    );
    return { cellSize: layout.cellSize, boardTotal: layout.cellSize * 5 + GAP * 4 };
  }, [canvasSize?.w, canvasSize?.h]);

  // Color definitions using CSS vars via inline style won't work easily, so we define both here
  const boardBg    = isDark ? 'rgba(14, 21, 37, 0.85)'  : 'rgba(255, 255, 255, 0.92)';
  const boardBorder = isDark ? 'rgba(139, 92, 255, 0.35)' : '#D9E2F2';
  const boardGlow  = isDark
    ? '0 0 40px rgba(139,92,255,0.15), 0 24px 60px rgba(0,0,0,0.6)'
    : '0 8px 40px rgba(26,35,64,0.10), 0 2px 8px rgba(26,35,64,0.06)';

  const cellBg       = isDark ? 'rgba(255,255,255,0.028)' : '#F3F6FB';
  const cellBorder   = isDark ? 'rgba(139,92,255,0.18)'   : '#D9E2F2';
  const cellHoverBg  = isDark ? 'rgba(139,92,255,0.12)'   : '#EEF3FC';
  const cellHoverBorder = isDark ? 'rgba(139,92,255,0.55)' : '#8B5CFF';
  const cellHoverGlow   = isDark
    ? '0 0 16px rgba(139,92,255,0.30), inset 0 0 10px rgba(139,92,255,0.08)'
    : '0 0 12px rgba(107,63,212,0.18)';

  const coordColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,35,64,0.14)';
  const titleColor = isDark ? 'rgba(139,92,255,0.70)'  : '#6B3FD4';
  const legendColor = isDark ? 'rgba(255,255,255,0.28)' : '#9AA3BA';

  return (
    <div
      className="relative rounded-2xl select-none"
      style={{
        background: boardBg,
        border: `2px solid ${boardBorder}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: boardGlow,
        padding: 16,
      }}
    >
      {/* ── Board Title ── */}
      <div
        className="text-center mb-3 font-bold tracking-widest uppercase"
        style={{ fontSize: 13, color: titleColor, letterSpacing: '0.14em' }}
      >
        ⚔️ &nbsp;5 × 5 戰鬥棋盤
      </div>

      {/* ── Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(5, ${cellSize}px)`,
          gap: `${GAP}px`,
          width: boardTotal,
        }}
      >
        {Array.from({ length: 25 }, (_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const isHovered = hoveredCell === i;

          return (
            <div
              key={i}
              className="board-cell"
              onMouseEnter={() => setHoveredCell(i)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                width: cellSize,
                height: cellSize,
                background: isHovered ? cellHoverBg : cellBg,
                border: `1.5px solid ${isHovered ? cellHoverBorder : cellBorder}`,
                borderRadius: 12,
                boxShadow: isHovered
                  ? cellHoverGlow
                  : isDark
                    ? '0 2px 8px rgba(0,0,0,0.3)'
                    : '0 1px 4px rgba(26,35,64,0.06)',
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 160ms ease-out',
                position: 'relative',
                cursor: 'default',
                zIndex: isHovered ? 2 : 1,
              }}
            >
              {/* Coordinate badge */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  color: isHovered
                    ? isDark ? 'rgba(139,92,255,0.7)' : 'rgba(107,63,212,0.6)'
                    : coordColor,
                  transition: 'color 160ms ease-out',
                  letterSpacing: '0.02em',
                }}
              >
                {row},{col}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div
        className="mt-3 text-center"
        style={{ fontSize: 12, color: legendColor, fontWeight: 500 }}
      >
        棋子與卡牌可自由拖放到任意格上
      </div>
    </div>
  );
};
