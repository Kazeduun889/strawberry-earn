
# Инструкция по деплою (Telegram Mini App)

## 1. Подготовка базы данных (Supabase)
1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard).
2. Перейдите в раздел **SQL Editor**.
3. Создайте новый запрос (New Query).
4. Скопируйте содержимое файла `supabase_fix_policies.sql` из этого проекта.
5. Вставьте в редактор и нажмите **Run**.
   - Это создаст необходимые таблицы и настроит права доступа (Policies), избегая ошибок "policy already exists".

## 2. Публикация кода на GitHub
1. Создайте новый репозиторий на GitHub.
2. Загрузите код проекта в репозиторий:
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/ВАШ_РЕПОЗИТОРИЙ.git
   git push -u origin main
   ```

## 3. Деплой веб-версии на Render.com
1. Зарегистрируйтесь на [Render](https://render.com).
2. Нажмите **New +** -> **Static Site**.
3. Подключите ваш GitHub репозиторий.
4. Настройте параметры:
   - **Name**: earning-app (или любое другое)
   - **Branch**: main
   - **Build Command**: `npm install && npx expo export -p web`
   - **Publish Directory**: `dist`
5. **Environment Variables** (Переменные окружения):
   - Добавьте переменные из вашего `.env` файла (или используйте те, что в коде, если они захардкожены, но лучше через переменные):
     - `EXPO_PUBLIC_SUPABASE_URL`: ваш URL супабейз
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: ваш ключ супабейз
6. Нажмите **Create Static Site**.
7. После завершения сборки вы получите URL (например, `https://earning-app.onrender.com`).

**Важно:** Для корректной работы маршрутизации (чтобы при обновлении страницы не было 404):
- Перейдите в **Settings** -> **Redirects/Rewrites**.
- Добавьте правило:
  - **Source**: `/*`
  - **Destination**: `/index.html`
  - **Action**: `Rewrite`

## 4. Настройка Telegram Bot
1. Откройте Telegram и найдите бота **@BotFather**.
2. Создайте нового бота: `/newbot`.
3. Запишите токен бота (хотя для Mini App он может не понадобиться напрямую, если не используете серверную часть бота).
4. Создайте Mini App:
   - Введите команду `/newapp`.
   - Выберите вашего бота.
   - Введите название приложения.
   - Введите описание.
   - Загрузите фото (640x360).
   - **Web App URL**: Вставьте ссылку на ваш сайт с Render (https://earning-app.onrender.com).
   - **Short name**: придумайте короткое имя для ссылки (например, `earning_app`).

## 5. Готово!
Теперь ваше приложение доступно по ссылке `t.me/ВашБот/ВашеКороткоеИмя`.
