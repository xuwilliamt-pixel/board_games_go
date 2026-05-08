import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FreeCard as FreeCardType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

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

export const FreeCard: React.FC<{ card: FreeCardType; theme?: 'day' | 'night' }> = ({ card, theme = 'night' }) => {
  const moveCard = useGameStore((s) => s.moveCard);
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
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [card, bringToFront, moveCard]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasMoved.current) return; // Don't flip if dragged
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

  const backBg = card.backImage
    ? `url(${card.backImage})`
    : 'url(https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop)';

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
          className="relative w-[110px] h-[154px] rounded-xl cursor-grab active:cursor-grabbing group"
          whileHover={{ scale: 1.04 }}
          style={{ perspective: '800px' }}
        >
          <motion.div
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: card.isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 rounded-xl border-2 transition-colors overflow-hidden shadow-xl flex flex-col ${
                theme === 'day'
                  ? 'border-stone-300/60 group-hover:border-amber-500/60 bg-[#faf7f0]'
                  : 'border-white/20 group-hover:border-violet-400/60 bg-[#1a1a2e]'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 p-2 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[11px] font-black leading-tight truncate ${theme === 'day' ? 'text-stone-800' : 'text-white'}`}>{card.name}</span>
                  <span className={`text-[8px] shrink-0 ml-1 ${theme === 'day' ? 'text-stone-400' : 'text-white/30'}`}>{card.type}</span>
                </div>
                <div className={`flex-1 text-[9px] leading-snug overflow-hidden line-clamp-5 ${theme === 'day' ? 'text-stone-600' : 'text-white/60'}`}>
                  {card.description}
                </div>
                {card.type === 'creature' ? (
                  <div className={`flex justify-between mt-auto pt-1 border-t ${theme === 'day' ? 'border-stone-200' : 'border-white/10'}`}>
                    <div className="text-center">
                      <div className="text-[7px] text-red-500/70 uppercase">ATK</div>
                      <div className="text-sm font-black text-red-500">{card.attack}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[7px] text-green-600/70 uppercase">HP</div>
                      <div className="text-sm font-black text-green-600">{card.health}</div>
                    </div>
                  </div>
                ) : (
                  <div className={`mt-auto pt-1 text-center border-t ${theme === 'day' ? 'border-stone-200' : 'border-white/10'}`}>
                    <div className="text-[7px] text-violet-500/70 uppercase">Value</div>
                    <div className="text-sm font-black text-violet-600">{card.value}</div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-violet-500/10 to-transparent rounded-xl pointer-events-none" />
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-xl border-2 border-white/20 shadow-xl bg-cover bg-center bg-no-repeat"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundImage: backBg }}
            >
              <div className="absolute inset-0 bg-black/30 rounded-xl" />
              <div className="absolute inset-2 border border-white/10 rounded-lg" />
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
                  { label: '背面圖片網址', key: 'backImage', placeholder: 'https://...' },
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
