import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import type { BoardPiece } from '../../types/game';

export const FreePiece: React.FC<{ piece: BoardPiece }> = ({ piece }) => {
  const moveBoardPiece = useGameStore((s) => s.moveBoardPiece);
  const moveBoardPieceEnd = useGameStore((s) => s.moveBoardPieceEnd); // ← 新增
  const removeBoardPiece = useGameStore((s) => s.removeBoardPiece);
  const bringPieceToFront = useGameStore((s) => s.bringPieceToFront);

  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const [showMenu, setShowMenu] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      bringPieceToFront(piece.id);
      dragging.current = true;
      hasMoved.current = false;
      dragStart.current = { mx: e.clientX, my: e.clientY, px: piece.x, py: piece.y };
      setShowMenu(false);

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const dx = me.clientX - dragStart.current.mx;
        const dy = me.clientY - dragStart.current.my;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
        moveBoardPiece(piece.id, dragStart.current.px + dx, dragStart.current.py + dy);
      };
      const onUp = () => {
        dragging.current = false;
        if (hasMoved.current) moveBoardPieceEnd(piece.id); // ← 新增
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [piece, bringPieceToFront, moveBoardPiece, moveBoardPieceEnd] // ← 新增
  );

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu((v) => !v);
  }, []);

  return (
    <div
      style={{ position: 'absolute', left: piece.x, top: piece.y, zIndex: piece.zIndex + 5000, userSelect: 'none' }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleRightClick}
    >
      <motion.div
        className="cursor-grab active:cursor-grabbing"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
      >
        {/* Token circle */}
        <div
          className="w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-xl border-[2.5px] transition-all"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${piece.color}60, ${piece.color}25)`,
            borderColor: piece.color,
            boxShadow: `0 0 14px ${piece.color}50, 0 4px 12px rgba(0,0,0,0.4)`,
          }}
        >
          <span className="text-lg leading-none">{piece.emoji}</span>
          <span
            className="text-[8px] font-black leading-none mt-0.5"
            style={{ color: piece.color }}
          >
            {piece.label}
          </span>
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            className="absolute top-0 left-14 bg-[#1a1030]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[120px] z-50"
            onMouseLeave={() => setShowMenu(false)}
          >
            <div
              className="px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ color: piece.color }}
            >
              {piece.emoji} {piece.label}
            </div>
            <div className="border-t border-white/8 mt-0.5">
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); removeBoardPiece(piece.id); setShowMenu(false); }}
              >
                🗑️ 刪除棋子
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};