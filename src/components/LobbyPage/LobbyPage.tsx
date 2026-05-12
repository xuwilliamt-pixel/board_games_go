import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';

interface LobbyPageProps {
    onEnter: (roomId: string) => void;
}

const genRoomId = () => Math.random().toString(36).substring(2, 9);

type Tab = 'join' | 'create';

export const LobbyPage: React.FC<LobbyPageProps> = ({ onEnter }) => {
    const [tab, setTab] = useState<Tab>('join');
    const [joinInput, setJoinInput] = useState('');
    const [createInput, setCreateInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const checkRoomExists = async (roomId: string): Promise<boolean> => {
        const snapshot = await get(ref(db, `rooms/${roomId}`));
        return snapshot.exists();
    };

    const handleJoin = async () => {
        const trimmed = joinInput.trim();
        if (!trimmed) { setError('請輸入房間號碼'); return; }
        setLoading(true);
        setError('');
        try {
            const exists = await checkRoomExists(trimmed);
            if (!exists) {
                setError('找不到此房間，請確認號碼是否正確');
                setLoading(false);
                return;
            }
            onEnter(trimmed);
        } catch {
            setError('連線失敗，請稍後再試');
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const trimmed = createInput.trim();
        const roomId = trimmed || genRoomId();
        if (trimmed) {
            // 如果有輸入，檢查是否已被使用
            setLoading(true);
            setError('');
            try {
                const exists = await checkRoomExists(trimmed);
                if (exists) {
                    setError('此房間號碼已存在，請換一個');
                    setLoading(false);
                    return;
                }
            } catch {
                setError('連線失敗，請稍後再試');
                setLoading(false);
                return;
            }
        }
        onEnter(roomId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') tab === 'join' ? handleJoin() : handleCreate();
    };

    const switchTab = (t: Tab) => {
        setTab(t);
        setError('');
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: 48,
        padding: '0 16px',
        background: 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${error ? 'rgba(255,94,122,0.6)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        color: '#F4F7FF',
        outline: 'none',
        boxSizing: 'border-box',
        letterSpacing: '0.05em',
        transition: 'border-color 150ms',
        opacity: loading ? 0.6 : 1,
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#070B14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: [
                    'radial-gradient(ellipse at 25% 40%, rgba(139,92,255,0.12) 0%, transparent 55%)',
                    'radial-gradient(ellipse at 75% 60%, rgba(36,216,255,0.08) 0%, transparent 50%)',
                    'linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px)',
                    'linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)',
                ].join(', '),
                backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    position: 'relative',
                    background: 'rgba(14,21,37,0.95)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 24,
                    padding: '48px 40px 40px',
                    width: '100%',
                    maxWidth: 420,
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,255,0.1)',
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: '#A78BFA', margin: 0, marginBottom: 6 }}>
                        桌遊工作台
                    </h1>
                </div>

                {/* Tab switcher */}
                <div style={{
                    display: 'flex', background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: 4, marginBottom: 24,
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    {(['join', 'create'] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => switchTab(t)}
                            style={{
                                flex: 1, height: 38, borderRadius: 9, border: 'none',
                                background: tab === t ? 'linear-gradient(135deg, #8B5CFF, #6B3FD4)' : 'transparent',
                                color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                transition: 'all 150ms',
                                boxShadow: tab === t ? '0 2px 12px rgba(139,92,255,0.4)' : 'none',
                            }}
                        >
                            {t === 'join' ? '🔗 加入房間' : '✨ 建立房間'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'join' ? (
                        <motion.div
                            key="join"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                        >
                            <label style={{
                                display: 'block', fontSize: 12, fontWeight: 700,
                                color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em',
                                textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                房間號碼
                            </label>
                            <input
                                type="text"
                                value={joinInput}
                                onChange={(e) => { setJoinInput(e.target.value); setError(''); }}
                                onKeyDown={handleKeyDown}
                                placeholder="例如：aa1234"
                                autoFocus
                                disabled={loading}
                                style={inputStyle}
                                onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'; }}
                                onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                            />
                            {error && <p style={{ fontSize: 12, color: '#FF5E7A', marginTop: 6, marginBottom: 0 }}>{error}</p>}
                            <button
                                onClick={handleJoin}
                                disabled={loading}
                                style={{
                                    width: '100%', height: 48, borderRadius: 12, border: 'none',
                                    background: loading ? 'rgba(139,92,255,0.5)' : 'linear-gradient(135deg, #8B5CFF, #6B3FD4)',
                                    color: '#fff', fontSize: 15, fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,255,0.4)',
                                    marginTop: 16, transition: 'all 150ms',
                                }}
                            >
                                {loading ? '查詢中...' : '加入'}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            <label style={{
                                display: 'block', fontSize: 12, fontWeight: 700,
                                color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em',
                                textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                自訂房間號碼（選填）
                            </label>
                            <input
                                type="text"
                                value={createInput}
                                onChange={(e) => { setCreateInput(e.target.value); setError(''); }}
                                onKeyDown={handleKeyDown}
                                placeholder="留空則自動產生"
                                autoFocus
                                disabled={loading}
                                style={inputStyle}
                                onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'; }}
                                onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                            />
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6, marginBottom: 0 }}>
                                自訂號碼方便下次記住房間，留空會自動產生隨機號碼
                            </p>
                            {error && <p style={{ fontSize: 12, color: '#FF5E7A', marginTop: 4, marginBottom: 0 }}>{error}</p>}
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                style={{
                                    width: '100%', height: 48, borderRadius: 12, border: 'none',
                                    background: loading ? 'rgba(139,92,255,0.5)' : 'linear-gradient(135deg, #8B5CFF, #6B3FD4)',
                                    color: '#fff', fontSize: 15, fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,255,0.4)',
                                    marginTop: 16, transition: 'all 150ms',
                                }}
                            >
                                {loading ? '建立中...' : '建立房間'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};