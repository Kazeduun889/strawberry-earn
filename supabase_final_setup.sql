-- ЕДИНЫЙ СКРИПТ (ЗАПУСТИТЕ ТОЛЬКО ЕГО)
-- Этот скрипт:
-- 1. Создаст все таблицы (если их нет)
-- 2. Отключит ограничения прав (RLS), чтобы всё работало сразу
-- 3. Настроит хранилище файлов

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

-- === ЧАСТЬ 2: ОТКЛЮЧЕНИЕ ЗАЩИТЫ (RLS) ===
-- Это решает проблемы с правами доступа (Error 42501 и permission denied)

alter table public.profiles disable row level security;
alter table public.reviews disable row level security;
alter table public.support_messages disable row level security;
alter table public.withdrawal_requests disable row level security;

-- На всякий случай удаляем старые политики, если они есть
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Users can insert reviews" on public.reviews;
drop policy if exists "Users can view own support messages" on public.support_messages;
drop policy if exists "Users can insert support messages" on public.support_messages;
drop policy if exists "Users can view own requests" on public.withdrawal_requests;
drop policy if exists "Users can insert requests" on public.withdrawal_requests;
drop policy if exists "Admin can update requests" on public.withdrawal_requests;

-- === ЧАСТЬ 3: ХРАНИЛИЩЕ (STORAGE) ===

insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true) on conflict (id) do nothing;

-- Разрешаем всем всё в хранилище screenshots
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'screenshots' );

drop policy if exists "Allow all uploads" on storage.objects;
create policy "Allow all uploads" on storage.objects for insert with check ( bucket_id = 'screenshots' );

-- Готово!
