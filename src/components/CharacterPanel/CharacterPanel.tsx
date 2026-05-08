import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import type { Character, CharacterRole } from '../../types/game';

interface CharacterPanelProps {
  theme?: 'day' | 'night';
}

const ROLE_PRESETS: { role: CharacterRole; name: string; emoji: string; color: string }[] = [
  { role: 'warrior', name: '勇者', emoji: '⚔️', color: '#ef4444' },
  { role: 'mage',    name: '法師', emoji: '🧙', color: '#8b5cf6' },
  { role: 'archer',  name: '弓手', emoji: '🏹', color: '#10b981' },
  { role: 'healer',  name: '治癒師', emoji: '💊', color: '#06b6d4' },
  { role: 'monster', name: '怪物', emoji: '👹', color: '#f59e0b' },
  { role: 'boss',    name: '魔王', emoji: '👾', color: '#f97316' },
];

interface HPBarProps {
  filled: boolean;
  color: string;
  onClick: () => void;
}
const HPBar: React.FC<HPBarProps> = ({ filled, color, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-8 h-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
    style={{
      background: filled ? color : 'transparent',
      border: `2px solid ${color}`,
      boxShadow: filled ? `0 0 6px ${color}60` : 'none',
    }}
  />
);

interface CharacterCardProps {
  character: Character;
  theme: 'day' | 'night';
}
const CharacterCard: React.FC<CharacterCardProps> = ({ character, theme }) => {
  const toggleHPBar = useGameStore((s) => s.toggleHPBar);
  const updateStat = useGameStore((s) => s.updateCharacterStat);
  const resetHP = useGameStore((s) => s.resetCharacterHP);

  const isDark = theme === 'night';
  const isHero = character.role !== 'boss' && character.role !== 'monster';
  const filledCount = character.hpBars.filter(Boolean).length;

  return (
    <div
      className="rounded-xl p-3 border transition-colors"
      style={{
        background: isDark ? `${character.color}12` : `${character.color}15`,
        borderColor: `${character.color}40`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{character.emoji}</span>
          <div>
            <div className="font-black text-sm" style={{ color: character.color }}>{character.name}</div>
            <div className="text-[9px] font-semibold uppercase opacity-60" style={{ color: isDark ? '#fff' : '#000' }}>
              {isHero ? '勇者' : character.role === 'boss' ? '魔王' : '怪物'}
            </div>
          </div>
        </div>
        <button
          onClick={() => resetHP(character.id)}
          className="text-[9px] px-2 py-1 rounded-md font-bold transition-colors"
          style={{
            background: `${character.color}25`,
            color: character.color,
          }}
          title="重置血量"
        >
          重置
        </button>
      </div>

      {/* HP Bars */}
      <div className="mb-2.5">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[9px] font-bold uppercase opacity-50" style={{ color: isDark ? '#fff' : '#333' }}>HP</span>
          <span className="text-[9px] font-black ml-1" style={{ color: character.color }}>{filledCount}/{character.hpBars.length}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {character.hpBars.map((filled, i) => (
            <HPBar key={i} filled={filled} color={character.color} onClick={() => toggleHPBar(character.id, i)} />
          ))}
        </div>
      </div>

      {/* ATK / DEF */}
      <div className="flex gap-2">
        {[
          { label: 'ATK', stat: 'attack' as const, val: character.attack, icon: '⚔️' },
          { label: 'DEF', stat: 'defense' as const, val: character.defense, icon: '🛡️' },
        ].map(({ label, stat, val, icon }) => (
          <div
            key={stat}
            className="flex-1 flex items-center justify-between rounded-lg px-2 py-1"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
          >
            <span className="text-[9px] font-bold" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>{icon} {label}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateStat(character.id, stat, -1)}
                className="w-4 h-4 rounded text-xs font-black flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
              >−</button>
              <span className="text-sm font-black min-w-[16px] text-center" style={{ color: isDark ? 'white' : '#1c1208' }}>{val}</span>
              <button
                onClick={() => updateStat(character.id, stat, +1)}
                className="w-4 h-4 rounded text-xs font-black flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AddPieceButtonProps {
  preset: typeof ROLE_PRESETS[0];
  onClick: () => void;
}
const AddPieceButton: React.FC<AddPieceButtonProps> = ({ preset, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95 border"
    style={{
      background: `${preset.color}18`,
      borderColor: `${preset.color}40`,
      color: preset.color,
    }}
  >
    <span>{preset.emoji}</span>
    <span>{preset.name}</span>
  </button>
);

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ theme = 'night' }) => {
  const characters = useGameStore((s) => s.characters);
  const addBoardPiece = useGameStore((s) => s.addBoardPiece);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chars' | 'pieces'>('chars');
  const isDark = theme === 'night';

  const handleAddPiece = (preset: typeof ROLE_PRESETS[0]) => {
    // Find empty cell on board
    const boardPieces = useGameStore.getState().boardPieces;
    const occupied = new Set(boardPieces.map((p) => `${p.row},${p.col}`));
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!occupied.has(`${r},${c}`)) {
          addBoardPiece({ label: preset.name.slice(0, 1), role: preset.role, emoji: preset.emoji, color: preset.color, row: r, col: c });
          return;
        }
      }
    }
  };

  return (
    <motion.div
      className="fixed right-0 top-14 bottom-0 z-40 flex flex-row-reverse"
      animate={{ x: collapsed ? 280 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Panel */}
      <div
        className="w-[280px] h-full flex flex-col overflow-hidden border-l backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(10,10,26,0.92)' : 'rgba(230,220,208,0.92)',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
          {[
            { key: 'chars', label: '👥 角色狀態' },
            { key: 'pieces', label: '♟️ 新增棋子' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className="flex-1 py-2.5 text-xs font-bold transition-colors"
              style={{
                color: activeTab === key ? '#8b5cf6' : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'),
                borderBottom: activeTab === key ? '2px solid #8b5cf6' : '2px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
          {activeTab === 'chars' ? (
            <>
              {/* Heroes */}
              <div className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                ─── 勇者陣營 ───
              </div>
              {characters.filter((c) => c.role !== 'boss' && c.role !== 'monster').map((c) => (
                <CharacterCard key={c.id} character={c} theme={theme} />
              ))}

              {/* Boss */}
              <div className="text-[9px] font-black uppercase tracking-widest mt-2 mb-1" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                ─── 魔王陣營 ───
              </div>
              {characters.filter((c) => c.role === 'boss' || c.role === 'monster').map((c) => (
                <CharacterCard key={c.id} character={c} theme={theme} />
              ))}
            </>
          ) : (
            <>
              <p className="text-xs mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
                點擊新增棋子到 5×5 棋盤上的空格
              </p>
              <div className="flex flex-wrap gap-2">
                {ROLE_PRESETS.map((preset) => (
                  <AddPieceButton key={preset.role} preset={preset} onClick={() => handleAddPiece(preset)} />
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl border text-xs" style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
              }}>
                <p className="font-bold mb-1">操作說明</p>
                <p>• 點擊棋子 → 選取（發光）</p>
                <p>• 點擊空格 → 移動到該格</p>
                <p>• 右鍵棋子 → 刪除</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toggle tab */}
      <button
        className="w-6 h-16 self-center rounded-l-lg text-xs transition-colors flex items-center justify-center border border-r-0"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          background: isDark ? 'rgba(20,15,40,0.9)' : 'rgba(210,200,188,0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        }}
      >
        {collapsed ? '‹' : '›'}
      </button>
    </motion.div>
  );
};
