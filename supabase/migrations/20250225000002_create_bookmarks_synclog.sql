-- Create bookmarks table (if initial migration was rolled back)
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tweet_id text unique not null,
  tweet_url text,
  text text,
  author_name text,
  author_handle text,
  ogp_title text,
  ogp_description text,
  ogp_image text,
  pos_x float default 0,
  pos_y float default 0,
  pos_z float default 0,
  is_read boolean default false,
  created_at timestamptz default now(),
  bookmarked_at timestamptz,
  updated_at timestamptz default now()
);

alter table bookmarks enable row level security;

drop policy if exists "Users can view own bookmarks" on bookmarks;
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookmarks" on bookmarks;
create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookmarks" on bookmarks;
create policy "Users can update own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

create index if not exists idx_bookmarks_user_id on bookmarks(user_id);
create index if not exists idx_bookmarks_tweet_id on bookmarks(tweet_id);

-- Create sync_log table
create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  synced_at timestamptz default now(),
  new_count int default 0,
  api_cost_usd numeric(6,4) default 0.1000
);

alter table sync_log enable row level security;

drop policy if exists "Users can view own sync log" on sync_log;
create policy "Users can view own sync log"
  on sync_log for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sync log" on sync_log;
create policy "Users can insert own sync log"
  on sync_log for insert
  with check (auth.uid() = user_id);

create index if not exists idx_sync_log_user_id on sync_log(user_id);
create index if not exists idx_sync_log_synced_at on sync_log(synced_at desc);
