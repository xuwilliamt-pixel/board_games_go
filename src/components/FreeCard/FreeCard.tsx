import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FreeCard as FreeCardType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

const DEFAULT_BACK = 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop';

interface ContextMenuState {
  x: number;
  y: number;
  card: FreeCardType;
}

interface EditState {
  name: string;
  description: string;
  backImage: string;
  attack: string;
  health: string;
  value: string;
  type: string;
}

// ← 新增 deckBackImage prop
export const FreeCard: React.FC<{ card: FreeCardType; theme?: 'day' | 'night'; deckBackImage?: string }> = ({ card, theme = 'night', deckBackImage }) => {
  const moveCard = useGameStore((s) => s.moveCard);
  const moveCardEnd = useGameStore((s) => s.moveCardEnd);
  const flipCard = useGameStore((s) => s.flipCard);
  const rotateCard = useGameStore((s) => s.rotateCard);
  const removeCard = useGameStore((s) => s.removeCard);
  const bringToFront = useGameStore((s) => s.bringToFront);
  const updateFreeCard = useGameStore((s) => s.updateFreeCard);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    name: card.name,
    description: card.description,
    backImage: card.backImage || '',
    attack: String(card.attack ?? ''),
    health: String(card.health ?? ''),
    value: String(card.value ?? ''),
    type: card.type,
  });

  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });
  const hasMoved = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      bringToFront(card.instanceId);
      dragging.current = true;
      hasMoved.current = false;
      dragStart.current = { mx: e.clientX, my: e.clientY, cx: card.x, cy: card.y };
      setContextMenu(null);

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const dx = me.clientX - dragStart.current.mx;
        const dy = me.clientY - dragStart.current.my;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
        moveCard(card.instanceId, dragStart.current.cx + dx, dragStart.current.cy + dy);
      };
      const onUp = () => {
        dragging.current = false;
        if (hasMoved.current) moveCardEnd(card.instanceId);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [card, bringToFront, moveCard, moveCardEnd]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasMoved.current) return;
      flipCard(card.instanceId);
    },
    [card.instanceId, flipCard]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, card });
    },
    [card]
  );

  const handleSaveEdit = () => {
    updateFreeCard(card.instanceId, {
      name: editState.name,
      description: editState.description,
      backImage: editState.backImage || undefined,
      attack: editState.attack !== '' ? Number(editState.attack) : undefined,
      health: editState.health !== '' ? Number(editState.health) : undefined,
      value: editState.value !== '' ? Number(editState.value) : undefined,
      type: editState.type as any,
    });
    setIsEditing(false);
  };

  // ← 優先用牌組封面，其次用卡片自己存的，最後用預設
  const backSrc = deckBackImage ?? card.backImage ?? DEFAULT_BACK;
  const backBg = `url(${backSrc})`;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          zIndex: card.zIndex,
          transform: `rotate(${card.rotation}deg)`,
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <motion.div
          className="relative w-[74px] h-[90px] rounded-lg cursor-grab active:cursor-grabbing group"
          whileHover={{ scale: 1.08 }}
          style={{ perspective: '800px' }}
        >
          <motion.div
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: card.isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Front（資訊面） */}
            <div
              className={`absolute inset-0 rounded-lg border-2 overflow-hidden shadow-xl flex flex-col ${theme === 'day'
                ? 'border-amber-400 bg-amber-50'
                : 'border-violet-400/80 bg-[#1e1535]'
                }`}
              style={{
                backfaceVisibility: 'hidden',
                backgroundImage: card.backImage ? `url(${card.backImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* 有插圖時加遮罩 */}
              {card.backImage && (
                <div className="absolute inset-0 bg-black/55 rounded-lg" />
              )}
              <div className="absolute inset-0 p-1 flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
                <div className="flex justify-between items-start">
                  <span className="text-[12px] font-black leading-tight truncate text-white">{card.name}</span>
                  <span className={`text-[12px] shrink-0 ml-0.5 px-0.5 rounded font-bold ${theme === 'day' ? 'bg-amber-200 text-amber-800' : 'bg-violet-900/60 text-violet-300'}`}>{card.type[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 text-[10px] leading-tight overflow-hidden mt-0.5 text-gray-200">
                  {card.description}
                </div>
                {card.type === 'creature' ? (
                  <div className={`flex justify-between pt-0.5 border-t ${theme === 'day' ? 'border-white/30' : 'border-violet-800/60'}`}>
                    <div className="text-center">
                      <div className="text-[9px] text-red-400 uppercase font-bold">ATK</div>
                      <div className="text-[9px] font-black text-red-400">{card.attack}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-green-400 uppercase font-bold">HP</div>
                      <div className="text-[9px] font-black text-green-400">{card.health}</div>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center pt-0.5 border-t ${theme === 'day' ? 'border-white/30' : 'border-violet-800/60'}`}>
                    <div className="text-[9px] text-violet-300 uppercase font-bold">Val</div>
                    <div className="text-[9px] font-black text-violet-300">{card.value}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-lg border-2 border-white/20 shadow-xl bg-cover bg-center bg-no-repeat"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundImage: backBg }}
            >
              <div className="absolute inset-0 bg-black/30 rounded-lg" />
              <div className="absolute inset-1 border border-white/10 rounded-md" />
            </div>
          </motion.div>
        </motion.div>

        {/* Hint */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          點擊翻面 · 右鍵選單
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseLeave={() => setContextMenu(null)}
          >
            {[
              { label: '🔄 翻面', action: () => { flipCard(card.instanceId); setContextMenu(null); } },
              { label: '↩️ 旋轉 +90°', action: () => { rotateCard(card.instanceId, 90); setContextMenu(null); } },
              { label: '↪️ 旋轉 -90°', action: () => { rotateCard(card.instanceId, -90); setContextMenu(null); } },
              { label: '✏️ 編輯卡牌', action: () => { setEditState({ name: card.name, description: card.description, backImage: card.backImage || '', attack: String(card.attack ?? ''), health: String(card.health ?? ''), value: String(card.value ?? ''), type: card.type }); setIsEditing(true); setContextMenu(null); } },
              { label: '🗑️ 移除', action: () => { removeCard(card.instanceId); setContextMenu(null); }, danger: true },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-white/80 hover:bg-white/10'}`}
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#12121f] border border-white/10 rounded-2xl p-6 w-[340px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-white mb-4">✏️ 編輯卡牌</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: '名稱', key: 'name', placeholder: '卡牌名稱' },
                  { label: '資訊面圖片網址', key: 'backImage', placeholder: 'https://...' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-white/50 mb-1 block">{label}</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                      value={(editState as any)[key]}
                      placeholder={placeholder}
                      onChange={(e) => setEditState((s) => ({ ...s, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-white/50 mb-1 block">描述</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500 resize-none"
                    rows={3}
                    value={editState.description}
                    onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  {editState.type === 'creature' ? (
                    <>
                      <div className="flex-1">
                        <label className="text-xs text-white/50 mb-1 block">攻擊</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" type="number" value={editState.attack} onChange={(e) => setEditState((s) => ({ ...s, attack: e.target.value }))} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-white/50 mb-1 block">生命</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" type="number" value={editState.health} onChange={(e) => setEditState((s) => ({ ...s, health: e.target.value }))} />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1">
                      <label className="text-xs text-white/50 mb-1 block">數值</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" type="number" value={editState.value} onChange={(e) => setEditState((s) => ({ ...s, value: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg transition-colors" onClick={handleSaveEdit}>儲存</button>
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 font-bold py-2 rounded-lg transition-colors" onClick={() => setIsEditing(false)}>取消</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};