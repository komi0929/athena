'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCosmosStore } from '@/lib/cosmos-store';

export function TimelapseSlider() {
  const { timeFilter, actions, bookmarks } = useCosmosStore();
  const [isDragging, setIsDragging] = useState(false);

  const currentDate = useMemo(() => {
    const times = bookmarks.map(b => new Date(b.created_at).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    return new Date(minT + (maxT - minT) * timeFilter);
  }, [bookmarks, timeFilter]);

  const visibleCount = actions.getFilteredBookmarks().length;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setTimeFilter(parseFloat(e.target.value));
  }, [actions]);

  // Generate mini timeline dots
  const timelineDots = useMemo(() => {
    const months = new Set<string>();
    bookmarks.forEach(b => {
      const d = new Date(b.created_at);
      months.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    return Array.from(months).sort().map((_, i, arr) => ({
      position: (i / (arr.length - 1 || 1)) * 100,
    }));
  }, [bookmarks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 1.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: 'min(420px, calc(100vw - 48px))',
      }}
    >
      {/* Time info */}
      <motion.div
        animate={{ opacity: isDragging ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          fontFamily: 'var(--font-mono), monospace',
          letterSpacing: '0.05em',
        }}
      >
        <motion.span
          key={currentDate.toISOString().slice(0, 10)}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
        </motion.span>
        <span style={{ 
          color: isDragging ? 'rgba(100, 160, 255, 0.8)' : 'rgba(255, 255, 255, 0.35)',
          transition: 'color 0.3s',
        }}>
          {visibleCount} / {bookmarks.length} ✦
        </span>
      </motion.div>

      {/* Track container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Timeline dots */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
        }}>
          {timelineDots.map((dot, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${dot.position}%`,
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: dot.position / 100 <= timeFilter
                  ? 'rgba(100, 160, 255, 0.4)' 
                  : 'rgba(255, 255, 255, 0.1)',
                transform: 'translateX(-50%)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={timeFilter}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            width: '100%',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            height: '24px',
            position: 'relative',
            zIndex: 2,
          }}
        />
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg,
            rgba(100, 160, 255, 0.7) 0%,
            rgba(170, 68, 255, 0.5) ${timeFilter * 100}%,
            rgba(255, 255, 255, 0.06) ${timeFilter * 100}%,
            rgba(255, 255, 255, 0.06) 100%
          );
          border-radius: 2px;
          transition: background 0.1s;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, rgba(200, 220, 255, 1), rgba(100, 160, 255, 0.9));
          box-shadow: 
            0 0 6px rgba(100, 160, 255, 0.6),
            0 0 14px rgba(100, 160, 255, 0.3),
            0 0 28px rgba(100, 160, 255, 0.1);
          margin-top: -6px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s;
          animation: orbGlow 3s ease-in-out infinite;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 
            0 0 8px rgba(100, 160, 255, 0.8),
            0 0 20px rgba(100, 160, 255, 0.4),
            0 0 40px rgba(100, 160, 255, 0.2);
        }
        input[type="range"]::-moz-range-track {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, rgba(200, 220, 255, 1), rgba(100, 160, 255, 0.9));
          box-shadow: 
            0 0 6px rgba(100, 160, 255, 0.6),
            0 0 14px rgba(100, 160, 255, 0.3);
          border: none;
          cursor: pointer;
          animation: orbGlow 3s ease-in-out infinite;
        }
        input[type="range"]::-moz-range-progress {
          background: linear-gradient(90deg, rgba(100, 160, 255, 0.7), rgba(170, 68, 255, 0.5));
          height: 2px;
          border-radius: 2px;
        }
      `}</style>
    </motion.div>
  );
}
