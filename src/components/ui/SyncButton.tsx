'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCosmosStore } from '@/lib/cosmos-store';

// Telescope SVG icon
function TelescopeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 21l3-9" />
      <path d="M12 21l-3-9" />
      <path d="M3 7l6 4 5-8" />
      <path d="M14 3l7 4.5-5 8" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <path d="M20.5 5.5l1.5-1.5" opacity="0.5" />
      <path d="M21 3l1.5 0.5" opacity="0.3" />
    </svg>
  );
}

export function SyncButton() {
  const { sync, actions } = useCosmosStore();
  const [isHovered, setIsHovered] = useState(false);

  const canSync = !sync.isSyncing;

  // Show result toast
  const showResult = sync.lastSyncCount > 0 && !sync.isSyncing;
  const [resultVisible, setResultVisible] = useState(false);
  const prevSyncingRef = React.useRef(sync.isSyncing);

  useEffect(() => {
    // Detect transition from syncing → done with new results
    if (prevSyncingRef.current && !sync.isSyncing && sync.lastSyncCount > 0) {
      setResultVisible(true);
      const timer = setTimeout(() => setResultVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    prevSyncingRef.current = sync.isSyncing;
  }, [sync.isSyncing, sync.lastSyncCount]);

  // Auto-dismiss error toast
  const [errorVisible, setErrorVisible] = useState(false);
  useEffect(() => {
    if (sync.syncError) {
      setErrorVisible(true);
      const timer = setTimeout(() => setErrorVisible(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setErrorVisible(false);
    }
  }, [sync.syncError]);

  const handleSync = useCallback(async () => {
    if (!canSync) return;
    await actions.syncBookmarks();
  }, [canSync, actions]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '28px',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      {/* Result toast */}
      <AnimatePresence>
        {resultVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{
              background: 'rgba(6, 10, 24, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(100, 255, 180, 0.2)',
              borderRadius: '14px',
              padding: '10px 16px',
              color: 'rgba(100, 255, 180, 0.9)',
              fontSize: '12px',
              fontFamily: "var(--font-space), 'Inter', sans-serif",
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 20px rgba(100, 255, 180, 0.08)',
            }}
          >
            ✦ {sync.lastSyncCount}個の新しい星を発見
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync error toast */}
      <AnimatePresence>
        {errorVisible && sync.syncError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'rgba(6, 10, 24, 0.75)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 100, 100, 0.2)',
              borderRadius: '14px',
              padding: '10px 16px',
              color: 'rgba(255, 100, 100, 0.9)',
              fontSize: '11px',
              maxWidth: '320px',
            }}
          >
            {sync.syncError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        onClick={handleSync}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={!canSync}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '16px',
          background: canSync
            ? 'linear-gradient(135deg, rgba(60, 120, 200, 0.12), rgba(60, 120, 200, 0.05))'
            : 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${
            sync.isSyncing
              ? 'rgba(100, 200, 255, 0.3)'
              : canSync
              ? 'rgba(100, 160, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.05)'
          }`,
          color: canSync
            ? 'rgba(160, 200, 255, 0.85)'
            : 'rgba(255, 255, 255, 0.25)',
          cursor: canSync ? 'pointer' : 'default',
          fontSize: '12px',
          fontFamily: "var(--font-space), 'Inter', sans-serif",
          letterSpacing: '0.08em',
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: canSync && isHovered
            ? '0 0 20px rgba(100, 160, 255, 0.12), inset 0 0 10px rgba(100, 160, 255, 0.03)'
            : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
        whileHover={canSync ? { scale: 1.03, y: -1 } : undefined}
        whileTap={canSync ? { scale: 0.97 } : undefined}
      >
        {/* Syncing animation */}
        {sync.isSyncing && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(100, 160, 255, 0.06), transparent)',
              borderRadius: '16px',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Icon */}
        <motion.div
          animate={sync.isSyncing ? { rotate: [0, 15, -15, 0] } : {}}
          transition={sync.isSyncing ? { duration: 1.5, repeat: Infinity } : {}}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <TelescopeIcon size={16} />
        </motion.div>

        {/* Label */}
        <span>
          {sync.isSyncing ? '天体観測中...' : '星空を更新'}
        </span>
      </motion.button>

      {/* Cost info */}
      <AnimatePresence>
        {isHovered && canSync && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.15)',
              paddingLeft: '18px',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-mono), monospace',
            }}
          >
            最新20件を取得 • ≈¥15/回
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
