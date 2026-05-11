import { useState, useCallback } from 'react';
import { FreeCanvas } from './components/FreeCanvas/FreeCanvas';
import { DeckPanel } from './components/DeckPanel/DeckPanel';
import { DeckBuilder } from './components/DeckBuilder/DeckBuilder';
import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { RoundCounter } from './components/RoundCounter/RoundCounter';
import { useGameStore } from './store/gameStore';

// Layout constants — single source of truth
export const LEFT_PANEL_W = 240;   // DeckPanel width
export const RIGHT_PANEL_W = 320;   // CharacterPanel width
export const NAVBAR_H = 56;    // px

// ── Confirm Clear Modal ────────────────────────────────────────
interface ConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({ onConfirm, onCancel, isDark }) => (
  // Backdrop
  <div
    onClick={onCancel}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 150ms ease-out',
    }}
  >
    {/* Dialog */}
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: isDark ? '#0E1525' : '#FFFFFF',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#D9E2F2'}`,
        borderRadius: 20,
        padding: '32px 28px 24px',
        width: 380,
        boxShadow: isDark
          ? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 24px 64px rgba(26,35,64,0.18)',
        animation: 'slideUp 180ms ease-out',
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🗑️</div>

      {/* Title */}
      <h2 style={{
        fontSize: 18,
        fontWeight: 800,
        textAlign: 'center',
        color: isDark ? '#F4F7FF' : '#1A2340',
        marginBottom: 10,
      }}>
        清空桌面
      </h2>

      {/* Body */}
      <p style={{
        fontSize: 14,
        textAlign: 'center',
        color: isDark ? '#AAB6D3' : '#55607A',
        lineHeight: 1.65,
        marginBottom: 28,
      }}>
        確定要清空目前桌面配置嗎？<br />
        <span style={{ color: isDark ? '#FF5E7A' : '#DC3060', fontWeight: 600 }}>
          此操作無法復原。
        </span>
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 10,
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
            color: isDark ? '#AAB6D3' : '#55607A',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.25)' : '#B8C9E8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'; }}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 10,
            border: 'none',
            background: isDark ? '#FF5E7A' : '#DC3060',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255,94,122,0.35)',
            transition: 'all 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(255,94,122,0.50)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(255,94,122,0.35)';
          }}
        >
          確認清空
        </button>
      </div>
    </div>
  </div>
);

import React from 'react';

function App() {
  const [currentView, setCurrentView] = useState<'play' | 'edit'>('play');
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [showClearModal, setShowClearModal] = useState(false);
  const clearTable = useGameStore((s) => s.clearTable);
  const diceHistory = useGameStore((s) => s.diceHistory);
  const isDark = theme === 'night';

  const handleClearConfirm = useCallback(() => {
    clearTable();
    setShowClearModal(false);
  }, [clearTable]);

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      data-theme={isDark ? 'night' : 'day'}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background 0.5s, color 0.5s' }}
    >
      {/* ── Confirm Modal ── */}
      {showClearModal && (
        <ConfirmModal
          isDark={isDark}
          onConfirm={handleClearConfirm}
          onCancel={() => setShowClearModal(false)}
        />
      )}

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav
        className="shrink-0 sticky top-0 z-50 flex items-center justify-between px-5"
        style={{
          height: NAVBAR_H,
          background: isDark ? 'rgba(7,11,20,0.92)' : 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Left: Brand — always legible, no gradient clip */}
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>🎲</span>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              /* Use solid colour — no background-clip so no transparency bug */
              color: isDark ? '#A78BFA' : '#6B3FD4',
              whiteSpace: 'nowrap',
            }}
          >
            桌遊工作台
          </h1>
        </div>

        {/* Center: Dice History (現在改為固定在中間上方) */}
        {currentView === 'play' && diceHistory.length > 0 && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1"
            style={{
              position: 'fixed',      // 改為固定定位
              top: 4,                 // 距離頂端 4px (在計數器上方)
              left: '50%',            // 水平置中
              transform: 'translateX(-50%)', // 配合 left: 50%
              zIndex: 70,             // 確保在最前面
              background: 'rgba(14,21,37,0.9)', // 稍微加深背景以免重疊
              border: '1px solid var(--border-subtle)',
              height: '24px',         // 固定高度讓它看起來更精簡
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.6 }}>🎲</span>
            {diceHistory.slice(0, 5).map((r) => (
              <span
                key={r.id}
                style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent-purple)', lineHeight: 1 }}
              >
                {r.value}
              </span>
            ))}
          </div>
        )}

        {/* ── Round Counter (fixed, always centred) ── */}
        {currentView === 'play' && <RoundCounter theme={theme} />}

        {/* Right: Controls */}
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {currentView === 'play' && (
            <button
              onClick={() => setShowClearModal(true)}
              title="清空桌面並重置棋子位置"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
                color: isDark ? '#AAB6D3' : '#55607A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,94,122,0.15)' : '#FFF0F3';
                (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,94,122,0.5)' : '#DC3060';
                (e.currentTarget as HTMLElement).style.color = isDark ? '#FF5E7A' : '#DC3060';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB';
                (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2';
                (e.currentTarget as HTMLElement).style.color = isDark ? '#AAB6D3' : '#55607A';
              }}
            >
              🗑️ 清空桌面
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'day' : 'night')}
            title={isDark ? '切換白天模式' : '切換夜晚模式'}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.07)' : '#F3F6FB',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease-out',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* View Switcher */}
          <div
            className="flex rounded-xl p-1"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#D9E2F2'}`,
            }}
          >
            {(['play', 'edit'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 150ms ease-out',
                  background: currentView === view ? 'var(--accent-purple)' : 'transparent',
                  color: currentView === view ? '#fff' : 'var(--text-muted)',
                  boxShadow: currentView === view ? '0 2px 8px var(--accent-purple-glow)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {view === 'play' ? '⚔️ 遊玩' : '✏️ 編輯器'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {currentView === 'edit' ? (
          <DeckBuilder theme={theme} />
        ) : (
          <>
            {/* Left: Deck Panel — 240px, fixed */}
            <DeckPanel theme={theme} />

            {/* Right: Character Panel — 320px, fixed */}
            <CharacterPanel theme={theme} />

            {/* Center: Free Canvas — fills the gap between panels */}
            <div
              className="absolute inset-0"
              style={{ paddingLeft: LEFT_PANEL_W, paddingRight: RIGHT_PANEL_W }}
            >
              <FreeCanvas theme={theme} />
            </div>
          </>
        )}
      </main>

      {/* ── Global modal animation keyframes ── */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); }
                             to   { opacity: 1; transform: translateY(0)    scale(1);    } }
      `}</style>
    </div>
  );
}

export default App;
