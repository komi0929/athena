'use client';

import React, { createContext, useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Bookmark, Cluster, CosmosState, SyncState } from './types';
import { generateMockData } from './mock-data';


// ═══ Constants ═══
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
    cooldownUntil: null, // No longer used, kept for type compat
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
        cooldownUntil: null, // Cooldown removed
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

// ═══ Compute clusters from bookmarks using simple k-means-like grouping ═══
function computeClusters(bookmarks: Bookmark[]): Cluster[] {
  if (bookmarks.length === 0) return [];

  // For small sets, create a single cluster
  if (bookmarks.length <= 5) {
    const cx = bookmarks.reduce((s, b) => s + b.pos_x, 0) / bookmarks.length;
    const cy = bookmarks.reduce((s, b) => s + b.pos_y, 0) / bookmarks.length;
    const cz = bookmarks.reduce((s, b) => s + b.pos_z, 0) / bookmarks.length;
    const maxDist = Math.max(...bookmarks.map(b =>
      Math.sqrt((b.pos_x - cx) ** 2 + (b.pos_y - cy) ** 2 + (b.pos_z - cz) ** 2)
    ));
    return [{
      id: 'cluster-0',
      label: 'ブックマーク',
      center_x: cx,
      center_y: cy,
      center_z: cz,
      radius: Math.max(maxDist + 5, 15),
    }];
  }

  // For larger sets, create a few clusters based on spatial distribution
  const cx = bookmarks.reduce((s, b) => s + b.pos_x, 0) / bookmarks.length;
  const cy = bookmarks.reduce((s, b) => s + b.pos_y, 0) / bookmarks.length;
  const cz = bookmarks.reduce((s, b) => s + b.pos_z, 0) / bookmarks.length;
  const maxDist = Math.max(...bookmarks.map(b =>
    Math.sqrt((b.pos_x - cx) ** 2 + (b.pos_y - cy) ** 2 + (b.pos_z - cz) ** 2)
  ));

  return [{
    id: 'cluster-0',
    label: '星雲',
    center_x: cx,
    center_y: cy,
    center_z: cz,
    radius: Math.max(maxDist + 5, 15),
  }];
}

// ═══ Load bookmarks from Supabase ═══
async function fetchBookmarksFromSupabase(): Promise<Bookmark[] | null> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();

    const { data: { session } } = await supabase.auth.getSession();
    console.log('[Cosmos] Session check:', session ? `user=${session.user.id}` : 'no session');
    if (!session) return null;

    // RLS policy already filters by user_id = auth.uid()
    // No need to explicitly filter by user_id
    const { data, error, count } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact' })
      .order('bookmarked_at', { ascending: false });

    console.log('[Cosmos] Supabase query result:', { count, error, rowCount: data?.length });

    if (error) {
      console.error('[Cosmos] Failed to fetch bookmarks:', error.message, error.details);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('[Cosmos] No bookmarks found in database');
      return null;
    }

    console.log('[Cosmos] First bookmark sample:', JSON.stringify(data[0]).slice(0, 200));

    // Map DB rows to Bookmark type
    return data.map((row: Record<string, unknown>) => ({
      id: String(row.id ?? row.tweet_id),
      tweet_id: String(row.tweet_id),
      tweet_url: String(row.tweet_url ?? ''),
      text: String(row.text ?? ''),
      author_name: String(row.author_name ?? 'Unknown'),
      author_handle: String(row.author_handle ?? '@unknown'),
      ogp_title: row.ogp_title ? String(row.ogp_title) : undefined,
      ogp_description: row.ogp_description ? String(row.ogp_description) : undefined,
      ogp_image: row.ogp_image ? String(row.ogp_image) : undefined,
      pos_x: Number(row.pos_x) || 0,
      pos_y: Number(row.pos_y) || 0,
      pos_z: Number(row.pos_z) || 0,
      is_read: Boolean(row.is_read),
      created_at: String(row.created_at ?? new Date().toISOString()),
      bookmarked_at: row.bookmarked_at ? String(row.bookmarked_at) : undefined,
      similarity_ids: [],
    }));
  } catch (e) {
    console.error('[Cosmos] Error loading bookmarks:', e);
    return null;
  }
}

export function CosmosProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CosmosState>(() => {
    // Start with mock data, will be replaced by real data on mount
    const { bookmarks, clusters } = generateMockData();
    return {
      bookmarks,
      clusters,
      selectedBookmark: null,
      hoveredBookmark: null,
      zoomLevel: 1,
      timeFilter: 1,
      audioEnabled: false,
      isLoading: true, // Start as loading
      sync: loadSyncState(),
    };
  });

  const [meteors, setMeteors] = useState<MeteorData[]>([]);
  const meteorIdRef = useRef(0);

  // ═══ Load real bookmarks from Supabase on mount ═══
  const loadRealBookmarks = useCallback(async () => {
    const realBookmarks = await fetchBookmarksFromSupabase();
    if (realBookmarks && realBookmarks.length > 0) {
      console.log(`[Cosmos] Loaded ${realBookmarks.length} bookmarks from Supabase`);
      const clusters = computeClusters(realBookmarks);
      setState(prev => ({
        ...prev,
        bookmarks: realBookmarks,
        clusters,
        isLoading: false,
      }));
    } else {
      // No real bookmarks — keep mock data for demo
      console.log('[Cosmos] No real bookmarks found, using mock data');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadRealBookmarks();
  }, [loadRealBookmarks]);

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

      // Set syncing state
      setState(prev => ({
        ...prev,
        sync: { ...prev.sync, isSyncing: true, syncError: null },
      }));

      try {
        const { createClient } = await import('./supabase');
        const { getStoredProviderToken } = await import('./auth-provider');
        const supabase = createClient();
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('未ログインです。再ログインしてください。');
        }

        // provider_token: prefer session (only available right after login),
        // then fall back to localStorage (persisted from login event)
        const providerToken = session.provider_token || getStoredProviderToken();
        if (!providerToken) {
          throw new Error('Xの接続が切れました。ログアウトして再度Xでログインしてください。');
        }

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            provider_token: providerToken,
          }),
        });

        const text = await response.text();
        let data: { error?: string; cooldownUntil?: string; newCount?: number } = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`API Proxy エラー (${response.status}): ${text.slice(0, 100)}`);
        }

        if (!response.ok) {
          if (data.error === 'cooldown' || data.cooldownUntil) {
            setState(prev => ({
              ...prev,
              sync: {
                ...prev.sync,
                isSyncing: false,
                cooldownUntil: data.cooldownUntil || null,
                syncError: null,
              },
            }));
            return;
          }
          throw new Error(data.error || '同期に失敗しました');
        }

        const now = new Date().toISOString();

        setState(prev => ({
          ...prev,
          sync: {
            lastSyncAt: now,
            cooldownUntil: null,
            isSyncing: false,
            lastSyncCount: data.newCount || 0,
            syncError: null,
          },
        }));

        // ═══ Reload bookmarks from Supabase after sync ═══
        await loadRealBookmarks();

        // If new bookmarks arrived, dispatch an event for visual feedback
        if ((data.newCount || 0) > 0) {
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
  }), [state.bookmarks, state.timeFilter, state.sync, loadRealBookmarks]);

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
