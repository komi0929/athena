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
  hideBookmark: (id: string) => Promise<void>;
  setZoomLevel: (level: number) => void;
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

// ═══ Dynamic Category System ═══
const CATEGORIES_STORAGE_KEY = 'athena_user_categories';

interface CategoryDef {
  label: string;
  center: number[];
  keywords: string[];
}

// Default fallback categories
const DEFAULT_CATEGORIES: CategoryDef[] = [
  { label: 'テクノロジー', center: [-45, 15, -10], keywords: ['react', 'next', 'vue', 'css', 'javascript', 'typescript', 'api', 'web', 'node', 'vercel', 'github'] },
  { label: 'AI・機械学習', center: [40, -10, 25], keywords: ['ai', 'ml', 'llm', 'gpt', 'openai', 'gemini', 'claude', 'chatgpt', '機械学習', 'rag', 'agent', 'prompt'] },
  { label: 'デザイン', center: [-15, -35, -35], keywords: ['design', 'デザイン', 'figma', 'ui', 'ux', 'typography', 'color', 'animation', 'font'] },
  { label: 'ビジネス', center: [35, 30, -30], keywords: ['startup', 'スタートアップ', 'vc', 'saas', 'growth', 'product', 'business', 'ビジネス', 'marketing'] },
  { label: '暮らし', center: [-5, 40, 40], keywords: ['life', '暮らし', '生活', '思考', 'productivity', 'habit', 'book', '読書', 'health', '健康', 'investment'] },
  { label: 'その他', center: [0, -40, 0], keywords: [] },
];

function loadCategoryDefs(): CategoryDef[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_CATEGORIES;
}

function saveCategoryDefs(categories: CategoryDef[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch { /* ignore */ }
}

// Fetch AI-generated categories from /api/categorize
async function fetchAICategories(bookmarkTexts: string[]): Promise<CategoryDef[] | null> {
  try {
    const res = await fetch('/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: bookmarkTexts }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.categories && Array.isArray(data.categories)) {
      console.log(`[Cosmos] AI categories (${data.source}):`, data.categories.map((c: CategoryDef) => c.label).join(', '));
      return data.categories;
    }
  } catch (e) {
    console.error('[Cosmos] Failed to fetch AI categories:', e);
  }
  return null;
}

// ═══ Classify a bookmark into a category ═══
function classifyBookmark(bm: Bookmark, categories: CategoryDef[]): number {
  const text = `${bm.text} ${bm.ogp_title || ''} ${bm.ogp_description || ''}`.toLowerCase();
  let bestScore = 0;
  let bestIdx = -1;

  for (let i = 0; i < categories.length; i++) {
    if (!categories[i].keywords || categories[i].keywords.length === 0) continue;
    let score = 0;
    for (const kw of categories[i].keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  // If no category matched, assign to "その他" (last category) or -1
  if (bestIdx === -1) {
    const otherIdx = categories.findIndex(c => c.label === 'その他');
    return otherIdx >= 0 ? otherIdx : categories.length - 1;
  }
  return bestIdx;
}

// ═══ Simple seeded random for positioning ═══
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function gaussianRand(mean: number, std: number, seed: number) {
  const u1 = seededRandom(seed) + 0.001;
  const u2 = seededRandom(seed + 0.5);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

// ═══ Compute clusters from bookmarks — keyword-based categorization ═══
function computeClusters(bookmarks: Bookmark[], categories: CategoryDef[]): { clusters: Cluster[]; repositioned: Bookmark[] } {
  if (bookmarks.length === 0) return { clusters: [], repositioned: [] };

  // Classify each bookmark
  const assignments: number[] = bookmarks.map(bm => classifyBookmark(bm, categories));

  // Group bookmarks by category
  const groups: Map<number, Bookmark[]> = new Map();
  for (let i = 0; i < bookmarks.length; i++) {
    const cat = assignments[i];
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(bookmarks[i]);
  }
  
  const clusters: Cluster[] = [];
  const repositioned: Bookmark[] = [];

  // Process each category that has bookmarks
  for (const [catIdx, catBookmarks] of groups) {
    const center = categories[catIdx]?.center || [0, -40, 0];
    const label = categories[catIdx]?.label || 'その他';
    const clusterId = `cluster-${catIdx}`;

    // Reposition bookmarks around cluster center with Gaussian spread
    const spread = Math.max(8, catBookmarks.length * 1.5); // Larger groups spread more
    const bmIds: string[] = [];

    for (let i = 0; i < catBookmarks.length; i++) {
      const bm = catBookmarks[i];
      const seed = parseInt(bm.tweet_id.slice(-6), 10) || (i * 137);
      bmIds.push(bm.id);

      repositioned.push({
        ...bm,
        pos_x: gaussianRand(center[0], spread, seed),
        pos_y: gaussianRand(center[1], spread, seed + 100),
        pos_z: gaussianRand(center[2], spread, seed + 200),
      });
    }

    // Compute actual radius after positioning
    const maxDist = Math.max(...repositioned.slice(-catBookmarks.length).map(b =>
      Math.sqrt((b.pos_x - center[0]) ** 2 + (b.pos_y - center[1]) ** 2 + (b.pos_z - center[2]) ** 2)
    ));

    clusters.push({
      id: clusterId,
      label,
      center_x: center[0],
      center_y: center[1],
      center_z: center[2],
      radius: Math.max(maxDist + 5, 15),
      bookmark_ids: bmIds,
    });
  }

  // Compute similarity_ids — closest 3-4 bookmarks within same cluster
  for (const bm of repositioned) {
    const sameCluster = repositioned.filter(other =>
      other.id !== bm.id &&
      clusters.some(c => c.bookmark_ids.includes(bm.id) && c.bookmark_ids.includes(other.id))
    );
    const distances = sameCluster
      .map(other => ({
        id: other.id,
        dist: Math.sqrt(
          (bm.pos_x - other.pos_x) ** 2 +
          (bm.pos_y - other.pos_y) ** 2 +
          (bm.pos_z - other.pos_z) ** 2
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    bm.similarity_ids = distances.slice(0, 4).map(d => d.id);
  }

  console.log(`[Cosmos] Categorization: ${clusters.map(c => `${c.label}(${c.bookmark_ids.length})`).join(', ')}`);

  return { clusters, repositioned };
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
    // Filter out hidden bookmarks
    const { data, error, count } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact' })
      .or('is_hidden.is.null,is_hidden.eq.false')
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

    // Map DB rows to Bookmark type (positions will be reassigned by computeClusters)
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
      
      // Load or generate categories
      let categories = loadCategoryDefs();
      const isDefault = categories === DEFAULT_CATEGORIES || !localStorage.getItem(CATEGORIES_STORAGE_KEY);
      
      // If using default categories, try AI categorization
      if (isDefault && realBookmarks.length >= 3) {
        const texts = realBookmarks.map(bm => `${bm.text} ${bm.ogp_title || ''}`.trim());
        const aiCats = await fetchAICategories(texts);
        if (aiCats && aiCats.length > 0) {
          categories = aiCats;
          saveCategoryDefs(aiCats);
        }
      }
      
      const { clusters, repositioned } = computeClusters(realBookmarks, categories);
      setState(prev => ({
        ...prev,
        bookmarks: repositioned,
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
    hideBookmark: async (id) => {
      // Remove from local state immediately
      setState(prev => {
        const newBookmarks = prev.bookmarks.filter(b => b.id !== id);
        // Also remove from cluster bookmark_ids
        const newClusters = prev.clusters.map(c => ({
          ...c,
          bookmark_ids: c.bookmark_ids.filter(bid => bid !== id),
        })).filter(c => c.bookmark_ids.length > 0);
        return {
          ...prev,
          bookmarks: newBookmarks,
          clusters: newClusters,
          selectedBookmark: prev.selectedBookmark?.id === id ? null : prev.selectedBookmark,
        };
      });
      // Persist to Supabase (soft delete via is_hidden column)
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        await supabase.from('bookmarks').update({ is_hidden: true }).eq('id', id);
      } catch (e) {
        console.error('[Cosmos] Failed to hide bookmark in DB:', e);
      }
    },
    setZoomLevel: (level) => {
      setState(prev => ({ ...prev, zoomLevel: level }));
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
      return state.bookmarks;
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
        
        // Force token refresh to avoid Invalid JWT errors
        let session = (await supabase.auth.refreshSession()).data?.session;
        if (!session) {
          // Fallback to getSession
          const fallback = await supabase.auth.getSession();
          session = fallback.data?.session ?? null;
        }
        if (!session) {
          throw new Error('セッションが切れました。ログアウトして再度ログインしてください。');
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
  }), [state.bookmarks, state.sync, loadRealBookmarks]);

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
