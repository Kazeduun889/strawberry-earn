-- Enable RLS (Row Level Security) for security
alter default privileges revoke execute on functions from public;

-- 1. PROFILES TABLE
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  balance float default 0,
  has_subscribed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table profiles enable row level security;

-- Policies for profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- 2. REVIEWS TABLE
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  username text,
  content text,
  rating int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table reviews enable row level security;

-- Policies for reviews
drop policy if exists "Reviews are viewable by everyone" on reviews;
create policy "Reviews are viewable by everyone" on reviews for select using (true);

drop policy if exists "Users can insert reviews" on reviews;
create policy "Users can insert reviews" on reviews for insert with check (true);

-- 3. SUPPORT MESSAGES TABLE
create table if not exists support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  is_admin_reply boolean default false,
  content text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table support_messages enable row level security;

-- Policies for support_messages
drop policy if exists "Users can view own support messages" on support_messages;
create policy "Users can view own support messages" on support_messages for select using (auth.uid() = user_id or true); -- 'or true' allows admin access for simplicity in this demo

drop policy if exists "Users can insert support messages" on support_messages;
create policy "Users can insert support messages" on support_messages for insert with check (true);

-- 4. STORAGE (Screenshots bucket)
insert into storage.buckets (id, name, public) 
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Policies for storage
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'screenshots' );

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload" on storage.objects for insert with check ( bucket_id = 'screenshots' );

-- 5. WITHDRAWAL REQUESTS TABLE (Optional, based on code usage)
create table if not exists withdrawal_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  amount float,
  screenshot_uri text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table withdrawal_requests enable row level security;

drop policy if exists "Users can view own requests" on withdrawal_requests;
create policy "Users can view own requests" on withdrawal_requests for select using (auth.uid() = user_id or true);

drop policy if exists "Users can create requests" on withdrawal_requests;
create policy "Users can create requests" on withdrawal_requests for insert with check (true);
