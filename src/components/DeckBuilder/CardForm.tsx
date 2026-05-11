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

export const CardForm: React.FC<CardFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  theme = 'night',
}) => {
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
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  // ── Styles ──
  const formBg      = isDark ? '#0E1525' : '#FFFFFF';
  const formBorder  = isDark ? 'rgba(255,255,255,0.08)' : '#D9E2F2';
  const labelColor  = isDark ? '#5A6A8A' : '#9AA3BA';
  const headColor   = isDark ? '#F4F7FF' : '#1A2340';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: '0 14px',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FB',
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    color: isDark ? '#F4F7FF' : '#1A2340',
    outline: 'none',
    transition: 'border-color 150ms, box-shadow 150ms',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: labelColor,
    marginBottom: 6,
  };

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 0 };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = isDark ? 'var(--accent-purple)' : '#6B3FD4';
    e.target.style.boxShadow = isDark
      ? '0 0 0 3px rgba(139,92,255,0.18)'
      : '0 0 0 3px rgba(107,63,212,0.12)';
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2';
    e.target.style.boxShadow = 'none';
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: formBg,
        border: `1.5px solid ${formBorder}`,
        borderRadius: 16,
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: headColor, marginBottom: 0 }}>
        {initialData ? '✏️ 編輯卡牌' : '✨ 建立新卡牌'}
      </h3>

      {/* Name */}
      <div style={fieldStyle}>
        <label style={labelStyle}>名稱 *</label>
        <input
          required
          name="name"
          value={formData.name}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          style={inputStyle}
          placeholder="卡牌名稱"
        />
      </div>

      {/* Type */}
      <div style={fieldStyle}>
        <label style={labelStyle}>類型</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="creature" style={{ background: isDark ? '#0E1525' : '#fff' }}>🐉 生物 (Creature)</option>
          <option value="spell"    style={{ background: isDark ? '#0E1525' : '#fff' }}>✨ 法術 (Spell)</option>
          <option value="item"     style={{ background: isDark ? '#0E1525' : '#fff' }}>🗡️ 道具 (Item)</option>
          <option value="hero"     style={{ background: isDark ? '#0E1525' : '#fff' }}>⭐ 英雄 (Hero)</option>
        </select>
      </div>

      {/* Stats */}
      {formData.type === 'creature' ? (
        <div className="flex gap-3">
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={{ ...labelStyle, color: '#FF5E7A' }}>⚔️ 攻擊力</label>
            <input
              type="number"
              name="attack"
              value={formData.attack ?? ''}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlur}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 900 }}
              min={0}
            />
          </div>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={{ ...labelStyle, color: '#35E0A1' }}>❤️ 生命值</label>
            <input
              type="number"
              name="health"
              value={formData.health ?? ''}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlur}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 900 }}
              min={0}
            />
          </div>
        </div>
      ) : (
        <div style={fieldStyle}>
          <label style={{ ...labelStyle, color: '#8B5CFF' }}>💫 數值</label>
          <input
            type="number"
            name="value"
            value={formData.value ?? ''}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
            style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 900 }}
            min={0}
          />
        </div>
      )}

      {/* Description */}
      <div style={fieldStyle}>
        <label style={labelStyle}>描述</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          rows={3}
          style={{ ...inputStyle, minHeight: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.6 }}
          placeholder="卡牌效果描述..."
        />
      </div>

      {/* Back image URL */}
      <div style={fieldStyle}>
        <label style={{ ...labelStyle, color: isDark ? 'var(--accent-purple)' : '#6B3FD4' }}>
          🖼️ 背面圖片網址
        </label>
        <input
          name="backImage"
          value={formData.backImage || ''}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="https://..."
          style={inputStyle}
        />
        <p style={{ fontSize: 12, marginTop: 4, color: isDark ? 'rgba(255,255,255,0.22)' : '#9AA3BA' }}>
          設定後卡牌背面會顯示此圖片
        </p>
      </div>

      {/* Submit / Cancel */}
      <div className="flex gap-3" style={{ marginTop: 4 }}>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          {initialData ? '💾 儲存變更' : '✨ 建立卡牌'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 8,
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : '#F3F6FB',
            color: isDark ? '#AAB6D3' : '#55607A',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.25)' : '#B8C9E8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#D9E2F2'; }}
        >
          取消
        </button>
      </div>
    </form>
  );
};
