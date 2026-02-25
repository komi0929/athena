'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Bookmark, Cluster, CosmosState, SyncState } from './types';
import { generateMockData } from './mock-data';
import { createClient } from './supabase';

// ═══ Constants ═══
const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;
const LOCALSTORAGE_SYNC_KEY = 'athena_last_sync';

interface CosmosActions {
  selectBookmark: (bookmark: Bookmark | null) => void;
  hoverBookmark: (bookmark: Bookmark | null) => void;
  markAsRead: (id: string) => void;
  setZoomLevel: (level: number) => void;
  setTimeFilter: (value: number) => void;
  toggleAudio: () => void;
  addMeteor: (from: [number, number, number], to: [number, number, number]) => void;
  getFilteredBookmarks: () => Bookmark[];
  getSimilarBookmarks: (bookmark: Bookmark) => Bookmark[];
  // Sync actions
  syncBookmarks: () => Promise<void>;
  getSyncState: () => SyncState;
}

interface MeteorData {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  startTime: number;
}

interface CosmosContextType extends CosmosState {
  actions: CosmosActions;
  meteors: MeteorData[];
}

const CosmosContext = createContext<CosmosContextType | null>(null);

export function useCosmosStore() {
  const ctx = useContext(CosmosContext);
  if (!ctx) throw new Error('useCosmosStore must be used within CosmosProvider');
  return ctx;
}

// Load cooldown state from localStorage
function loadSyncState(): SyncState {
  const defaultState: SyncState = {
    lastSyncAt: null,
    cooldownUntil: null,
    isSyncing: false,
    lastSyncCount: 0,
    syncError: null,
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const stored = localStorage.getItem(LOCALSTORAGE_SYNC_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultState,
        lastSyncAt: parsed.lastSyncAt || null,
        cooldownUntil: parsed.cooldownUntil || null,
        lastSyncCount: parsed.lastSyncCount || 0,
      };
    }
  } catch {
    // ignore parse errors
  }
  return defaultState;
}

function saveSyncState(sync: SyncState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALSTORAGE_SYNC_KEY, JSON.stringify({
      lastSyncAt: sync.lastSyncAt,
      cooldownUntil: sync.cooldownUntil,
      lastSyncCount: sync.lastSyncCount,
    }));
  } catch {
    // ignore
  }
}

export function CosmosProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CosmosState>(() => {
    const { bookmarks, clusters } = generateMockData();
    return {
      bookmarks,
      clusters,
      selectedBookmark: null,
      hoveredBookmark: null,
      zoomLevel: 1,
      timeFilter: 1,
      audioEnabled: false,
      isLoading: false,
      sync: loadSyncState(),
    };
  });

  const [meteors, setMeteors] = useState<MeteorData[]>([]);
  const meteorIdRef = useRef(0);

  // Persist sync state changes
  useEffect(() => {
    saveSyncState(state.sync);
  }, [state.sync]);

  const actions = useMemo<CosmosActions>(() => ({
    selectBookmark: (bookmark) => {
      setState(prev => ({ ...prev, selectedBookmark: bookmark }));
      if (bookmark) {
        setState(prev => ({
          ...prev,
          bookmarks: prev.bookmarks.map(b =>
            b.id === bookmark.id ? { ...b, is_read: true } : b
          ),
        }));
      }
    },
    hoverBookmark: (bookmark) => {
      setState(prev => ({ ...prev, hoveredBookmark: bookmark }));
    },
    markAsRead: (id) => {
      setState(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.map(b =>
          b.id === id ? { ...b, is_read: true } : b
        ),
      }));
    },
    setZoomLevel: (level) => {
      setState(prev => ({ ...prev, zoomLevel: level }));
    },
    setTimeFilter: (value) => {
      setState(prev => ({ ...prev, timeFilter: value }));
    },
    toggleAudio: () => {
      setState(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }));
    },
    addMeteor: (from, to) => {
      const id = `meteor-${meteorIdRef.current++}`;
      const meteor: MeteorData = { id, from, to, startTime: Date.now() };
      setMeteors(prev => [...prev, meteor]);
      setTimeout(() => {
        setMeteors(prev => prev.filter(m => m.id !== id));
      }, 2000);
    },
    getFilteredBookmarks: () => {
      if (state.timeFilter >= 1) return state.bookmarks;
      const dates = state.bookmarks.map(b => new Date(b.created_at).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const cutoff = minDate + (maxDate - minDate) * state.timeFilter;
      return state.bookmarks.filter(b => new Date(b.created_at).getTime() <= cutoff);
    },
    getSimilarBookmarks: (bookmark) => {
      if (!bookmark.similarity_ids) return [];
      return state.bookmarks.filter(b => bookmark.similarity_ids?.includes(b.id));
    },

    // ═══ Manual Sync ═══
    syncBookmarks: async () => {
      // Check cooldown
      if (state.sync.cooldownUntil) {
        const cooldownEnd = new Date(state.sync.cooldownUntil).getTime();
        if (Date.now() < cooldownEnd) {
          return; // Still in cooldown
        }
      }

      // Set syncing state
      setState(prev => ({
        ...prev,
        sync: { ...prev.sync, isSyncing: true, syncError: null },
      }));

      try {
        // Use Supabase client's functions.invoke() — handles JWT auth automatically
        const supabase = createClient();
        const { data, error } = await supabase.functions.invoke('sync-x-bookmarks', {
          method: 'POST',
        });

        if (error) {
          // Extract the actual error body from the Edge Function response
          let errorBody: Record<string, unknown> | null = null;
          try {
            // FunctionsHttpError has context with the response
            if ('context' in error && error.context instanceof Response) {
              errorBody = await error.context.json();
            }
          } catch {
            // Ignore JSON parse errors
          }
          
          const errorMsg = errorBody?.error as string 
            || data?.error as string 
            || error.message 
            || '同期に失敗しました';

          // Check if it's a cooldown error
          const cooldownUntil = (errorBody?.cooldownUntil || data?.cooldownUntil) as string | undefined;
          if (errorMsg.includes('cooldown') || errorBody?.error === 'cooldown' || data?.error === 'cooldown') {
            setState(prev => ({
              ...prev,
              sync: {
                ...prev.sync,
                isSyncing: false,
                cooldownUntil: cooldownUntil || null,
                syncError: null,
              },
            }));
            return;
          }
          throw new Error(errorMsg);
        }

        if (data?.error === 'cooldown') {
          setState(prev => ({
            ...prev,
            sync: {
              ...prev.sync,
              isSyncing: false,
              cooldownUntil: data.cooldownUntil,
              syncError: null,
            },
          }));
          return;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const now = new Date().toISOString();
        const cooldownUntil = data.cooldownUntil || new Date(Date.now() + COOLDOWN_MS).toISOString();

        setState(prev => ({
          ...prev,
          sync: {
            lastSyncAt: now,
            cooldownUntil,
            isSyncing: false,
            lastSyncCount: data.newCount || 0,
            syncError: null,
          },
        }));

        // If new bookmarks arrived, dispatch an event for visual feedback
        if (data.newCount > 0) {
          window.dispatchEvent(new CustomEvent('athena-new-stars', {
            detail: { count: data.newCount },
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          sync: {
            ...prev.sync,
            isSyncing: false,
            syncError: error instanceof Error ? error.message : '同期エラー',
          },
        }));
      }
    },

    getSyncState: () => state.sync,
  }), [state.bookmarks, state.timeFilter, state.sync]);

  // Remove expired meteors
  useEffect(() => {
    if (meteors.length === 0) return;
    const timer = setInterval(() => {
      setMeteors(prev => prev.filter(m => Date.now() - m.startTime < 2000));
    }, 100);
    return () => clearInterval(timer);
  }, [meteors.length]);

  const value = useMemo(() => ({
    ...state,
    actions,
    meteors,
  }), [state, actions, meteors]);

  return (
    <CosmosContext.Provider value={value}>
      {children}
    </CosmosContext.Provider>
  );
}
