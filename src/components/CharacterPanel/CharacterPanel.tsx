import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import type { Character, CharacterRole } from '../../types/game';

interface CharacterPanelProps { theme?: 'day' | 'night'; }

const ROLE_PRESETS: { role: CharacterRole; name: string; emoji: string; color: string }[] = [
  { role: 'warrior', name: '勇者', emoji: '⚔️', color: '#FF5E7A' },
  { role: 'mage', name: '法師', emoji: '🧙', color: '#8B5CFF' },
  { role: 'archer', name: '弓手', emoji: '🏹', color: '#35E0A1' },
  { role: 'healer', name: '治癒師', emoji: '💊', color: '#24D8FF' },
  { role: 'monster', name: '怪物', emoji: '👹', color: '#FF9D42' },
  { role: 'boss', name: '魔王', emoji: '👾', color: '#FF9D42' },
  { role: 'bigFour', name: '猴', emoji: '🐒', color: '#91EB75' },
  { role: 'bigFour', name: '豬', emoji: '🐷', color: '#D34CC8' },
  { role: 'bigFour', name: '雞', emoji: '🐔', color: '#FCB0A0' },
  { role: 'bigFour', name: '狗', emoji: '🐶', color: '#F2F555' },
];

function getRoleLabel(role: CharacterRole): string {
  switch (role) {
    case 'warrior': return '勇者';
    case 'mage': return '法師';
    case 'archer': return '弓手';
    case 'healer': return '治癒師';
    case 'boss': return '魔王';
    case 'monster': return '怪物';
    case 'Slime': return '史萊姆';
    case 'bigFour': return '四大天王';
    default: return role;
  }
}

interface HPSegProps { filled: boolean; color: string; onClick: () => void; }
const HPSeg: React.FC<HPSegProps> = ({ filled, color, onClick }) => (
  <button
    onClick={onClick}
    title={filled ? '點擊扣除 HP' : '點擊回復 HP'}
    style={{
      flex: 1, height: 10, borderRadius: 4,
      border: `1.5px solid ${filled ? color : 'rgba(255,255,255,0.12)'}`,
      background: filled ? color : 'transparent',
      boxShadow: filled ? `0 0 8px ${color}60` : 'none',
      cursor: 'pointer', transition: 'all 150ms ease-out', padding: 0,
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scaleY(1.25)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scaleY(1)'; }}
  />
);

interface CharCardProps { character: Character; theme: 'day' | 'night'; }
const CharCard: React.FC<CharCardProps> = ({ character, theme }) => {
  const toggleHPBar = useGameStore((s) => s.toggleHPBar);
  const updateStat = useGameStore((s) => s.updateCharacterStat);
  const resetHP = useGameStore((s) => s.resetCharacterHP);

  const isDark = theme === 'night';
  const filled = character.hpBars.filter(Boolean).length;
  const total = character.hpBars.length;
  const hpPct = filled / total;
  const hpColor = hpPct > 0.5 ? '#35E0A1' : hpPct > 0.25 ? '#FF9D42' : '#FF5E7A';

  const cardBg = isDark ? `${character.color}14` : `${character.color}12`;
  const cardBorder = isDark ? `${character.color}35` : `${character.color}30`;
  const statBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,35,64,0.05)';
  const statLabel = isDark ? 'rgba(255,255,255,0.45)' : '#9AA3BA';
  const btnColor = isDark ? 'rgba(255,255,255,0.40)' : '#9AA3BA';

  return (
    <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 14, padding: '14px 14px 12px', transition: 'all 200ms ease-out' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>{character.emoji}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: character.color, lineHeight: 1.2 }}>{character.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.40)' : '#9AA3BA', letterSpacing: '0.04em', marginTop: 2 }}>
              {getRoleLabel(character.role)}
            </div>
          </div>
        </div>
        <button
          onClick={() => resetHP(character.id)}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: `${character.color}22`, border: `1px solid ${character.color}40`, color: character.color, cursor: 'pointer', transition: 'all 150ms', minHeight: 28, flexShrink: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${character.color}38`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${character.color}22`; }}
          title="重置血量至滿"
        >重置</button>
      </div>

      {/* HP Section */}
      <div style={{ marginBottom: 10 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: isDark ? 'rgba(255,255,255,0.40)' : '#9AA3BA' }}>HP</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: hpColor, letterSpacing: '0.02em' }}>{filled} / {total}</span>
        </div>
        <div className="flex" style={{ gap: 3 }}>
          {character.hpBars.map((isFilled, i) => (
            <HPSeg key={i} filled={isFilled} color={hpColor} onClick={() => toggleHPBar(character.id, i)} />
          ))}
        </div>
      </div>

      {/* ── ATK / DEF ── 修正：overflow-hidden + minWidth:0 防止+按鈕跑版 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {([
          { label: 'ATK', stat: 'attack' as const, val: character.attack, icon: '⚔️', color: '#FF5E7A' },
          { label: 'DEF', stat: 'defense' as const, val: character.defense, icon: '🛡️', color: '#24D8FF' },
        ] as const).map(({ label, stat, val, icon, color }) => (
          <div
            key={stat}
            style={{
              flex: 1, minWidth: 0, // ← 防止 flex child 撐破父容器
              display: 'flex', alignItems: 'center',
              background: statBg, borderRadius: 12,
              padding: '7px 8px', gap: 4, overflow: 'hidden',
            }}
          >
            {/* icon + label */}
            <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: statLabel, letterSpacing: '0.04em', flexShrink: 0 }}>
              {label}
            </span>
            {/* − value + 推到右側 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto', flexShrink: 0 }}>
              <button
                onClick={() => updateStat(character.id, stat, -1)}
                style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: 'none', color: btnColor, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,94,122,0.25)'; (e.currentTarget as HTMLElement).style.color = '#FF5E7A'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = btnColor; }}
              >−</button>
              <span style={{ fontSize: 17, fontWeight: 900, color, minWidth: 22, textAlign: 'center', lineHeight: 1 }}>{val}</span>
              <button
                onClick={() => updateStat(character.id, stat, +1)}
                style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: 'none', color: btnColor, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(53,224,161,0.25)'; (e.currentTarget as HTMLElement).style.color = '#35E0A1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = btnColor; }}
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddPieceBtn: React.FC<{ preset: typeof ROLE_PRESETS[0]; onClick: () => void }> = ({ preset, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-xl font-semibold transition-all"
    style={{ padding: '8px 12px', fontSize: 13, background: `${preset.color}18`, border: `1.5px solid ${preset.color}35`, color: preset.color, cursor: 'pointer', minHeight: 36 }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${preset.color}30`; (e.currentTarget as HTMLElement).style.borderColor = preset.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${preset.color}18`; (e.currentTarget as HTMLElement).style.borderColor = `${preset.color}35`; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
  >
    <span style={{ fontSize: 16 }}>{preset.emoji}</span>
    <span>{preset.name}</span>
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode; isDark: boolean }> = ({ children, isDark }) => (
  <div className="flex items-center gap-2" style={{ margin: '14px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.28)' : '#9AA3BA' }}>
    <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : '#E8EDF8' }} />
    <span>{children}</span>
    <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : '#E8EDF8' }} />
  </div>
);

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ theme = 'night' }) => {
  const characters = useGameStore((s) => s.characters);
  const addBoardPiece = useGameStore((s) => s.addBoardPiece);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chars' | 'pieces'>('chars');
  const isDark = theme === 'night';

  const panelBg = isDark ? 'rgba(7, 11, 20, 0.94)' : 'rgba(255, 255, 255, 0.95)';
  const borderCol = isDark ? 'var(--border-subtle)' : '#E8EDF8';
  const toggleBg = isDark ? 'rgba(14, 21, 37, 0.95)' : 'rgba(240, 244, 252, 0.95)';

  const handleAddPiece = (preset: typeof ROLE_PRESETS[0]) => {
    const GAP = 10;
    const canvasEl = document.querySelector('[data-canvas]') as HTMLElement | null;
    const canvasW = canvasEl ? canvasEl.clientWidth : Math.max(400, window.innerWidth - 240 - 320);
    const canvasH = canvasEl ? canvasEl.clientHeight : Math.max(400, window.innerHeight - 56);
    const maxDim = Math.min(canvasW - 64, canvasH - 60);
    const cell = Math.max(70, Math.min(110, Math.floor((maxDim - GAP * 4) / 5)));
    const boardW = cell * 5 + GAP * 4 + 32;
    const boardLeft = Math.round((canvasW - boardW) / 2);
    const pieceZoneL = boardLeft + boardW + 10;
    const x = pieceZoneL + 16 + Math.random() * 24;
    const y = 60 + Math.random() * (canvasH - 160);
    addBoardPiece({ label: preset.name.slice(0, 1), role: preset.role, emoji: preset.emoji, color: preset.color, x, y });
  };

  const heroes = characters.filter((c) => !['boss', 'monster', 'bigFour', 'Slime'].includes(c.role));
  const bigFour = characters.filter((c) => c.role === 'bigFour');
  const villains = characters.filter((c) => ['boss', 'monster', 'Slime'].includes(c.role));

  return (
    <motion.div
      className="fixed right-0 top-14 bottom-0 z-40 flex flex-row-reverse"
      animate={{ x: collapsed ? 316 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex flex-col overflow-hidden border-l" style={{ width: 320, height: '100%', background: panelBg, borderColor: borderCol, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        {/* Tabs */}
        <div className="shrink-0 flex border-b" style={{ borderColor: borderCol, height: 52 }}>
          {([
            { key: 'chars', label: '👥 角色狀態' },
            { key: 'pieces', label: '♟️ 新增棋子' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'transparent',
                color: activeTab === key ? (isDark ? 'var(--accent-purple)' : '#6B3FD4') : (isDark ? 'rgba(255,255,255,0.35)' : '#9AA3BA'),
                borderBottom: activeTab === key ? `2.5px solid ${isDark ? 'var(--accent-purple)' : '#6B3FD4'}` : '2.5px solid transparent',
                transition: 'all 150ms ease-out',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col" style={{ padding: '12px 14px', gap: 0 }}>
          {activeTab === 'chars' ? (
            <>
              {heroes.length > 0 && (<>
                <SectionLabel isDark={isDark}>⚔️ 勇者陣營</SectionLabel>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {heroes.map((c) => <CharCard key={c.id} character={c} theme={theme} />)}
                </div>
              </>)}
              {bigFour.length > 0 && (<>
                <SectionLabel isDark={isDark}>👑 四大天王</SectionLabel>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {bigFour.map((c) => <CharCard key={c.id} character={c} theme={theme} />)}
                </div>
              </>)}
              {villains.length > 0 && (<>
                <SectionLabel isDark={isDark}>👾 魔王陣營</SectionLabel>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {villains.map((c) => <CharCard key={c.id} character={c} theme={theme} />)}
                </div>
              </>)}
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500 }}>點擊角色，棋子會出現在棋盤右側的棋子區。</p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {ROLE_PRESETS.map((preset, i) => (
                  <AddPieceBtn key={`${preset.role}-${preset.name}-${i}`} preset={preset} onClick={() => handleAddPiece(preset)} />
                ))}
              </div>
              <div className="rounded-xl" style={{ marginTop: 20, padding: '14px 16px', background: isDark ? 'rgba(255,255,255,0.03)' : '#F3F6FB', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E8EDF8'}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? 'var(--text-secondary)' : '#55607A', marginBottom: 8 }}>操作說明</p>
                {['點擊棋子 → 選取（高亮）', '拖曳棋子 → 移動位置', '右鍵棋子 → 開啟選單/刪除'].map((tip, i) => (
                  <p key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: isDark ? 'var(--accent-purple)' : '#6B3FD4', fontWeight: 700 }}>•</span>{tip}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        style={{ width: 20, height: 64, alignSelf: 'center', background: toggleBg, border: `1px solid ${borderCol}`, borderRight: 'none', borderRadius: '8px 0 0 8px', color: isDark ? 'var(--text-muted)' : '#9AA3BA', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-purple)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = toggleBg; (e.currentTarget as HTMLElement).style.color = isDark ? 'var(--text-muted)' : '#9AA3BA'; }}
      >{collapsed ? '‹' : '›'}</button>
    </motion.div>
  );
};