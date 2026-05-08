import React, { useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FreeCard } from '../FreeCard/FreeCard';
import { FreeDice } from '../FreeDice/FreeDice';
import { BoardGrid } from '../BoardGrid/BoardGrid';

interface FreeCanvasProps {
  theme: 'day' | 'night';
}

export const FreeCanvas: React.FC<FreeCanvasProps> = ({ theme }) => {
  const freeCards = useGameStore((s) => s.freeCards);
  const freeDice = useGameStore((s) => s.freeDice);
  const placeCardFromDeck = useGameStore((s) => s.placeCardFromDeck);
  const decks = useGameStore((s) => s.decks);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target !== e.currentTarget) return;
      const firstDeckId = Object.keys(decks)[0];
      if (!firstDeckId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      placeCardFromDeck(firstDeckId, e.clientX - rect.left - 55, e.clientY - rect.top - 77);
    },
    [decks, placeCardFromDeck]
  );

  const dayBg: React.CSSProperties = {
    backgroundColor: '#e8e0d0',
    backgroundImage: [
      'radial-gradient(ellipse at 15% 30%, rgba(255,220,150,0.4) 0%, transparent 55%)',
      'radial-gradient(ellipse at 85% 70%, rgba(200,230,255,0.3) 0%, transparent 55%)',
      'linear-gradient(rgba(100,80,60,0.06) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(100,80,60,0.06) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
  };

  const nightBg: React.CSSProperties = {
    backgroundColor: '#0d0d1a',
    backgroundImage: [
      'radial-gradient(ellipse at 20% 50%, rgba(109,40,217,0.07) 0%, transparent 60%)',
      'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.07) 0%, transparent 50%)',
      'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden transition-all duration-700"
      style={theme === 'day' ? dayBg : nightBg}
      onDoubleClick={handleDoubleClick}
    >
      {/* Felt texture overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: theme === 'day'
          ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'0.7\' fill=\'rgba(80,60,40,0.04)\'/%3E%3C/svg%3E")'
          : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'0.7\' fill=\'rgba(255,255,255,0.02)\'/%3E%3C/svg%3E")',
        backgroundSize: '4px 4px',
      }} />

      {/* ── 5x5 Board — centered in canvas ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <BoardGrid theme={theme} />
        </div>
      </div>

      {/* ── Free Dice ── */}
      {freeDice.map((d) => (
        <FreeDice key={d.id} dice={d} />
      ))}

      {/* ── Free Cards ── */}
      {freeCards.map((c) => (
        <FreeCard key={c.instanceId} card={c} theme={theme} />
      ))}

      {/* Empty state hint */}
      {freeCards.length === 0 && freeDice.length <= 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            className="px-6 py-3 rounded-2xl shadow-lg"
            style={{
              background: theme === 'day' ? 'rgba(255,255,255,0.75)' : 'rgba(30,20,60,0.85)',
              border: `1px solid ${theme === 'day' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="font-black text-sm mb-1.5" style={{ color: theme === 'day' ? '#1c1208' : '#e2d9f3' }}>
              🎴 雙擊桌面抽牌 · 從左側牌組點擊抽卡
            </p>
            <div
              className="flex items-center justify-center gap-4 text-xs font-semibold"
              style={{ color: theme === 'day' ? '#4a3a28' : '#a89cc8' }}
            >
              <span>👆 點擊卡牌翻面</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>🖱️ 右鍵編輯卡牌</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>🎲 點擊骰子搖骰</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
