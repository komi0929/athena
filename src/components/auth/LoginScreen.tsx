'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-provider';

export function LoginScreen() {
  const { signInWithX, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithX();
    } catch {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at 30% 20%, #0a0f2e 0%, #020408 60%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient stars */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 80 }).map((_, i) => {
          const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
          const rx = (x - Math.floor(x)) * 100;
          const y = Math.sin(i * 269.5 + 183.3) * 43758.5453;
          const ry = (y - Math.floor(y)) * 100;
          const s = Math.sin(i * 419.2 + 731.1) * 43758.5453;
          const size = ((s - Math.floor(s)) * 2 + 0.5);
          const d = Math.sin(i * 617.3 + 521.9) * 43758.5453;
          const duration = ((d - Math.floor(d)) * 3 + 2);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${rx}%`,
                top: `${ry}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: 'white',
                opacity: 0.15 + (size / 5) * 0.4,
                animation: `starPulse ${duration}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            fontSize: '42px',
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '0.4em',
            margin: 0,
            fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
            textShadow: '0 0 40px rgba(100, 160, 255, 0.15)',
          }}
        >
          ATHENA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.2)',
            letterSpacing: '0.2em',
            margin: '0 0 48px 0',
            fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
          }}
        >
          Living Curiosity Atlas
        </motion.p>

        {/* Sign in button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          onClick={handleSignIn}
          disabled={isLoading || isSigningIn}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 32px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(30, 60, 120, 0.25), rgba(20, 40, 80, 0.15))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(100, 160, 255, 0.15)',
            color: 'rgba(200, 220, 255, 0.9)',
            cursor: isSigningIn ? 'wait' : 'pointer',
            fontSize: '14px',
            fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
            letterSpacing: '0.1em',
            fontWeight: 400,
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
            boxShadow: '0 0 30px rgba(100, 160, 255, 0.05), inset 0 0 20px rgba(100, 160, 255, 0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)',
              animation: 'shimmerSlide 3s ease-in-out infinite',
            }}
          />

          {/* X logo */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>

          <span>
            {isSigningIn ? '接続中...' : 'Xでログイン'}
          </span>
        </motion.button>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.12)',
            letterSpacing: '0.08em',
            marginTop: '16px',
            textAlign: 'center',
            lineHeight: 1.8,
            fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
          }}
        >
          ブックマークを宇宙空間に可視化
          <br />
          知的好奇心の星座を描く
        </motion.p>
      </motion.div>

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes starPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes shimmerSlide {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}
