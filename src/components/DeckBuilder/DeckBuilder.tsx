import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CardForm } from './CardForm';
import type { Card } from '../../types/game';
import defaultCardBack from '../../assets/DigitalMonster.jpg';

const DEFAULT_BACK = defaultCardBack;

interface DeckBuilderProps { theme?: 'day' | 'night'; }

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  creature: { label: '生物', color: '#35E0A1', bg: 'rgba(53,224,161,0.15)' },
  spell: { label: '法術', color: '#24D8FF', bg: 'rgba(36,216,255,0.12)' },
  item: { label: '道具', color: '#FF9D42', bg: 'rgba(255,157,66,0.15)' },
  hero: { label: '英雄', color: '#8B5CFF', bg: 'rgba(139,92,255,0.15)' },
};

const CardPreview: React.FC<{
  card: Card;
  theme: 'day' | 'night';
  actions?: React.ReactNode;
}> = ({ card, theme, actions }) => {
  const [flipped, setFlipped] = useState(false);
  const isDark = theme === 'night';
  const cfg = TYPE_CONFIG[card.type] || { label: card.type, color: '#8B5CFF', bg: 'rgba(139,92,255,0.15)' };

  const cardFrontBg = isDark ? '#18243D' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2';
  const descColor = isDark ? 'rgba(255,255,255,0.55)' : '#55607A';

  return (
    <div className="flex flex-col items-center" style={{ gap: 8 }}>
      <div
        style={{ width: 116, height: 162, perspective: 800, cursor: 'pointer' }}
        onClick={() => setFlipped((f) => !f)}
        title="點擊翻面"
      >
        <div
          style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
            transition: 'transform 420ms ease',
          }}
        >
          {/* Front */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            borderRadius: 12, border: `1.5px solid ${cardBorder}`,
            background: cardFrontBg, padding: 10,
            display: 'flex', flexDirection: 'column',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 12px rgba(26,35,64,0.10)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#F4F7FF' : '#1A2340', lineHeight: 1.2, marginBottom: 4 }}>
              {card.name}
            </div>
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: descColor, flex: 1, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
              {card.description}
            </div>
            <div style={{
              marginTop: 8, paddingTop: 8,
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FB'}`,
              display: 'flex',
              justifyContent: card.type === 'creature' ? 'space-between' : 'center',
              alignItems: 'center',
            }}>
              {card.type === 'creature' ? (
                <>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#FF5E7A' }}>⚔️ {card.attack}</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#35E0A1' }}>❤️ {card.health}</span>
                </>
              ) : (
                <span style={{ fontSize: 16, fontWeight: 900, color: '#8B5CFF' }}>{card.value}</span>
              )}
            </div>
          </div>

          {/* Back */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)', borderRadius: 12,
            border: `1.5px solid ${cardBorder}`,
            backgroundImage: `url(${card.backImage || DEFAULT_BACK})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 12px rgba(26,35,64,0.10)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', borderRadius: 12 }} />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.22)' : '#9AA3BA', textAlign: 'center' }}>
        點擊翻面
      </div>
      {actions && <div className="flex gap-1.5">{actions}</div>}
    </div>
  );
};

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ theme = 'night' }) => {
  const isDark = theme === 'night';
  const cards = useGameStore((s) => s.cards);
  const decks = useGameStore((s) => s.decks);
  const addCard = useGameStore((s) => s.addCard);
  const updateCard = useGameStore((s) => s.updateCard);
  const deleteCard = useGameStore((s) => s.deleteCard);
  const updateDeck = useGameStore((s) => s.updateDeck);
  const updateDeckInfo = useGameStore((s) => s.updateDeckInfo);
  const createDeck = useGameStore((s) => s.createDeck);
  const deleteDeckStore = useGameStore((s) => s.deleteDeck);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [currentDeckId, setCurrentDeckId] = useState<string>(() => Object.keys(decks)[0] ?? '');

  // ── KEY FIX: always keep currentDeckId pointing at a real deck ──
  const deckKeys = Object.keys(decks);
  const safeDeckId = decks[currentDeckId] ? currentDeckId : (deckKeys[0] ?? '');
  // Sync state if it drifted (runs synchronously during render to avoid one-frame flash)
  if (safeDeckId !== currentDeckId) {
    setCurrentDeckId(safeDeckId);
  }

  // currentDeck is now always defined (or undefined only when 0 decks exist)
  const currentDeck = decks[safeDeckId];

  const handleSaveCard = (cardData: Omit<Card, 'id'>) => {
    if (editingCardId) updateCard(editingCardId, cardData);
    else addCard(cardData);
    setEditingCardId(null);
  };

  const handleAddToDeck = (cardId: string) => {
    if (!currentDeck) return;
    updateDeck(safeDeckId, [...currentDeck.cards.map((c) => c.id), cardId]);
  };

  const handleRemoveFromDeck = (indexToRemove: number) => {
    if (!currentDeck) return;
    updateDeck(safeDeckId, currentDeck.cards.map((c) => c.id).filter((_, i) => i !== indexToRemove));
  };

  const handleDeleteDeck = () => {
    const keys = Object.keys(decks);
    if (keys.length <= 1) return; // 最後一個不能刪
    const nextId = keys.find((id) => id !== safeDeckId) ?? '';
    // Set next deck BEFORE deleting to avoid undefined flash
    setCurrentDeckId(nextId);
    deleteDeckStore(safeDeckId);
  };

  // ── Styles ──
  const bg = isDark ? '#070B14' : '#F3F6FB';
  const panelBg = isDark ? '#0E1525' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : '#E8EDF8';
  const headColor = isDark ? '#F4F7FF' : '#1A2340';
  const mutedColor = isDark ? '#5A6A8A' : '#9AA3BA';
  const cardItemBg = isDark ? '#141D33' : '#F8FAFF';
  const cardItemBorder = isDark ? 'rgba(255,255,255,0.08)' : '#D9E2F2';

  const inputStyle: React.CSSProperties = {
    width: '100%', minHeight: 44, padding: '0 14px',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
    color: isDark ? '#F4F7FF' : '#1A2340',
    outline: 'none', transition: 'border-color 150ms',
  };

  return (
    <div className="flex w-full overflow-hidden" style={{ height: 'calc(100vh - 56px)', background: bg, color: headColor }}>

      {/* ── LEFT: Card Form ── */}
      <div className="shrink-0 flex flex-col overflow-y-auto custom-scrollbar" style={{ width: 300, padding: '24px 20px', background: panelBg, borderRight: `1px solid ${borderCol}` }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: isDark ? 'var(--accent-purple)' : '#6B3FD4', marginBottom: 20, letterSpacing: '-0.01em' }}>
          ✏️ 卡牌編輯器
        </h2>
        <CardForm
          initialData={editingCardId ? cards[editingCardId] : null}
          onSubmit={handleSaveCard}
          onCancel={() => setEditingCardId(null)}
          theme={theme}
        />
      </div>

      {/* ── MIDDLE: Card Library ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ borderRight: `1px solid ${borderCol}` }}>
        <div className="shrink-0" style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${borderCol}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: headColor }}>🃏 卡牌庫</h2>
          <p style={{ fontSize: 13, color: mutedColor }}>點擊「加入」加到目前牌組・點擊卡片預覽背面</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '20px 24px' }}>
          <div className="flex flex-wrap" style={{ gap: 20 }}>
            {Object.values(cards).map((card) => (
              <CardPreview
                key={card.id}
                card={card}
                theme={theme}
                actions={
                  <>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--accent-purple-dim)', color: isDark ? 'var(--accent-purple)' : '#6B3FD4', border: `1px solid ${isDark ? 'rgba(139,92,255,0.4)' : '#B8C9E8'}` }}
                      onClick={() => handleAddToDeck(card.id)}
                    >加入</button>
                    <button
                      className="btn btn-sm"
                      style={{ background: isDark ? 'rgba(36,216,255,0.12)' : '#EEF3FC', color: isDark ? '#24D8FF' : '#0EA5C9', border: '1px solid transparent' }}
                      onClick={() => setEditingCardId(card.id)}
                    >編輯</button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)', border: '1px solid transparent' }}
                      onClick={() => deleteCard(card.id)}
                    >刪除</button>
                  </>
                }
              />
            ))}
            {Object.keys(cards).length === 0 && (
              <div className="flex flex-col items-center justify-center w-full" style={{ padding: '60px 0', gap: 12 }}>
                <span style={{ fontSize: 48 }}>🃏</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: mutedColor }}>尚無卡牌</p>
                <p style={{ fontSize: 14, color: mutedColor }}>在左側表單建立第一張卡牌</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Deck Builder ── */}
      <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 300, padding: '24px 20px', background: panelBg }}>

        {/* Deck Selector Header */}
        <div className="rounded-xl" style={{ padding: 16, background: isDark ? '#141D33' : '#F3F6FB', border: `1.5px solid ${borderCol}`, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: headColor, marginBottom: 12 }}>📚 牌組管理</h2>

          {/* Deck name + New button */}
          <div className="flex gap-2" style={{ marginBottom: 10 }}>
            <input
              type="text"
              value={currentDeck?.name ?? ''}
              onChange={(e) => currentDeck && updateDeckInfo(safeDeckId, { name: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="牌組名稱"
            />
            <button
              className="btn btn-primary btn-sm"
              style={{ minWidth: 44, padding: '0 14px' }}
              onClick={() => {
                const newId = createDeck();
                // If createDeck returns the new id, switch to it
                if (typeof newId === 'string') setCurrentDeckId(newId);
              }}
              title="建立新牌組"
            >+</button>
          </div>

          {/* Back image URL */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: mutedColor, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              封面圖片網址
            </label>
            <input
              type="text"
              value={currentDeck?.backImage ?? ''}
              onChange={(e) => currentDeck && updateDeckInfo(safeDeckId, { backImage: e.target.value })}
              style={inputStyle}
              placeholder="https://..."
            />
          </div>

          {/* Deck picker + count + delete */}
          <div className="flex items-center justify-between">
            <select
              value={safeDeckId}
              onChange={(e) => setCurrentDeckId(e.target.value)}
              style={{ fontSize: 13, fontWeight: 600, background: 'transparent', color: isDark ? 'var(--accent-purple)' : '#6B3FD4', border: 'none', outline: 'none', cursor: 'pointer', maxWidth: 140 }}
            >
              {Object.values(decks).map((d) => (
                <option key={d.id} value={d.id} style={{ background: isDark ? '#0E1525' : '#fff', color: isDark ? '#F4F7FF' : '#1A2340' }}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: isDark ? 'rgba(139,92,255,0.15)' : '#EEF3FC', color: isDark ? 'var(--accent-purple)' : '#6B3FD4', border: `1px solid ${isDark ? 'rgba(139,92,255,0.3)' : '#D9E2F2'}` }}>
                {currentDeck?.cards.length ?? 0} 張
              </span>
              {/* 只有多於1個牌組時才顯示刪除按鈕 */}
              {deckKeys.length > 1 && (
                <button className="btn btn-sm btn-danger" onClick={handleDeleteDeck}>刪除</button>
              )}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: mutedColor, marginBottom: 10 }}>點擊卡牌從牌組移除</p>

        {/* Deck card list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl" style={{ background: isDark ? '#141D33' : '#F3F6FB', border: `1.5px solid ${borderCol}`, padding: 10 }}>
          <div className="flex flex-col" style={{ gap: 6 }}>
            {currentDeck?.cards.map((card, index) => {
              const cfg = TYPE_CONFIG[card.type] || { label: card.type, color: '#8B5CFF', bg: '' };
              return (
                <div
                  key={`${card.id}-${index}`}
                  onClick={() => handleRemoveFromDeck(index)}
                  className="flex items-center gap-3 rounded-xl cursor-pointer group"
                  style={{ padding: '9px 12px', background: cardItemBg, border: `1.5px solid ${cardItemBorder}`, transition: 'all 150ms ease-out' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,94,122,0.5)';
                    (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,94,122,0.08)' : '#FFF0F3';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = cardItemBorder;
                    (e.currentTarget as HTMLElement).style.background = cardItemBg;
                  }}
                >
                  <div style={{ width: 36, height: 50, borderRadius: 7, backgroundImage: `url(${card.backImage || DEFAULT_BACK})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `1px solid ${cardItemBorder}`, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 700, color: headColor, marginBottom: 3 }} className="truncate">{card.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: '#FF5E7A', fontWeight: 700, flexShrink: 0 }}>移除</span>
                </div>
              );
            })}

            {(!currentDeck || currentDeck.cards.length === 0) && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '40px 16px', gap: 8 }}>
                <span style={{ fontSize: 32 }}>📭</span>
                <p style={{ fontSize: 14, color: mutedColor, fontWeight: 500 }}>牌組是空的</p>
                <p style={{ fontSize: 12, color: mutedColor }}>從卡牌庫加入卡牌</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};