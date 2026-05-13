import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { calcBoardLayout } from '../FreeCanvas/FreeCanvas';

const DEFAULT_BACK = 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop';

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  creature: { label: '生物', color: '#35E0A1' },
  spell:    { label: '法術', color: '#24D8FF' },
  item:     { label: '道具', color: '#FF9D42' },
  hero:     { label: '英雄', color: '#8B5CFF' },
};

export const DeckPanel: React.FC<{ theme?: 'day' | 'night' }> = ({ theme = 'night' }) => {
  const decks            = useGameStore((s) => s.decks);
  const placeCardFromDeck = useGameStore((s) => s.placeCardFromDeck);
  const [collapsed, setCollapsed] = useState(false);
  const [openDeckId, setOpenDeckId] = useState<string | null>(null);

  const isDark = theme === 'night';

  const spawnInHandZone = (deckId: string) => {
    const { handL, handW, boardTop } = calcBoardLayout();
    const n = useGameStore.getState().freeCards.length;
    const col = n % 2;
    const row = Math.floor(n / 2) % 8;
    const colOffset = Math.min(74, Math.max(0, handW - 74 - 4));
    const x = handL + 4 + col * colOffset;
    const y = boardTop + 30 + row * 52;
    placeCardFromDeck(deckId, x, y);
  };

  const panelBg    = isDark ? 'rgba(7, 11, 20, 0.94)'  : 'rgba(255, 255, 255, 0.95)';
  const borderCol  = isDark ? 'var(--border-subtle)'    : '#E8EDF8';
  const deckCardBg = isDark ? 'var(--bg-elevated)'      : '#F8FAFF';
  const deckCardBorder = isDark ? 'var(--border-default)' : '#D9E2F2';
  const toggleBg   = isDark ? 'rgba(14, 21, 37, 0.95)'  : 'rgba(240, 244, 252, 0.95)';

  return (
    <motion.div
      className="fixed left-0 top-14 bottom-0 z-40 flex"
      animate={{ x: collapsed ? -236 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* ── Panel ── */}
      <div
        className="flex flex-col overflow-hidden border-r"
        style={{
          width: 240,
          height: '100%',
          background: panelBg,
          borderColor: borderCol,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-5"
          style={{
            height: 52,
            borderBottom: `1px solid ${borderCol}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>🃏</span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: isDark ? 'var(--text-primary)' : '#1A2340',
                letterSpacing: '-0.01em',
              }}
            >
              牌組
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: isDark ? 'var(--bg-elevated)' : '#EEF3FC',
              border: `1px solid ${deckCardBorder}`,
              padding: '2px 8px',
              borderRadius: 99,
            }}
          >
            {Object.keys(decks).length} 組
          </span>
        </div>

        {/* Deck List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
          {Object.values(decks).map((deck) => {
            const isOpen = openDeckId === deck.id;
            return (
              <div
                key={deck.id}
                className="rounded-xl overflow-hidden"
                style={{
                  background: deckCardBg,
                  border: `1.5px solid ${isOpen ? (isDark ? 'rgba(139,92,255,0.5)' : '#B8C9E8') : deckCardBorder}`,
                  boxShadow: isOpen
                    ? isDark ? '0 0 16px rgba(139,92,255,0.15)' : '0 4px 16px rgba(26,35,64,0.08)'
                    : 'none',
                  transition: 'all 180ms ease-out',
                }}
              >
                {/* Deck Header */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  style={{ padding: '10px 12px' }}
                  onClick={() => setOpenDeckId(isOpen ? null : deck.id)}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 44,
                      height: 60,
                      borderRadius: 8,
                      backgroundImage: `url(${deck.backImage || DEFAULT_BACK})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#D9E2F2'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      flexShrink: 0,
                    }}
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: isDark ? 'var(--text-primary)' : '#1A2340',
                        lineHeight: 1.3,
                      }}
                    >
                      {deck.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        marginTop: 3,
                      }}
                    >
                      {(deck.cards ?? []).length} 張牌
                    </div>
                  </div>
                  {/* Chevron */}
                  <span
                    style={{
                      fontSize: 12,
                      color: isDark ? 'var(--accent-purple)' : '#6B3FD4',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms ease-out',
                      flexShrink: 0,
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* Expanded: Draw + Card List */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          padding: '0 12px 12px',
                          borderTop: `1px solid ${isDark ? 'var(--border-subtle)' : '#EEF2FB'}`,
                          marginTop: 2,
                          paddingTop: 10,
                        }}
                      >
                        {/* Draw Button */}
                        <button
                          className="btn btn-primary w-full"
                          style={{ marginBottom: 10, fontSize: 13 }}
                          onClick={() => spawnInHandZone(deck.id)}
                        >
                          🎴 隨機抽一張
                        </button>

                        {/* Card list */}
                        <div className="flex flex-col gap-1.5">
                          {Array.from(new Map((deck.cards ?? []).map((c) => [c.id, c])).values()).map((c) => {
                            const count   = (deck.cards ?? []).filter((dc) => dc.id === c.id).length;
                            const badge   = TYPE_BADGE[c.type] || { label: c.type, color: '#8B5CFF' };
                            return (
                              <div
                                key={c.id}
                                className="flex items-center gap-2 rounded-lg cursor-pointer"
                                style={{
                                  padding: '7px 10px',
                                  background: isDark ? 'rgba(255,255,255,0.04)' : '#F3F6FB',
                                  border: `1px solid ${isDark ? 'var(--border-subtle)' : '#EEF2FB'}`,
                                  transition: 'all 150ms ease-out',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: isDark ? 'var(--text-secondary)' : '#55607A',
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(139,92,255,0.12)' : '#EEF3FC';
                                  (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(139,92,255,0.4)' : '#B8C9E8';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : '#F3F6FB';
                                  (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'var(--border-subtle)' : '#EEF2FB';
                                }}
                                onClick={() => spawnInHandZone(deck.id)}
                              >
                                {/* Type dot */}
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: badge.color,
                                    flexShrink: 0,
                                    boxShadow: `0 0 6px ${badge.color}80`,
                                  }}
                                />
                                <span className="truncate flex-1">{c.name}</span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: isDark ? 'var(--text-muted)' : '#9AA3BA',
                                    flexShrink: 0,
                                  }}
                                >
                                  ×{count}
                                </span>
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

          {/* Empty state */}
          {Object.keys(decks).length === 0 && (
            <div
              className="flex flex-col items-center justify-center flex-1 text-center"
              style={{ padding: '32px 16px', gap: 8 }}
            >
              <span style={{ fontSize: 32 }}>🃏</span>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                尚無牌組
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                前往編輯器建立牌組
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Toggle Tab ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: 20,
          height: 64,
          alignSelf: 'center',
          background: toggleBg,
          border: `1px solid ${borderCol}`,
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          color: isDark ? 'var(--text-muted)' : '#9AA3BA',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--accent-purple)';
          (e.currentTarget as HTMLElement).style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = toggleBg;
          (e.currentTarget as HTMLElement).style.color = isDark ? 'var(--text-muted)' : '#9AA3BA';
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </motion.div>
  );
};
