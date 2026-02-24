'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCosmosStore } from '@/lib/cosmos-store';

export function AudioManager() {
  const { audioEnabled, actions } = useCosmosStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<GainNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Brownian noise — soft cosmic ambience
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = i > 0 ? data[i - 1] + white * 0.02 : 0;
        data[i] = Math.max(-1, Math.min(1, data[i]));
      }
      const max = Math.max(...Array.from(data).map(Math.abs));
      if (max > 0) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 0.8;

    // Add subtle harmonic resonance
    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.value = 55; // Low A
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.005;
    harmonic.connect(harmonicGain);

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    harmonicGain.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    harmonic.start();

    ambientNodeRef.current = gain;
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!ambientNodeRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const gain = ambientNodeRef.current;
    const currentTime = ctx.currentTime;

    if (audioEnabled) {
      ctx.resume();
      gain.gain.cancelScheduledValues(currentTime);
      gain.gain.setValueAtTime(gain.gain.value, currentTime);
      gain.gain.linearRampToValueAtTime(0.06, currentTime + 1);
    } else {
      gain.gain.cancelScheduledValues(currentTime);
      gain.gain.setValueAtTime(gain.gain.value, currentTime);
      gain.gain.linearRampToValueAtTime(0, currentTime + 0.5);
    }
  }, [audioEnabled]);

  const playTapSound = useCallback(() => {
    if (!audioContextRef.current || !audioEnabled) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }, [audioEnabled]);

  useEffect(() => {
    const handler = () => playTapSound();
    window.addEventListener('athena-star-click', handler);
    return () => window.removeEventListener('athena-star-click', handler);
  }, [playTapSound]);

  const handleToggle = useCallback(() => {
    if (!isInitialized) {
      initAudio();
    }
    actions.toggleAudio();
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 800);
  }, [actions, initAudio, isInitialized]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
      }}
    >
      {/* Ripple effect */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(100, 200, 255, 0.4)',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        onClick={handleToggle}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: audioEnabled
            ? 'linear-gradient(135deg, rgba(100, 200, 255, 0.15), rgba(100, 160, 255, 0.08))'
            : 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${audioEnabled ? 'rgba(100, 200, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
          color: audioEnabled ? 'rgba(100, 200, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: audioEnabled
            ? '0 0 12px rgba(100, 200, 255, 0.15), inset 0 0 8px rgba(100, 200, 255, 0.05)'
            : 'none',
          position: 'relative',
        }}
        whileHover={{ scale: 1.1, borderColor: 'rgba(100, 200, 255, 0.3)' }}
        whileTap={{ scale: 0.92 }}
        title={audioEnabled ? '環境音を停止' : '環境音を再生'}
      >
        {/* Audio waveform visualization */}
        {audioEnabled ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.9 }}>
            <path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2;M3 11v2M7 8v8M11 6v12M15 7v10M19 9v6;M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2" />
            </path>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5 }}>
            <path d="M3 12h0M7 12h0M11 12h0M15 12h0M19 12h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
