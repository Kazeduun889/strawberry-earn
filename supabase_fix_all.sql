-- FIX ALL SUPABASE TABLES & RLS POLICIES

-- 1. Enable RLS on auth.users (Standard security)
alter table auth.users enable row level security;

-- 2. PROFILES TABLE (Balance, Subscription)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  balance float default 0,
  has_subscribed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;

-- Policies for Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 3. REVIEWS TABLE
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  username text,
  content text,
  rating int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.reviews enable row level security;

-- Policies for Reviews
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews" on public.reviews for select using (true);

drop policy if exists "Users can insert reviews" on public.reviews;
create policy "Users can insert reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- 4. SUPPORT MESSAGES TABLE
create table if not exists public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  content text,
  image_url text,
  is_admin_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.support_messages enable row level security;

-- Policies for Support
drop policy if exists "Users can view own support messages" on public.support_messages;
create policy "Users can view own support messages" on public.support_messages for select using (auth.uid() = user_id);

drop policy if exists "Users can insert support messages" on public.support_messages;
create policy "Users can insert support messages" on public.support_messages for insert with check (auth.uid() = user_id);

-- 5. WITHDRAWAL REQUESTS TABLE (Correct Name)
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

-- Policies for Withdrawal Requests
drop policy if exists "Users can view own requests" on public.withdrawal_requests;
create policy "Users can view own requests" on public.withdrawal_requests for select using (auth.uid() = user_id);

drop policy if exists "Users can insert requests" on public.withdrawal_requests;
create policy "Users can insert requests" on public.withdrawal_requests for insert with check (auth.uid() = user_id);

-- 6. CLEANUP OLD TABLES (Fix RLS Warning)
-- If you have a table named 'withdrawals' (wrong name), we drop it or enable RLS to silence warning.
-- Uncomment the next line to DROP the old table if it exists (Recommended if empty):
drop table if exists public.withdrawals;

-- 7. TRIGGER FOR NEW USERS
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, balance)
  values (new.id, new.email, 0)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. STORAGE POLICIES (Run manually if needed, but here for reference)
-- You need a public bucket named 'screenshots'
-- Policy: INSERT for authenticated users
-- Policy: SELECT for public
