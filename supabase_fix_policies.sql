
-- 1. Enable RLS
-- alter table auth.users enable row level security; -- ERROR 42501: usually already enabled and restricted

-- 2. Create Tables (if not exist)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  balance float default 0,
  has_subscribed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;

create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  username text,
  content text,
  rating int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.reviews enable row level security;

create table if not exists public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  content text,
  image_url text,
  is_admin_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.support_messages enable row level security;

create table if not exists public.withdrawal_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  amount float,
  screenshot_uri text,
  status text default 'pending',
  skin_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.withdrawal_requests enable row level security;

-- 3. Drop & Recreate Policies

-- PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- REVIEWS
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews" on public.reviews for select using (true);

drop policy if exists "Users can insert reviews" on public.reviews;
create policy "Users can insert reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- SUPPORT MESSAGES
-- Allow users to see their own messages. 
-- FOR ADMIN: You need to be able to see ALL messages. 
-- Since we don't have roles, we'll make a permissive policy for SELECT for now so the Admin Panel works.
drop policy if exists "Users can view own support messages" on public.support_messages;
create policy "Users can view own support messages" on public.support_messages for select using (true); 
-- NOTE: In production, change 'true' to something checking for admin role!

-- Allow users to insert messages.
-- Users insert their own messages. Admin inserts replies (where user_id != auth.uid()).
drop policy if exists "Users can insert support messages" on public.support_messages;
create policy "Users can insert support messages" on public.support_messages for insert with check (true);
-- NOTE: In production, strictly validate user_id or admin role.

-- WITHDRAWAL REQUESTS
-- Same for withdrawals: Admin needs to see them all.
drop policy if exists "Users can view own requests" on public.withdrawal_requests;
create policy "Users can view own requests" on public.withdrawal_requests for select using (true);
-- NOTE: In production, restrict to own requests + admin.

drop policy if exists "Users can insert requests" on public.withdrawal_requests;
create policy "Users can insert requests" on public.withdrawal_requests for insert with check (auth.uid() = user_id);

drop policy if exists "Admin can update requests" on public.withdrawal_requests;
create policy "Admin can update requests" on public.withdrawal_requests for update using (true);

-- STORAGE (Screenshots)
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true) on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'screenshots' );

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload" on storage.objects for insert with check ( bucket_id = 'screenshots' and auth.role() = 'authenticated' );

-- 4. User Trigger (Optional - App handles missing profiles automatically)
-- Note: If you get permission errors, you can skip this part.
/*
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, balance)
  values (new.id, new.email, 0);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
*/
