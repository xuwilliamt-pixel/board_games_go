import React from 'react';

interface BoardGridProps {
  theme?: 'day' | 'night';
}

const CELL_SIZE = 64;
const GAP = 6;
const BOARD_TOTAL = CELL_SIZE * 5 + GAP * 4;

export const BoardGrid: React.FC<BoardGridProps> = ({ theme = 'night' }) => {
  const isDark = theme === 'night';

  const boardBg = isDark ? 'rgba(15, 10, 35, 0.7)' : 'rgba(210, 195, 170, 0.75)';
  const borderColor = isDark ? 'rgba(139,92,246,0.25)' : 'rgba(100,80,50,0.25)';
  const cellBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';

  return (
    <div
      className="relative rounded-2xl p-4 shadow-xl select-none"
      style={{
        background: boardBg,
        border: `2px solid ${borderColor}`,
        backdropFilter: 'blur(10px)',
        boxShadow: isDark
          ? '0 0 30px rgba(139,92,246,0.1), 0 20px 50px rgba(0,0,0,0.45)'
          : '0 20px 50px rgba(0,0,0,0.15)',
      }}
    >
      {/* Title */}
      <div
        className="text-center text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: isDark ? 'rgba(139,92,246,0.6)' : 'rgba(100,70,30,0.5)' }}
      >
        ⚔️ 5 × 5 戰鬥棋盤
      </div>

      {/* Grid cells — purely visual */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(5, ${CELL_SIZE}px)`,
          gap: `${GAP}px`,
          width: BOARD_TOTAL,
        }}
      >
        {Array.from({ length: 25 }, (_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return (
            <div
              key={i}
              className="relative rounded-xl"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
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
          style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}
        >
          棋子與卡牌可自由拖放到棋盤上
        </span>
      </div>
    </div>
  );
};
