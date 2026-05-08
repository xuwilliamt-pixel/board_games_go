import { useState, useEffect } from 'react';
import { FreeCanvas } from './components/FreeCanvas/FreeCanvas';
import { DeckPanel } from './components/DeckPanel/DeckPanel';
import { DeckBuilder } from './components/DeckBuilder/DeckBuilder';
import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { useGameStore } from './store/gameStore';

function App() {
  const [currentView, setCurrentView] = useState<'play' | 'edit'>('play');
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const clearTable = useGameStore((s) => s.clearTable);
  const diceHistory = useGameStore((s) => s.diceHistory);
  const freeDice = useGameStore((s) => s.freeDice);
  const addDice = useGameStore((s) => s.addDice);

  // Place D12 dice on the RIGHT side of canvas on first load
  useEffect(() => {
    if (currentView === 'play' && freeDice.length === 0) {
      // canvas width = viewport - left panel (226) - right panel (286)
      const canvasW = window.innerWidth - 226 - 286;
      const diceX = canvasW - 110; // near right edge
      addDice(diceX, 60, 12);
    }
  }, [currentView, freeDice.length, addDice]);

  const isDark = theme === 'night';

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden transition-colors duration-700"
      style={{ background: isDark ? '#0d0d1a' : '#d6cfc3', color: isDark ? 'white' : '#1c1208' }}
    >
      {/* ── Navbar ── */}
      <nav
        className="h-14 border-b flex items-center justify-between px-5 sticky top-0 z-50 shrink-0 backdrop-blur-md transition-colors duration-700"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
          background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(210,200,188,0.85)',
        }}
      >
        <h1 className="text-base font-black tracking-tight" style={{
          background: isDark ? 'linear-gradient(90deg, #a78bfa, #c4b5fd)' : 'linear-gradient(90deg, #7c3aed, #4f46e5)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          🎲 桌遊工作台
        </h1>

        <div className="flex items-center gap-3">
          {currentView === 'play' && (
            <>
              {/* Dice history */}
              {diceHistory.length > 0 && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-1 border"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.09)',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>骰子紀錄</span>
                  <div className="flex gap-2">
                    {diceHistory.slice(0, 8).map((r) => (
                      <div key={r.id} className="flex flex-col items-center">
                        <span className="text-xs font-black text-violet-400">{r.value}</span>
                        <span className="text-[8px]" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}>d{r.max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear table */}
              <button
                onClick={clearTable}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                }}
              >
                🗑️ 清空桌面
              </button>
            </>
          )}

          {/* Day / Night toggle */}
          <button
            onClick={() => setTheme(isDark ? 'day' : 'night')}
            className="text-lg w-9 h-9 rounded-full flex items-center justify-center transition-all border"
            title={isDark ? '切換白天模式' : '切換夜晚模式'}
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* View switcher */}
          <div
            className="flex rounded-full p-1 border"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
            }}
          >
            {(['play', 'edit'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className="px-4 py-1 rounded-full text-xs font-bold transition-all"
                style={currentView === view ? { background: '#7c3aed', color: 'white' } : { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
              >
                {view === 'play' ? '遊玩' : '編輯器'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 relative overflow-hidden">
        {currentView === 'edit' ? (
          <DeckBuilder theme={theme} />
        ) : (
          <>
            {/* Left: Deck Panel */}
            <DeckPanel theme={theme} />

            {/* Right: Character Panel */}
            <CharacterPanel theme={theme} />

            {/* Center: Free Canvas (with board inside) */}
            <div className="absolute inset-0" style={{ paddingLeft: 226, paddingRight: 286 }}>
              <FreeCanvas theme={theme} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
