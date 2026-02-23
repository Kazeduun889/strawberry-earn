-- Enable RLS
alter table auth.users enable row level security;

-- 1. Profiles Table (User Balance & Status)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  balance float default 0,
  has_subscribed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 2. Reviews Table
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
create policy "Anyone can read reviews" on public.reviews
  for select using (true);

create policy "Users can insert reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

-- 3. Support Messages Table
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
create policy "Users can view own support messages" on public.support_messages
  for select using (auth.uid() = user_id);

create policy "Users can insert support messages" on public.support_messages
  for insert with check (auth.uid() = user_id);

-- 4. Withdrawal Requests Table
create table if not exists public.withdrawal_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  amount float,
  screenshot_uri text,
  status text default 'pending', -- pending, approved, rejected
  skin_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.withdrawal_requests enable row level security;

-- Policies for Withdrawals
create policy "Users can view own requests" on public.withdrawal_requests
  for select using (auth.uid() = user_id);

create policy "Users can insert requests" on public.withdrawal_requests
  for insert with check (auth.uid() = user_id);

-- 5. Storage Bucket (Screenshots)
-- Note: You must create a bucket named 'screenshots' in the Supabase Dashboard -> Storage
-- Make sure it's Public.
-- Policy: Give insert access to authenticated users
-- insert policy: bucket_id = 'screenshots' AND auth.role() = 'authenticated'
-- select policy: bucket_id = 'screenshots' (Public)

-- 6. Trigger for New User (Auto-create profile)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, balance)
  values (new.id, new.email, 0);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Admin Access (Allow select/update on all tables for specific user or role)
-- Simplest way: Disable RLS for admin operations OR create an admin policy
-- For this app, we can add a policy for the specific admin ID if known, or just use RLS that allows all for now if testing.
-- BETTER: Create a function `is_admin()` or just add a policy for your specific User ID.

-- Example Admin Policy (Replace with your actual User ID if needed, or use the dashboard to browse data)
-- create policy "Admin can view all" on public.withdrawal_requests for select using (auth.uid() = 'YOUR_ADMIN_UUID');
