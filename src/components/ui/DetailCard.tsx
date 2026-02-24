'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCosmosStore } from '@/lib/cosmos-store';

export function DetailCard() {
  const { selectedBookmark, actions } = useCosmosStore();

  return (
    <AnimatePresence>
      {selectedBookmark && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            maxWidth: '480px',
            width: 'calc(100% - 32px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Aurora animated border wrapper */}
          <div
            style={{
              padding: '1px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #4488ff, #aa44ff, #44ddff, #ff66aa, #4488ff)',
              backgroundSize: '300% 300%',
              animation: 'auroraBorder 6s ease infinite',
              position: 'relative',
            }}
          >
            <div
              style={{
                background: 'rgba(6, 10, 24, 0.82)',
                backdropFilter: 'blur(32px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
                borderRadius: '21px',
                padding: '24px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer effect overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-50%',
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)',
                  animation: 'shimmer 4s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />

              {/* Top accent gradient */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(100, 160, 255, 0.5), rgba(170, 68, 255, 0.5), transparent)',
                }}
              />

              {/* Close button */}
              <motion.button
                onClick={() => actions.selectBookmark(null)}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  transition: 'color 0.2s',
                }}
              >
                ✕
              </motion.button>

              {/* Author info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, #4488ff, #aa44ff)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 0 12px rgba(100, 130, 255, 0.3), inset 0 0 6px rgba(255, 255, 255, 0.15)',
                    fontFamily: 'var(--font-space), var(--font-inter), sans-serif',
                  }}
                >
                  {selectedBookmark.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '1.3',
                    fontFamily: 'var(--font-space), var(--font-inter), sans-serif',
                  }}>
                    {selectedBookmark.author_name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.35)',
                    lineHeight: '1.2',
                    fontFamily: 'var(--font-mono), monospace',
                  }}>
                    {selectedBookmark.author_handle}
                  </div>
                </div>
              </div>

              {/* Tweet text */}
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: 'rgba(255, 255, 255, 0.88)',
                  margin: '0 0 16px 0',
                  letterSpacing: '0.02em',
                }}
              >
                {selectedBookmark.text}
              </p>

              {/* OGP card */}
              {selectedBookmark.ogp_title && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(100, 160, 255, 0.06), rgba(170, 68, 255, 0.04))',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '14px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(100, 170, 255, 0.9)',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {selectedBookmark.ogp_title}
                  </div>
                  {selectedBookmark.ogp_description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        lineHeight: '1.5',
                      }}
                    >
                      {selectedBookmark.ogp_description}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Metadata */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  marginBottom: '14px',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {new Date(selectedBookmark.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: selectedBookmark.is_read
                      ? 'rgba(100, 200, 255, 0.1)'
                      : 'rgba(255, 170, 100, 0.1)',
                    borderRadius: '8px',
                    padding: '3px 10px',
                    color: selectedBookmark.is_read
                      ? 'rgba(100, 200, 255, 0.7)'
                      : 'rgba(255, 170, 100, 0.7)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                  }}
                >
                  {selectedBookmark.is_read ? '✦ 既読' : '✧ 未読'}
                </span>
              </div>

              {/* X link button */}
              <motion.a
                href={selectedBookmark.tweet_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '13px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                  fontFamily: 'var(--font-space), var(--font-inter), sans-serif',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Xで見る
              </motion.a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
