// Core data types for Athena

export interface Bookmark {
  id: string;
  tweet_id: string;
  tweet_url: string;
  text: string;
  author_name: string;
  author_handle: string;
  ogp_title?: string;
  ogp_description?: string;
  ogp_image?: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  is_read: boolean;
  created_at: string;
  bookmarked_at?: string;
  // For similarity connections
  similarity_ids?: string[];
}

export interface Cluster {
  id: string;
  label: string;
  center_x: number;
  center_y: number;
  center_z: number;
  radius: number;
  bookmark_ids: string[];
}

export interface SyncState {
  lastSyncAt: string | null;
  cooldownUntil: string | null;
  isSyncing: boolean;
  lastSyncCount: number;
  syncError: string | null;
}

export interface CosmosState {
  bookmarks: Bookmark[];
  clusters: Cluster[];
  selectedBookmark: Bookmark | null;
  hoveredBookmark: Bookmark | null;
  zoomLevel: number;
  audioEnabled: boolean;
  isLoading: boolean;
  sync: SyncState;
}
