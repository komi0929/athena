-- Add is_hidden column to bookmarks for soft-delete / hide functionality
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Index for filtering queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_hidden ON bookmarks(is_hidden) WHERE is_hidden = true;
