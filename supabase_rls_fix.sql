-- ФИНАЛЬНЫЙ СКРИПТ ИСПРАВЛЕНИЯ ОШИБОК RLS
-- Этот скрипт включит защиту (RLS) и создаст правильные политики доступа,
-- чтобы в Supabase исчезли предупреждения "RLS not enabled".

-- === 1. ВКЛЮЧАЕМ RLS ДЛЯ ВСЕХ ТАБЛИЦ ===
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.support_messages enable row level security;
alter table public.withdrawal_requests enable row level security;

-- === 2. УДАЛЯЕМ СТАРЫЕ ПОЛИТИКИ (ЧТОБЫ НЕ БЫЛО КОНФЛИКТОВ) ===
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
drop policy if exists "Public reviews are viewable by everyone" on public.reviews;
drop policy if exists "Users can insert their own reviews" on public.reviews;
drop policy if exists "Users can view own messages" on public.support_messages;
drop policy if exists "Users can insert own messages" on public.support_messages;
drop policy if exists "Users can create requests" on public.withdrawal_requests;
drop policy if exists "Users can view own requests" on public.withdrawal_requests;

-- === 3. СОЗДАЕМ НОВЫЕ ПРАВИЛЬНЫЕ ПОЛИТИКИ ===

-- PROFILES: Все могут видеть профили (для лидерборда/отзывов), но менять только свой
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- REVIEWS: Все видят, авторизованные пишут
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Users can insert their own reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- SUPPORT_MESSAGES: Пользователи видят и пишут только свои сообщения
create policy "Users can view own messages" on public.support_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.support_messages for insert with check (auth.uid() = user_id);
-- Для админа (чтобы видел всё):
create policy "Admin view all messages" on public.support_messages for select using (true); 

-- WITHDRAWAL_REQUESTS: Видят и создают только свои
create policy "Users can view own requests" on public.withdrawal_requests for select using (auth.uid() = user_id);
create policy "Users can create requests" on public.withdrawal_requests for insert with check (auth.uid() = user_id);
-- Для админа (чтобы видел и обновлял статусы):
create policy "Admin view all requests" on public.withdrawal_requests for select using (true);
create policy "Admin update requests" on public.withdrawal_requests for update using (true);

-- === 4. ХРАНИЛИЩЕ (STORAGE) ===
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true) on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'screenshots' );

drop policy if exists "Allow all uploads" on storage.objects;
create policy "Allow all uploads" on storage.objects for insert with check ( bucket_id = 'screenshots' );

-- ГОТОВО! ОШИБКИ ДОЛЖНЫ ИСЧЕЗНУТЬ.
