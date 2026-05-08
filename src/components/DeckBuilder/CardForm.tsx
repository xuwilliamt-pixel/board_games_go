import React, { useState, useEffect } from 'react';
import type { Card } from '../../types/game';

interface CardFormProps {
  initialData?: Card | null;
  onSubmit: (cardData: Omit<Card, 'id'>) => void;
  onCancel: () => void;
  theme?: 'day' | 'night';
}

const defaultCardData: Omit<Card, 'id'> = {
  name: '',
  description: '',
  type: 'creature',
  isFlipped: false,
  backImage: '',
  attack: 1,
  health: 1,
  value: 1,
};

export const CardForm: React.FC<CardFormProps> = ({ initialData, onSubmit, onCancel, theme = 'night' }) => {
  const [formData, setFormData] = useState<Omit<Card, 'id'>>(defaultCardData);
  const isDark = theme === 'night';

  useEffect(() => {
    setFormData(initialData ? { ...defaultCardData, ...initialData } : defaultCardData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSubmit(formData);
  };

  const inputStyle: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
    color: isDark ? 'white' : '#1c1208',
  };
  const labelStyle: React.CSSProperties = { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' };
  const formBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const formBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)';
  const titleColor = isDark ? 'white' : '#1c1208';

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors border focus:border-violet-500';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-5 rounded-2xl border"
      style={{ background: formBg, borderColor: formBorder }}
    >
      <h3 className="text-base font-black" style={{ color: titleColor }}>
        {initialData ? '✏️ 編輯卡牌' : '✨ 建立新卡牌'}
      </h3>

      <div>
        <label className="text-[10px] font-bold uppercase mb-1 block" style={labelStyle}>名稱 *</label>
        <input required name="name" value={formData.name} onChange={handleChange} className={inputCls} style={inputStyle} placeholder="卡牌名稱" />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase mb-1 block" style={labelStyle}>類型</label>
        <select name="type" value={formData.type} onChange={handleChange} className={inputCls} style={inputStyle}>
          <option value="creature" style={{ background: isDark ? '#1a1a2e' : '#e8dfd4', color: isDark ? 'white' : '#1c1208' }}>生物 (Creature)</option>
          <option value="spell" style={{ background: isDark ? '#1a1a2e' : '#e8dfd4', color: isDark ? 'white' : '#1c1208' }}>法術 (Spell)</option>
          <option value="item" style={{ background: isDark ? '#1a1a2e' : '#e8dfd4', color: isDark ? 'white' : '#1c1208' }}>道具 (Item)</option>
          <option value="hero" style={{ background: isDark ? '#1a1a2e' : '#e8dfd4', color: isDark ? 'white' : '#1c1208' }}>英雄 (Hero)</option>
        </select>
      </div>

      {formData.type === 'creature' ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase mb-1 block" style={labelStyle}>攻擊力</label>
            <input type="number" name="attack" value={formData.attack ?? ''} onChange={handleChange} className={inputCls} style={inputStyle} />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase mb-1 block" style={labelStyle}>生命值</label>
            <input type="number" name="health" value={formData.health ?? ''} onChange={handleChange} className={inputCls} style={inputStyle} />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-[10px] font-bold uppercase mb-1 block" style={labelStyle}>數值</label>
          <input type="number" name="value" value={formData.value ?? ''} onChange={handleChange} className={inputCls} style={inputStyle} />
        </div>
      )}

      <div>
        <label className="text-[10px] font-bold uppercase mb-1 block" style={labelStyle}>描述</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={`${inputCls} resize-none`} style={inputStyle} placeholder="卡牌效果描述..." />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase mb-1 block" style={{ ...labelStyle, color: '#7c3aed' }}>🖼️ 背面圖片網址</label>
        <input name="backImage" value={formData.backImage || ''} onChange={handleChange} placeholder="https://..." className={inputCls} style={inputStyle} />
        <p className="text-[9px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.3)' }}>設定此網址後，卡牌的背面會顯示此圖片</p>
      </div>

      <div className="flex gap-3 mt-2">
        <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
          {initialData ? '儲存變更' : '建立卡牌'}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 font-bold py-2 px-4 rounded-lg transition-colors text-sm border" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          取消
        </button>
      </div>
    </form>
  );
};
