-- Athena: Ensure required indexes on bookmarks table
-- Safe to run multiple times (IF NOT EXISTS)

-- user_id: RLS policy uses auth.uid() = user_id for every query
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);

-- tweet_id: Used for duplicate checking during sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_tweet_id ON bookmarks (tweet_id);

-- bookmarked_at: Used for ORDER BY in listing queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_bookmarked_at ON bookmarks (bookmarked_at DESC);

-- Composite: user_id + bookmarked_at for efficient user-scoped sorted queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_bookmarked ON bookmarks (user_id, bookmarked_at DESC);
