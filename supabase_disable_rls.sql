
-- DISABLE RLS for debugging
-- WARNING: This allows anyone to read/write everything. Use only for testing!

-- 1. Profiles
alter table public.profiles disable row level security;

-- 2. Reviews
alter table public.reviews disable row level security;

-- 3. Support Messages
alter table public.support_messages disable row level security;

-- 4. Withdrawal Requests
alter table public.withdrawal_requests disable row level security;

-- 5. Storage (Policies for buckets are different, we make them permissive)
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'screenshots' );

drop policy if exists "Allow all uploads" on storage.objects;
create policy "Allow all uploads" on storage.objects for insert with check ( bucket_id = 'screenshots' );
