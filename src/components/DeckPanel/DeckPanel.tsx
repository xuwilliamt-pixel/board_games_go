import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

const DEFAULT_BACK = 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop';

export const DeckPanel: React.FC<{ theme?: 'day' | 'night' }> = ({ theme = 'night' }) => {
  const decks = useGameStore((s) => s.decks);
  const placeCardFromDeck = useGameStore((s) => s.placeCardFromDeck);
  const [collapsed, setCollapsed] = useState(false);
  const [openDeckId, setOpenDeckId] = useState<string | null>(null);

  const handleDrawToCenter = (deckId: string) => {
    // Place near center of screen
    const x = window.innerWidth / 2 - 55 + (Math.random() - 0.5) * 80;
    const y = window.innerHeight / 2 - 77 + (Math.random() - 0.5) * 80;
    placeCardFromDeck(deckId, x, y);
  };

  const isDark = theme === 'night';

  return (
    <motion.div
      className="fixed left-0 top-14 bottom-0 z-40 flex"
      animate={{ x: collapsed ? -220 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Panel */}
      <div
        className="w-[220px] h-full flex flex-col overflow-hidden border-r backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(10,10,26,0.92)' : 'rgba(230,220,208,0.92)',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)' }}
        >
          <span className="text-sm font-black" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>🃏 牌組</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
          {Object.values(decks).map((deck) => {
            const isOpen = openDeckId === deck.id;
            return (
              <div key={deck.id} className="rounded-xl border border-white/5 bg-white/2 overflow-hidden">
                {/* Deck header */}
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setOpenDeckId(isOpen ? null : deck.id)}
                >
                  <div
                    className="w-10 h-14 rounded-lg bg-cover bg-center bg-no-repeat border border-white/10 shrink-0"
                    style={{ backgroundImage: `url(${deck.backImage || DEFAULT_BACK})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white/80 truncate">{deck.name}</div>
                    <div className="text-[10px] text-white/30">{deck.cards.length} 張</div>
                  </div>
                  <span className="text-white/30 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Draw button + card list */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2">
                        <button
                          className="w-full py-1.5 bg-violet-600/80 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors mb-2"
                          onClick={() => handleDrawToCenter(deck.id)}
                        >
                          🎴 隨機抽一張到桌面
                        </button>

                        {/* Unique card list */}
                        <div className="flex flex-col gap-1">
                          {Array.from(new Map(deck.cards.map((c) => [c.id, c])).values()).map((c) => {
                            const count = deck.cards.filter((dc) => dc.id === c.id).length;
                            return (
                              <div
                                key={c.id}
                                className="flex items-center gap-2 text-[10px] text-white/60 bg-white/3 hover:bg-white/8 rounded-lg px-2 py-1 cursor-pointer transition-colors"
                                onClick={() => {
                                  const x = window.innerWidth / 2 - 55 + (Math.random() - 0.5) * 120;
                                  const y = window.innerHeight / 2 - 77 + (Math.random() - 0.5) * 120;
                                  placeCardFromDeck(deck.id, x, y);
                                }}
                              >
                                <span className="truncate flex-1">{c.name}</span>
                                <span className="text-white/20 shrink-0">×{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle tab */}
      <button
        className="w-6 h-16 self-center bg-[#1a1a2e]/90 hover:bg-violet-600/80 border border-white/10 border-l-0 rounded-r-lg text-white/50 hover:text-white text-xs transition-colors flex items-center justify-center"
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </motion.div>
  );
};
