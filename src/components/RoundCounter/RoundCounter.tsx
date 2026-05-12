import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

interface RoundCounterProps {
  theme: 'day' | 'night';
}

export const RoundCounter: React.FC<RoundCounterProps> = ({ theme }) => {
  // ── 改用 gameStore，這樣才會同步給所有人 ──────────────────────
  const round = useGameStore((s) => s.round);
  const setRound = useGameStore((s) => s.setRound);

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('1');
  const [bump, setBump] = useState<'up' | 'down' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'night';

  const triggerBump = (dir: 'up' | 'down') => {
    setBump(dir);
    setTimeout(() => setBump(null), 320);
  };

  const increment = useCallback(() => {
    triggerBump('up');
    setRound(round + 1);
  }, [round, setRound]);

  const decrement = useCallback(() => {
    if (round <= 1) return;
    triggerBump('down');
    setRound(round - 1);
  }, [round, setRound]);

  const reset = useCallback(() => {
    triggerBump('down');
    setRound(1);
  }, [setRound]);

  const startEdit = () => {
    setInputVal(String(round));
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 1) setRound(n);
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
    if (e.key === 'ArrowUp') { e.preventDefault(); setInputVal((v) => String(Math.max(1, parseInt(v) + 1 || 1))); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setInputVal((v) => String(Math.max(1, parseInt(v) - 1 || 1))); }
  };

  // ── Colours ──────────────────────────────────────────────────
  const panelBg = isDark ? 'rgba(14,21,37,0.82)' : 'rgba(255,255,255,0.88)';
  const panelBorder = isDark ? 'rgba(139,92,255,0.40)' : 'rgba(107,63,212,0.25)';
  const panelGlow = isDark ? '0 0 28px rgba(139,92,255,0.22), 0 4px 20px rgba(0,0,0,0.45)' : '0 4px 24px rgba(26,35,64,0.12)';
  const numColor = isDark ? '#A78BFA' : '#6B3FD4';
  const labelColor = isDark ? 'rgba(255,255,255,0.35)' : '#9AA3BA';
  const btnBg = isDark ? 'rgba(255,255,255,0.07)' : '#F3F6FB';
  const btnBorder = isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2';
  const btnColor = isDark ? '#AAB6D3' : '#55607A';
  const resetColor = isDark ? 'rgba(255,255,255,0.25)' : '#B0BAD0';

  const numStyle: React.CSSProperties = {
    fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
    color: numColor, minWidth: 56, textAlign: 'center',
    cursor: 'pointer', userSelect: 'none',
    transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), color 200ms',
    transform: bump === 'up'
      ? 'translateY(-4px) scale(1.12)'
      : bump === 'down' ? 'translateY(2px) scale(0.92)' : 'translateY(-8px) scale(1)',
    textShadow: isDark
      ? `0 0 18px ${numColor}90, 0 0 40px ${numColor}40`
      : `0 0 12px ${numColor}50`,
  };

  const ctrlBtn = (label: string, onClick: () => void, hoverBg: string, hoverColor: string, title?: string) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        minWidth: 36, minHeight: 36, borderRadius: 9,
        border: `1.5px solid ${btnBorder}`, background: btnBg, color: btnColor,
        fontSize: 16, fontWeight: 800, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 140ms ease-out', flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = hoverBg; el.style.color = hoverColor;
        el.style.borderColor = hoverColor; el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 4px 12px ${hoverColor}50`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = btnBg; el.style.color = btnColor;
        el.style.borderColor = btnBorder; el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed', top: 40, left: '50%',
        transform: 'translateX(-50%)', zIndex: 60,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 14px 5px 10px',
        background: panelBg, border: `1.5px solid ${panelBorder}`,
        borderRadius: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: panelGlow, animation: 'floatCounter 4s ease-in-out infinite',
      }}
    >
      {ctrlBtn('−', decrement, isDark ? 'rgba(255,94,122,0.22)' : '#FFF0F3', isDark ? '#FF5E7A' : '#DC3060', '−1 回合')}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '0 4px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: labelColor }}>
          ROUND
        </span>
        {editing ? (
          <input
            ref={inputRef} value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commitEdit} onKeyDown={handleKey}
            type="number" min={1}
            style={{
              width: 64, fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em',
              textAlign: 'center', background: 'transparent', border: 'none',
              outline: 'none', color: numColor, lineHeight: 1, fontFamily: 'inherit',
            }}
          />
        ) : (
          <span style={numStyle} onClick={startEdit} title="點擊直接輸入回合數">
            {round}
          </span>
        )}
      </div>

      {ctrlBtn('+', increment, isDark ? 'rgba(53,224,161,0.22)' : '#EDFAF4', isDark ? '#35E0A1' : '#18A772', '+1 回合')}

      <div style={{ width: 1, height: 28, background: isDark ? 'rgba(255,255,255,0.10)' : '#E8EDF8', marginLeft: 2 }} />

      <button
        onClick={reset} title="重置回合數至 1"
        style={{
          minHeight: 28, padding: '0 10px', borderRadius: 8,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E8EDF8'}`,
          background: 'transparent', color: resetColor,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.04em', transition: 'all 140ms ease-out', whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = isDark ? '#AAB6D3' : '#6B3FD4';
          el.style.borderColor = isDark ? 'rgba(255,255,255,0.22)' : '#B8C9E8';
          el.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = resetColor;
          el.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E8EDF8';
          el.style.transform = 'translateY(0)';
        }}
      >
        重置
      </button>

      <style>{`
        @keyframes floatCounter {
          0%,100% { transform: translateX(-50%) translateY(0px);  }
          50%      { transform: translateX(-50%) translateY(-2px); }
        }
      `}</style>
    </div>
  );
};