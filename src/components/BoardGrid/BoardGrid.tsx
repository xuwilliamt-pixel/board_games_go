import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import type { BoardPiece } from '../../types/game';

interface BoardGridProps {
  theme?: 'day' | 'night';
}

const CELL_SIZE = 64; // px
const GAP = 6; // px
const BOARD_TOTAL = CELL_SIZE * 5 + GAP * 4;

export const BoardGrid: React.FC<BoardGridProps> = ({ theme = 'night' }) => {
  const boardPieces = useGameStore((s) => s.boardPieces);
  const moveBoardPiece = useGameStore((s) => s.moveBoardPiece);
  const removeBoardPiece = useGameStore((s) => s.removeBoardPiece);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const isDark = theme === 'night';

  const getPieceAt = (row: number, col: number): BoardPiece | undefined =>
    boardPieces.find((p) => p.row === row && p.col === col);

  const handleCellClick = (row: number, col: number) => {
    setContextMenu(null);
    if (selectedId) {
      const piece = boardPieces.find((p) => p.id === selectedId);
      if (!piece) { setSelectedId(null); return; }
      const target = getPieceAt(row, col);
      if (target && target.id !== selectedId) {
        // Swap positions
        moveBoardPiece(target.id, piece.row, piece.col);
      }
      moveBoardPiece(selectedId, row, col);
      setSelectedId(null);
    } else {
      const piece = getPieceAt(row, col);
      if (piece) setSelectedId(piece.id);
    }
  };

  const handlePieceRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
    setSelectedId(null);
  };

  const boardBg = isDark
    ? 'rgba(15, 10, 35, 0.85)'
    : 'rgba(210, 195, 170, 0.88)';
  const borderColor = isDark ? 'rgba(139,92,246,0.3)' : 'rgba(100,80,50,0.3)';
  const cellBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

  return (
    <>
      {/* Board */}
      <div
        className="relative rounded-2xl p-4 shadow-2xl select-none"
        style={{
          background: boardBg,
          border: `2px solid ${borderColor}`,
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 0 40px rgba(139,92,246,0.15), 0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={() => { setContextMenu(null); if (!selectedId) return; }}
      >
        {/* Title */}
        <div className="text-center text-xs font-black uppercase tracking-widest mb-3"
          style={{ color: isDark ? 'rgba(139,92,246,0.7)' : 'rgba(100,70,30,0.6)' }}>
          ⚔️ 遊戲棋盤 5×5
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, ${CELL_SIZE}px)`,
            gap: `${GAP}px`,
            width: BOARD_TOTAL,
          }}
        >
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => {
              const piece = getPieceAt(row, col);
              const isSelected = piece?.id === selectedId;
              const isTarget = !!selectedId && !piece;

              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => handleCellClick(row, col)}
                  className="relative rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: isTarget
                      ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(100,70,30,0.15)')
                      : cellBg,
                    border: isTarget
                      ? `2px dashed ${isDark ? '#8b5cf6' : '#7c5a28'}`
                      : `1px solid ${borderColor}`,
                    boxShadow: isTarget
                      ? (isDark ? '0 0 12px rgba(139,92,246,0.3)' : 'none')
                      : 'none',
                  }}
                >
                  {/* Coordinate label */}
                  <span className="absolute bottom-0.5 right-1 text-[8px] pointer-events-none"
                    style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }}>
                    {row},{col}
                  </span>

                  {/* Piece */}
                  {piece && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : piece.id); setContextMenu(null); }}
                      onContextMenu={(e) => handlePieceRightClick(e, piece.id)}
                      className="absolute inset-1 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                      style={{
                        background: `${piece.color}25`,
                        border: `2px solid ${isSelected ? piece.color : `${piece.color}60`}`,
                        boxShadow: isSelected
                          ? `0 0 16px ${piece.color}80, inset 0 0 8px ${piece.color}30`
                          : `0 0 6px ${piece.color}30`,
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      <span className="text-lg leading-none">{piece.emoji}</span>
                      <span className="text-[8px] font-black leading-none mt-0.5"
                        style={{ color: piece.color }}>
                        {piece.label}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-[8px] font-semibold" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
            點擊棋子選取 → 點格子移動 · 右鍵刪除
          </span>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[9999] rounded-xl shadow-2xl py-1 min-w-[120px] border backdrop-blur-xl"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              background: isDark ? 'rgba(20,15,40,0.96)' : 'rgba(240,233,220,0.96)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              onClick={() => { removeBoardPiece(contextMenu.id); setContextMenu(null); }}
            >
              🗑️ 刪除棋子
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
