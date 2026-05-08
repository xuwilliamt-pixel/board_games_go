import React, { useMemo } from 'react';

interface BoardGridProps {
  theme?: 'day' | 'night';
}

const GAP = 8;

export const BoardGrid: React.FC<BoardGridProps> = ({ theme = 'night' }) => {
  const isDark = theme === 'night';

  // Compute cell size dynamically so board fits the available canvas
  const { cellSize, boardTotal } = useMemo(() => {
    const ZONE_W = 152, Z_GAP = 8;
    const canvasW  = window.innerWidth  - 226 - 286;
    const canvasH  = window.innerHeight - 56;
    const boardAvailW = canvasW - 2 * (ZONE_W + Z_GAP);
    const boardAvailH = canvasH - 60;
    const cellFromW = Math.floor((boardAvailW - 32 - GAP * 4) / 5);
    const cellFromH = Math.floor((boardAvailH - 32 - GAP * 4 - 58) / 5);
    const cs = Math.max(55, Math.min(100, Math.min(cellFromW, cellFromH)));
    return { cellSize: cs, boardTotal: cs * 5 + GAP * 4 };
  }, []);

  const boardBg = isDark ? 'rgba(15, 10, 35, 0.72)' : 'rgba(210, 195, 170, 0.78)';
  const borderColor = isDark ? 'rgba(139,92,246,0.28)' : 'rgba(100,80,50,0.28)';
  const cellBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';

  return (
    <div
      className="relative rounded-2xl p-4 shadow-xl select-none"
      style={{
        background: boardBg,
        border: `2px solid ${borderColor}`,
        backdropFilter: 'blur(10px)',
        boxShadow: isDark
          ? '0 0 30px rgba(139,92,246,0.12), 0 20px 50px rgba(0,0,0,0.5)'
          : '0 20px 50px rgba(0,0,0,0.15)',
      }}
    >
      {/* Title */}
      <div
        className="text-center text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: isDark ? 'rgba(139,92,246,0.65)' : 'rgba(100,70,30,0.55)' }}
      >
        ⚔️ 5 × 5 戰鬥棋盤
      </div>

      {/* Grid — pure visual reference, no state management */}
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
          return (
            <div
              key={i}
              className="relative rounded-xl transition-colors"
              style={{
                width: cellSize,
                height: cellSize,
                background: cellBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              <span
                className="absolute bottom-0.5 right-1 text-[8px] pointer-events-none select-none"
                style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)' }}
              >
                {row},{col}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 text-center">
        <span
          className="text-[9px] font-semibold"
          style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)' }}
        >
          棋子與卡牌可自由拖放到棋盤格上
        </span>
      </div>
    </div>
  );
};
