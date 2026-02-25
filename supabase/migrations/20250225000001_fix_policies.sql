-- Fix: Drop and recreate cluster policies if they already exist
do $$
begin
  -- Drop existing cluster policies
  drop policy if exists "Users can view own clusters" on clusters;
  drop policy if exists "Users can insert own clusters" on clusters;
  drop policy if exists "Users can update own clusters" on clusters;
  drop policy if exists "Users can delete own clusters" on clusters;
exception when others then
  null;
end $$;

-- Recreate cluster policies
create policy "Users can view own clusters"
  on clusters for select
  using (auth.uid() = user_id);

create policy "Users can insert own clusters"
  on clusters for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clusters"
  on clusters for update
  using (auth.uid() = user_id);

create policy "Users can delete own clusters"
  on clusters for delete
  using (auth.uid() = user_id);
