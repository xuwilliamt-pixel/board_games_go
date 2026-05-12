import { useState, useCallback, useEffect } from 'react';
import React from 'react';
import { FreeCanvas } from './components/FreeCanvas/FreeCanvas';
import { DeckPanel } from './components/DeckPanel/DeckPanel';
import { DeckBuilder } from './components/DeckBuilder/DeckBuilder';
import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { RoundCounter } from './components/RoundCounter/RoundCounter';
import { LobbyPage } from './components/LobbyPage/LobbyPage';
import { useGameStore, ROOM_ID } from './store/gameStore';

// Layout constants — single source of truth
export const LEFT_PANEL_W = 240;
export const RIGHT_PANEL_W = 320;
export const NAVBAR_H = 56;

// ── Confirm Clear Modal ────────────────────────────────────────
interface ConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({ onConfirm, onCancel, isDark }) => (
  <div
    onClick={onCancel}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 150ms ease-out',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: isDark ? '#0E1525' : '#FFFFFF',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#D9E2F2'}`,
        borderRadius: 20, padding: '32px 28px 24px', width: 380,
        boxShadow: isDark
          ? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 24px 64px rgba(26,35,64,0.18)',
        animation: 'slideUp 180ms ease-out',
      }}
    >
      <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🗑️</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', color: isDark ? '#F4F7FF' : '#1A2340', marginBottom: 10 }}>
        清空桌面
      </h2>
      <p style={{ fontSize: 14, textAlign: 'center', color: isDark ? '#AAB6D3' : '#55607A', lineHeight: 1.65, marginBottom: 28 }}>
        確定要清空目前桌面配置嗎？<br />
        <span style={{ color: isDark ? '#FF5E7A' : '#DC3060', fontWeight: 600 }}>此操作無法復原。</span>
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, minHeight: 44, borderRadius: 10,
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
            color: isDark ? '#AAB6D3' : '#55607A', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, minHeight: 44, borderRadius: 10, border: 'none',
            background: isDark ? '#FF5E7A' : '#DC3060', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255,94,122,0.35)',
          }}
        >
          確認清空
        </button>
      </div>
    </div>
  </div>
);

// ── Share Room Modal ───────────────────────────────────────────
interface ShareModalProps {
  onClose: () => void;
  isDark: boolean;
  roomUrl: string;
}
const ShareModal: React.FC<ShareModalProps> = ({ onClose, isDark, roomUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#0E1525' : '#FFFFFF',
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#D9E2F2'}`,
          borderRadius: 20, padding: '32px 28px 24px', width: 420,
          boxShadow: isDark
            ? '0 24px 64px rgba(0,0,0,0.7)'
            : '0 24px 64px rgba(26,35,64,0.18)',
          animation: 'slideUp 180ms ease-out',
        }}
      >
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', color: isDark ? '#F4F7FF' : '#1A2340', marginBottom: 8 }}>
          邀請玩家
        </h2>
        <p style={{ fontSize: 13, textAlign: 'center', color: isDark ? '#AAB6D3' : '#55607A', marginBottom: 20 }}>
          將連結傳給對方，進入同一個房間就會即時同步
        </p>

        {/* Room ID badge */}
        <div style={{
          textAlign: 'center', marginBottom: 16,
          fontSize: 12, color: isDark ? '#6B7A9F' : '#8896B3',
        }}>
          房間 ID：<span style={{ fontWeight: 700, color: isDark ? '#A78BFA' : '#6B3FD4' }}>{ROOM_ID}</span>
        </div>

        {/* URL display */}
        <div style={{
          background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#D9E2F2'}`,
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: isDark ? '#AAB6D3' : '#55607A',
          wordBreak: 'break-all', marginBottom: 16, lineHeight: 1.6,
        }}>
          {roomUrl}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
              color: isDark ? '#AAB6D3' : '#55607A', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            關閉
          </button>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10, border: 'none',
              background: copied
                ? (isDark ? '#22c55e' : '#16a34a')
                : (isDark ? '#A78BFA' : '#6B3FD4'),
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background 200ms',
              boxShadow: '0 4px 16px rgba(107,63,212,0.35)',
            }}
          >
            {copied ? '✓ 已複製！' : '複製連結'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────────
function App() {
  const [currentView, setCurrentView] = useState<'play' | 'edit'>('play');
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // ── 首頁判斷：沒有 room 參數就顯示 Lobby ──────────────────────
  const [showLobby, setShowLobby] = useState(
    !new URLSearchParams(window.location.search).get('room')
  );

  const handleEnterRoom = (roomId: string) => {
    window.history.replaceState({}, '', `?room=${roomId}`);
    window.location.reload();
  };

  // ── 返回首頁 ────────────────────────────────────────────────
  const handleGoHome = () => {
    window.history.replaceState({}, '', window.location.pathname);
    window.location.reload();
  };

  const clearTable = useGameStore((s) => s.clearTable);
  const diceHistory = useGameStore((s) => s.diceHistory);
  const isConnected = useGameStore((s) => s.isConnected);
  const initSync = useGameStore((s) => s.initSync);

  const isDark = theme === 'night';

  // ── Firebase 同步初始化 ──────────────────────────────────────
  useEffect(() => {
    if (showLobby) return;
    const unsubscribe = initSync();
    return () => unsubscribe();
  }, [showLobby]);

  // ── 產生房間分享連結 ─────────────────────────────────────────
  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${ROOM_ID}`;

  const handleClearConfirm = useCallback(() => {
    clearTable();
    setShowClearModal(false);
  }, [clearTable]);

  // ── 顯示 Lobby ───────────────────────────────────────────────
  if (showLobby) {
    return <LobbyPage onEnter={handleEnterRoom} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      data-theme={isDark ? 'night' : 'day'}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background 0.5s, color 0.5s' }}
    >
      {/* ── Modals ── */}
      {showClearModal && (
        <ConfirmModal isDark={isDark} onConfirm={handleClearConfirm} onCancel={() => setShowClearModal(false)} />
      )}
      {showShareModal && (
        <ShareModal isDark={isDark} onClose={() => setShowShareModal(false)} roomUrl={roomUrl} />
      )}

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav
        className="shrink-0 sticky top-0 z-50 flex items-center justify-between px-5"
        style={{
          height: NAVBAR_H,
          background: isDark ? 'rgba(7,11,20,0.92)' : 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Left: Brand + Home button */}
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {/* 返回首頁按鈕 */}
          <button
            onClick={handleGoHome}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              minHeight: 36, padding: '0 14px', borderRadius: 8,
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#D9E2F2'}`,
              background: isDark ? 'rgba(255,255,255,0.07)' : '#F3F6FB',
              color: isDark ? '#C8D0E8' : '#55607A',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 150ms ease-out', whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.13)' : '#E8EDF8';
              (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.28)' : '#B0BCDA';
              (e.currentTarget as HTMLElement).style.color = isDark ? '#F4F7FF' : '#1A2340';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.07)' : '#F3F6FB';
              (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : '#D9E2F2';
              (e.currentTarget as HTMLElement).style.color = isDark ? '#C8D0E8' : '#55607A';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            🏠 返回首頁
          </button>

          <span style={{ fontSize: 20, lineHeight: 1 }}>🎲</span>
          <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: isDark ? '#A78BFA' : '#6B3FD4', whiteSpace: 'nowrap' }}>
            桌遊工作台
          </h1>
          {/* 連線狀態指示燈 */}
          <div
            title={isConnected ? `已連線 · 房間：${ROOM_ID}` : '連線中...'}
            style={{
              width: 8, height: 8, borderRadius: '50%', marginLeft: 4,
              background: isConnected ? '#22c55e' : '#f59e0b',
              boxShadow: isConnected ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
              transition: 'all 400ms',
            }}
          />
        </div>

        {/* Center: Dice History */}
        {currentView === 'play' && diceHistory.length > 0 && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1"
            style={{
              position: 'fixed', top: 4, left: '50%', transform: 'translateX(-50%)',
              zIndex: 70,
              background: 'rgba(14,21,37,0.9)',
              border: '1px solid var(--border-subtle)',
              height: '24px',
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.6 }}>🎲</span>
            {diceHistory.slice(0, 5).map((r) => (
              <span key={r.id} style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent-purple)', lineHeight: 1 }}>
                {r.value}
              </span>
            ))}
          </div>
        )}

        {/* Round Counter */}
        {currentView === 'play' && <RoundCounter theme={theme} />}

        {/* Right: Controls */}
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>

          {/* 邀請玩家按鈕 */}
          <button
            onClick={() => setShowShareModal(true)}
            title="邀請玩家加入同一房間"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              minHeight: 36, padding: '0 14px', borderRadius: 8,
              border: `1.5px solid ${isDark ? 'rgba(167,139,250,0.4)' : '#c4b5fd'}`,
              background: isDark ? 'rgba(167,139,250,0.1)' : '#f5f3ff',
              color: isDark ? '#A78BFA' : '#6B3FD4',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 150ms ease-out', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(167,139,250,0.2)' : '#ede9fe';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(167,139,250,0.1)' : '#f5f3ff';
            }}
          >
            🔗 邀請玩家
          </button>

          {currentView === 'play' && (
            <button
              onClick={() => setShowClearModal(true)}
              title="清空桌面並重置棋子位置"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                minHeight: 36, padding: '0 14px', borderRadius: 8,
                border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
                color: isDark ? '#AAB6D3' : '#55607A',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 150ms ease-out', whiteSpace: 'nowrap',
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
              width: 40, height: 40, borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.07)' : '#F3F6FB',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms ease-out', flexShrink: 0,
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
                  padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', border: 'none', transition: 'all 150ms ease-out',
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
            <DeckPanel theme={theme} />
            <CharacterPanel theme={theme} />
            <div className="absolute inset-0" style={{ paddingLeft: LEFT_PANEL_W, paddingRight: RIGHT_PANEL_W }}>
              <FreeCanvas theme={theme} />
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); }
                             to   { opacity: 1; transform: translateY(0)    scale(1);    } }
      `}</style>
    </div>
  );
}

export default App;