/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCosmosStore } from '@/lib/cosmos-store';

const ONBOARDED_KEY = 'athena_onboarded';

export function OnboardingGuide() {
  const { bookmarks, isLoading } = useCosmosStore();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (typeof window === 'undefined') return;
    const alreadyOnboarded = localStorage.getItem(ONBOARDED_KEY);
    if (alreadyOnboarded) return;

    const hasMockOnly = bookmarks.length === 0 || bookmarks.every(b => b.id.startsWith('bm-'));
    if (hasMockOnly) {
      setVisible(true);
    }
  }, [bookmarks, isLoading]);

  // Listen for successful sync — dismiss onboarding
  useEffect(() => {
    const onNewStars = () => {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setVisible(false);
    };
    window.addEventListener('athena-new-stars', onNewStars);
    return () => window.removeEventListener('athena-new-stars', onNewStars);
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={dismiss}
        >
          {/* Translucent backdrop */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,5,0.6) 100%)',
          }} />

          {/* Center message */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 3.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              maxWidth: '380px',
              padding: '32px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.8, duration: 0.6 }}
              >
                <div style={{
                  fontSize: '40px',
                  marginBottom: '16px',
                }}>🌌</div>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.85)',
                  letterSpacing: '0.08em',
                  margin: '0 0 12px 0',
                  fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
                }}>
                  ようこそ、Athenaへ
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.45)',
                  lineHeight: 1.7,
                  margin: '0 0 24px 0',
                  fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
                }}>
                  あなたのXブックマークが<br />美しい星空になります。
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(1)}
                  style={{
                    padding: '10px 28px',
                    borderRadius: '24px',
                    border: '1px solid rgba(100, 160, 255, 0.3)',
                    background: 'rgba(100, 160, 255, 0.1)',
                    color: 'rgba(180, 210, 255, 0.9)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
                    letterSpacing: '0.05em',
                  }}
                >
                  はじめる
                </motion.button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.8,
                  margin: '0 0 20px 0',
                  fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
                }}>
                  画面左下の<br />
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: 'rgba(100, 160, 255, 0.15)',
                    border: '1px solid rgba(100, 160, 255, 0.3)',
                    color: 'rgba(180, 210, 255, 0.9)',
                    fontSize: '12px',
                    margin: '8px 0',
                  }}>
                    ✦ 星空を更新
                  </span>
                  <br />をタップしてください
                </p>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  margin: '0 0 20px 0',
                  fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
                }}>
                  最新30件のブックマークを読み込みます
                </p>

                {/* Arrow pointing to bottom-left */}
                <motion.div
                  animate={{
                    x: [-5, 5, -5],
                    y: [5, -5, 5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    position: 'fixed',
                    bottom: '55px',
                    left: '140px',
                    fontSize: '28px',
                    color: 'rgba(100, 160, 255, 0.7)',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 0 8px rgba(100, 160, 255, 0.4))',
                  }}
                >
                  ↙
                </motion.div>

                <button
                  onClick={dismiss}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
                  }}
                >
                  スキップ
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
