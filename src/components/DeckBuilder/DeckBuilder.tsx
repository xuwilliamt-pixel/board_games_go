import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CardForm } from './CardForm';
import type { Card } from '../../types/game';

const DEFAULT_BACK = 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=400&auto=format&fit=crop';

interface DeckBuilderProps {
  theme?: 'day' | 'night';
}

/** Simple card preview tile for the editor library */
const CardPreview: React.FC<{ card: Card; theme: 'day' | 'night'; actions?: React.ReactNode }> = ({
  card,
  theme,
  actions,
}) => {
  const [flipped, setFlipped] = useState(false);
  const isDark = theme === 'night';
  const backBg = card.backImage ? `url(${card.backImage})` : `url(${DEFAULT_BACK})`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-[110px] h-[154px] cursor-pointer hover:-translate-y-2 transition-transform"
        style={{ perspective: '800px' }}
        onClick={() => setFlipped((f) => !f)}
        title="點擊預覽正/背面"
      >
        <div
          className="w-full h-full relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl border-2 p-2 flex flex-col shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              background: isDark ? '#1a1a2e' : '#faf7f0',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            }}
          >
            <div className="text-[11px] font-black truncate" style={{ color: isDark ? 'white' : '#1c1208' }}>{card.name}</div>
            <div className="text-[9px] italic mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>{card.type}</div>
            <div className="flex-1 text-[9px] mt-1 line-clamp-4 leading-snug" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
              {card.description}
            </div>
            {card.type === 'creature' ? (
              <div className="flex justify-between mt-auto pt-1 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <span className="text-xs font-black text-red-500">{card.attack}</span>
                <span className="text-xs font-black text-green-600">{card.health}</span>
              </div>
            ) : (
              <div className="text-center mt-auto pt-1 border-t text-xs font-black text-violet-600" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                {card.value}
              </div>
            )}
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-xl border-2 shadow-xl bg-cover bg-center bg-no-repeat"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundImage: backBg, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
          >
            <div className="absolute inset-0 bg-black/30 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="text-[9px] text-center" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}>點擊預覽背面</div>
      {actions && <div className="flex gap-1">{actions}</div>}
    </div>
  );
};

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ theme = 'night' }) => {
  const isDark = theme === 'night';
  const cards = useGameStore((state) => state.cards);
  const decks = useGameStore((state) => state.decks);
  const addCard = useGameStore((state) => state.addCard);
  const updateCard = useGameStore((state) => state.updateCard);
  const deleteCard = useGameStore((state) => state.deleteCard);
  const updateDeck = useGameStore((state) => state.updateDeck);
  const updateDeckInfo = useGameStore((state) => state.updateDeckInfo);
  const createDeck = useGameStore((state) => state.createDeck);
  const deleteDeckStore = useGameStore((state) => state.deleteDeck);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [currentDeckId, setCurrentDeckId] = useState<string>('');

  React.useEffect(() => {
    if (!decks[currentDeckId] && Object.keys(decks).length > 0) {
      setCurrentDeckId(Object.keys(decks)[0]);
    }
  }, [decks, currentDeckId]);

  const currentDeck = decks[currentDeckId];

  const handleSaveCard = (cardData: Omit<Card, 'id'>) => {
    if (editingCardId) {
      updateCard(editingCardId, cardData);
    } else {
      addCard(cardData);
    }
    setEditingCardId(null);
  };

  const handleAddToDeck = (cardId: string) => {
    if (!currentDeck) return;
    updateDeck(currentDeckId, [...currentDeck.cards.map((c) => c.id), cardId]);
  };

  const handleRemoveFromDeck = (indexToRemove: number) => {
    if (!currentDeck) return;
    updateDeck(currentDeckId, currentDeck.cards.map((c) => c.id).filter((_, i) => i !== indexToRemove));
  };

  const handleDeleteDeck = () => {
    const deckKeys = Object.keys(decks);
    if (deckKeys.length > 1) {
      const nextId = deckKeys.find((id) => id !== currentDeckId);
      deleteDeckStore(currentDeckId);
      if (nextId) setCurrentDeckId(nextId);
    }
  };

  const panelBg = isDark ? '#0d0d1a' : '#ddd5c8';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const inputCls = `w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors border`;
  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    color: isDark ? 'white' : '#1c1208',
  };
  const labelColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)';
  const textColor = isDark ? 'white' : '#1c1208';
  const mutedColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';

  return (
    <div className="flex w-full h-[calc(100vh-56px)] p-6 gap-6 overflow-hidden" style={{ background: panelBg, color: textColor }}>
      {/* ── Left: Card Form ── */}
      <div className="w-[300px] flex flex-col shrink-0 overflow-y-auto custom-scrollbar pr-2">
        <h2 className="text-xl font-black mb-4 text-violet-500">卡牌編輯器</h2>
        <CardForm
          initialData={editingCardId ? cards[editingCardId] : null}
          onSubmit={handleSaveCard}
          onCancel={() => setEditingCardId(null)}
          theme={theme}
        />
      </div>

      {/* ── Middle: Card Library ── */}
      <div className="flex-1 flex flex-col min-w-0 border-l border-r px-6" style={{ borderColor }}>
        <h2 className="text-xl font-black mb-1" style={{ color: textColor }}>卡牌庫</h2>
        <p className="text-xs mb-4" style={{ color: mutedColor }}>點擊「加入」加到目前牌組。點擊卡片預覽背面。</p>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-wrap gap-5">
            {Object.values(cards).map((card) => (
              <CardPreview
                key={card.id}
                card={card}
                theme={theme}
                actions={
                  <>
                    <button
                      onClick={() => handleAddToDeck(card.id)}
                      className="text-[10px] bg-violet-500/20 hover:bg-violet-500/40 text-violet-600 px-2 py-1 rounded transition-colors"
                    >加入</button>
                    <button
                      onClick={() => setEditingCardId(card.id)}
                      className="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-600 px-2 py-1 rounded transition-colors"
                    >編輯</button>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="text-[10px] bg-red-500/20 hover:bg-red-500/40 text-red-600 px-2 py-1 rounded transition-colors"
                    >刪除</button>
                  </>
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Deck Builder ── */}
      <div className="w-[280px] flex flex-col shrink-0">
        <div className="flex flex-col gap-2 mb-4 p-4 rounded-xl border" style={{ background: cardBg, borderColor }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentDeck?.name || ''}
              onChange={(e) => updateDeckInfo(currentDeckId, { name: e.target.value })}
              className={inputCls}
              style={inputStyle}
              placeholder="牌組名稱"
            />
            <button onClick={() => createDeck()} className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm transition-colors">+</button>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: labelColor }}>牌組封面圖 (背面)</label>
            <input type="text" value={currentDeck?.backImage || ''} onChange={(e) => updateDeckInfo(currentDeckId, { backImage: e.target.value })} className={inputCls} style={inputStyle} placeholder="https://..." />
          </div>
          <div className="flex justify-between items-center mt-1">
            <select
              value={currentDeckId}
              onChange={(e) => setCurrentDeckId(e.target.value)}
              className="text-xs outline-none cursor-pointer bg-transparent"
              style={{ color: mutedColor }}
            >
              {Object.values(decks).map((d) => (
                <option key={d.id} value={d.id} style={{ background: isDark ? '#1a1a2e' : '#e0d8cc', color: isDark ? 'white' : '#1c1208' }}>{d.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 rounded-full font-bold border" style={{ color: mutedColor, borderColor }}>{currentDeck?.cards.length || 0} 張</span>
              {Object.keys(decks).length > 1 && (
                <button onClick={handleDeleteDeck} className="text-red-500 hover:text-red-400 text-xs transition-colors">刪除</button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs mb-2" style={{ color: mutedColor }}>點擊卡牌從牌組移除。</p>
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border p-3" style={{ background: cardBg, borderColor }}>
          <div className="flex flex-col gap-2">
            {currentDeck?.cards.map((card, index) => (
              <div
                key={`${card.id}-${index}`}
                onClick={() => handleRemoveFromDeck(index)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group border"
                style={{ background: cardBg, borderColor }}
              >
                <div className="w-10 h-14 rounded-lg bg-cover bg-center shrink-0 border" style={{ backgroundImage: card.backImage ? `url(${card.backImage})` : `url(${DEFAULT_BACK})`, borderColor }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: textColor }}>{card.name}</div>
                  <div className="text-xs truncate" style={{ color: mutedColor }}>{card.type}</div>
                </div>
                <div className="text-[10px] text-red-500 opacity-0 group-hover:opacity-80 transition-opacity shrink-0">移除</div>
              </div>
            ))}
            {(!currentDeck || currentDeck.cards.length === 0) && (
              <div className="text-center py-10 text-sm" style={{ color: mutedColor }}>牌組是空的</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
