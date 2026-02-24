'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-provider';
import { CosmosProvider } from '@/lib/cosmos-store';
import { DetailCard } from '@/components/ui/DetailCard';
import { TimelapseSlider } from '@/components/ui/TimelapseSlider';
import { AudioManager } from '@/components/audio/AudioManager';
import { SyncButton } from '@/components/ui/SyncButton';
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
        <TimelapseSlider />
        <AudioManager />
        <SyncButton />

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

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const userName = user.user_metadata?.full_name || user.user_metadata?.user_name || 'User';

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
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="ユーザーメニュー"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : 'linear-gradient(135deg, rgba(60, 120, 200, 0.3), rgba(60, 80, 140, 0.2))',
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: '0 0 15px rgba(100, 160, 255, 0.08)',
          transition: 'border-color 0.3s',
        }}
        whileHover={{ scale: 1.08 }}
      >
        {!avatarUrl && (
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
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
              minWidth: '160px',
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
            <button
              onClick={async () => {
                setMenuOpen(false);
                await signOut();
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
                color: 'rgba(255, 100, 120, 0.7)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "var(--font-space), sans-serif",
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 100, 120, 0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ログアウト
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
