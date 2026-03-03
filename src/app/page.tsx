'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-provider';
import { CosmosProvider } from '@/lib/cosmos-store';
import { DetailCard } from '@/components/ui/DetailCard';
import { AudioManager } from '@/components/audio/AudioManager';
import { SyncButton } from '@/components/ui/SyncButton';
import { OnboardingGuide } from '@/components/ui/OnboardingGuide';
import { LoginScreen } from '@/components/auth/LoginScreen';

const CosmosCanvas = dynamic(
  () => import('@/components/cosmos/CosmosCanvas').then(mod => ({ default: mod.CosmosCanvas })),
  { ssr: false }
);

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function AthenaApp() {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#000005',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '18px',
            letterSpacing: '0.4em',
            fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
          }}
        >
          ATHENA
        </motion.div>
      </div>
    );
  }

  // Not logged in — show login screen
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in — show cosmos
  return (
    <CosmosProvider>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: '#000005',
          position: 'relative',
        }}
      >
        {/* 3D Cosmos */}
        <CosmosCanvas />

        {/* UI Overlays */}
        <DetailCard />
        <AudioManager />
        <SyncButton />
        <OnboardingGuide />

        {/* User avatar — sign out */}
        <UserBadge />

        {/* Logo / Title — with breathing glow */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          style={{
            position: 'fixed',
            top: '22px',
            left: '26px',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '0.35em',
              margin: 0,
              fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
              animation: 'logoGlow 4s ease-in-out infinite',
            }}
          >
            ATHENA
          </h1>
          <motion.p
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
            transition={{ delay: 1.5, duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
            style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.18)',
              margin: '3px 0 0 0',
              letterSpacing: '0.18em',
              fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
            }}
          >
            Living Curiosity Atlas
          </motion.p>
        </motion.div>

        {/* Warp-in Entry Effect */}
        <WarpEntry />

        {/* Supernova exit overlay */}
        <SupernovaExit />

        {/* Info hint — typewriter style */}
        <HintOverlay />
      </div>
    </CosmosProvider>
  );
}

// ═══ User Badge (top-right) ═══
function UserBadge() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const userName = user.user_metadata?.full_name || user.user_metadata?.user_name || 'User';

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'アカウント削除に失敗しました');
        setIsDeleting(false);
        return;
      }
      // Clear local storage
      try {
        localStorage.removeItem('athena_x_provider_token');
        localStorage.removeItem('athena_last_sync');
        localStorage.removeItem('athena_user_categories');
        localStorage.removeItem('athena_onboarding_seen');
      } catch { /* ignore */ }
      // Trigger supernova then sign out
      triggerSupernova(() => signOut());
    } catch {
      alert('アカウント削除中にエラーが発生しました');
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 80,
      }}
    >
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        onClick={() => { setMenuOpen(!menuOpen); setShowDeleteConfirm(false); }}
        aria-label="ユーザーメニュー"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid rgba(100, 160, 255, 0.4)',
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : 'linear-gradient(135deg, rgba(60, 120, 200, 0.5), rgba(100, 60, 200, 0.4))',
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: '0 0 12px rgba(100, 160, 255, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.1)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(100, 160, 255, 0.4)' }}
      >
        {!avatarUrl && (
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: 600 }}>
            {userName.charAt(0).toUpperCase()}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '42px',
              right: 0,
              background: 'rgba(6, 10, 24, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
              minWidth: '180px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            <p style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0 0 10px 0',
              fontFamily: "var(--font-space), sans-serif",
              letterSpacing: '0.05em',
            }}>
              {userName}
            </p>

            {/* Logout button */}
            <button
              onClick={() => {
                setMenuOpen(false);
                triggerSupernova(() => signOut());
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "var(--font-space), sans-serif",
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              ログアウト
            </button>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: 'rgba(255, 255, 255, 0.06)',
              margin: '6px 0',
            }} />

            {/* Delete account button */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 80, 80, 0.6)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: "var(--font-space), sans-serif",
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 80, 80, 0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                アカウント削除
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ overflow: 'hidden' }}
              >
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255, 100, 100, 0.8)',
                  margin: '4px 0 8px 0',
                  lineHeight: '1.5',
                }}>
                  ⚠️ すべてのブックマークとデータが完全に削除されます。この操作は取り消せません。
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: "var(--font-space), sans-serif",
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '8px',
                      background: isDeleting ? 'rgba(255, 80, 80, 0.1)' : 'rgba(255, 80, 80, 0.15)',
                      border: '1px solid rgba(255, 80, 80, 0.3)',
                      color: isDeleting ? 'rgba(255, 80, 80, 0.4)' : 'rgba(255, 80, 80, 0.9)',
                      cursor: isDeleting ? 'wait' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "var(--font-space), sans-serif",
                    }}
                  >
                    {isDeleting ? '削除中...' : '削除する'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══ Supernova Exit Effect ═══
// Triggers a brilliant star-flash → blackout before signOut/delete actions

let _supernovaResolve: (() => void) | null = null;

function triggerSupernova(onComplete: () => void) {
  window.dispatchEvent(new CustomEvent('athena-supernova-exit'));
  // Wait for animation (2s) then execute callback
  _supernovaResolve = onComplete;
}

function SupernovaExit() {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setActive(true);
    window.addEventListener('athena-supernova-exit', handler);
    return () => window.removeEventListener('athena-supernova-exit', handler);
  }, []);

  React.useEffect(() => {
    if (!active) return;
    // After 2s animation, fire callback
    const timer = setTimeout(() => {
      if (_supernovaResolve) {
        _supernovaResolve();
        _supernovaResolve = null;
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return <div className="supernova-exit" />;
}

// ═══ Warp Entry ═══
function WarpEntry() {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const streaks = React.useMemo(() =>
    Array.from({ length: 30 }, (__, idx) => ({
      left: `${seededRand(idx * 3) * 100}%`,
      height: `${10 + seededRand(idx * 3 + 1) * 30}px`,
      delay: `${seededRand(idx * 3 + 2) * 0.5}s`,
      opacity: 0.3 + seededRand(idx * 5) * 0.7,
      top: `${50 + seededRand(idx * 7) * 50}%`,
    }))
  , []);

  if (!visible) return null;

  return (
    <div className="warp-overlay">
      {streaks.map((streak, i) => (
        <div
          key={i}
          className="star-streak"
          style={{
            left: streak.left,
            height: streak.height,
            top: streak.top,
            animationDelay: streak.delay,
            opacity: streak.opacity,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200vmax',
          height: '200vmax',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(150, 180, 255, 0.15) 0%, transparent 50%)',
          animation: 'warpFade 2.5s ease-out forwards',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ═══ Hint Overlay ═══
function HintOverlay() {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ delay: 2.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            color: 'rgba(255, 255, 255, 0.25)',
            fontSize: '12px',
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
            letterSpacing: '0.12em',
          }}
        >
          <span style={{ color: 'rgba(100, 160, 255, 0.35)' }}>✦</span>
          {' '}スクロールでズーム ・ ドラッグで回転 ・ 星をクリックで詳細{' '}
          <span style={{ color: 'rgba(100, 160, 255, 0.35)' }}>✦</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
