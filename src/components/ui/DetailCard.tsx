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
            bottom: '20px',
            left: '16px',
            right: '16px',
            zIndex: 100,
            maxWidth: '420px',
            margin: '0 auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Aurora animated border wrapper */}
          <div
            style={{
              padding: '1px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4488ff, #aa44ff, #44ddff, #ff66aa, #4488ff)',
              backgroundSize: '300% 300%',
              animation: 'auroraBorder 6s ease infinite',
              position: 'relative',
            }}
          >
            <div
              style={{
                background: 'rgba(6, 10, 24, 0.92)',
                backdropFilter: 'blur(32px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
                borderRadius: '19px',
                padding: '18px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                maxHeight: 'calc(100dvh - 120px)',
                overflowY: 'auto',
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
                aria-label="カードを閉じる"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  zIndex: 2,
                }}
              >
                ✕
              </motion.button>

              {/* Author info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingRight: '36px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    minWidth: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4488ff, #aa44ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 0 10px rgba(100, 130, 255, 0.3)',
                    fontFamily: 'var(--font-space), var(--font-inter), sans-serif',
                  }}
                >
                  {selectedBookmark.author_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    lineHeight: '1.3',
                    fontFamily: 'var(--font-space), var(--font-inter), sans-serif',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedBookmark.author_name}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.35)',
                    lineHeight: '1.2',
                    fontFamily: 'var(--font-mono), monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedBookmark.author_handle}
                  </div>
                </div>
              </div>

              {/* Tweet text */}
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: '1.75',
                  color: 'rgba(255, 255, 255, 0.88)',
                  margin: '0 0 12px 0',
                  letterSpacing: '0.02em',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
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
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(100, 170, 255, 0.9)',
                      marginBottom: selectedBookmark.ogp_description ? '4px' : 0,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      wordBreak: 'break-word',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ minWidth: 12, marginTop: 2 }}>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>{selectedBookmark.ogp_title}</span>
                  </div>
                  {selectedBookmark.ogp_description && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {selectedBookmark.ogp_description}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Metadata + X link row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontFamily: 'var(--font-mono), monospace',
                    whiteSpace: 'nowrap',
                  }}>
                    {new Date(selectedBookmark.created_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: selectedBookmark.is_read
                        ? 'rgba(100, 200, 255, 0.1)'
                        : 'rgba(255, 170, 100, 0.1)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      color: selectedBookmark.is_read
                        ? 'rgba(100, 200, 255, 0.7)'
                        : 'rgba(255, 170, 100, 0.7)',
                      fontSize: '9px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedBookmark.is_read ? '✦ 既読' : '✧ 未読'}
                  </span>
                </div>

                {/* X link button — compact */}
                <motion.a
                  href={selectedBookmark.tweet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '12px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-space), var(--font-inter), sans-serif',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Xで見る
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
