-- ЕДИНЫЙ СКРИПТ (ЗАПУСТИТЕ ТОЛЬКО ЕГО)
-- Этот скрипт:
-- 1. Создаст все таблицы (включая profiles, reviews, support_messages, withdrawal_requests и withdrawals)
-- 2. Включит RLS (защиту) для всех таблиц
-- 3. Настроит политики доступа (кто может видеть и писать)
-- 4. Настроит хранилище файлов (screenshots)

-- === ЧАСТЬ 1: СОЗДАНИЕ ТАБЛИЦ ===

create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  balance float default 0,
  has_subscribed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  username text,
  content text,
  rating int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  content text,
  image_url text,
  is_admin_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.withdrawal_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  amount float,
  screenshot_uri text,
  status text default 'pending',
  skin_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Таблица withdrawals (на случай, если она используется вместо withdrawal_requests)
create table if not exists public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  amount float,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- === ЧАСТЬ 2: ВКЛЮЧЕНИЕ ЗАЩИТЫ (RLS) ===

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.support_messages enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.withdrawals enable row level security;

-- === ЧАСТЬ 3: УДАЛЯЕМ СТАРЫЕ ПОЛИТИКИ ===

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
drop policy if exists "Users can insert their own reviews" on public.reviews;
drop policy if exists "Users can view own messages" on public.support_messages;
drop policy if exists "Users can insert own messages" on public.support_messages;
drop policy if exists "Admin view all messages" on public.support_messages;
drop policy if exists "Users can view own requests" on public.withdrawal_requests;
drop policy if exists "Users can create requests" on public.withdrawal_requests;
drop policy if exists "Admin view all requests" on public.withdrawal_requests;
drop policy if exists "Admin update requests" on public.withdrawal_requests;
drop policy if exists "Users can view own withdrawals" on public.withdrawals;
drop policy if exists "Users can insert own withdrawals" on public.withdrawals;

-- === ЧАСТЬ 4: СОЗДАЕМ НОВЫЕ ПОЛИТИКИ ===

-- PROFILES
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- REVIEWS
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Users can insert their own reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- SUPPORT_MESSAGES
create policy "Users can view own messages" on public.support_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.support_messages for insert with check (auth.uid() = user_id);
create policy "Admin view all messages" on public.support_messages for select using (true); 

-- WITHDRAWAL_REQUESTS
create policy "Users can view own requests" on public.withdrawal_requests for select using (auth.uid() = user_id);
create policy "Users can create requests" on public.withdrawal_requests for insert with check (auth.uid() = user_id);
create policy "Admin view all requests" on public.withdrawal_requests for select using (true);
create policy "Admin update requests" on public.withdrawal_requests for update using (true);

-- WITHDRAWALS
create policy "Users can view own withdrawals" on public.withdrawals for select using (auth.uid() = user_id);
create policy "Users can insert own withdrawals" on public.withdrawals for insert with check (auth.uid() = user_id);

-- === ЧАСТЬ 5: ХРАНИЛИЩЕ (STORAGE) ===

insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true) on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'screenshots' );

drop policy if exists "Allow all uploads" on storage.objects;
create policy "Allow all uploads" on storage.objects for insert with check ( bucket_id = 'screenshots' );

-- ГОТОВО!
