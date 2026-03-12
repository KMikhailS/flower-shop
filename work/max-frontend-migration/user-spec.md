---
feature: max-frontend-migration
status: draft
created: 2026-03-12
---

# User Spec: Миграция FanFanTulpan с Telegram на MAX Mini App

## Что делаем

Полная миграция приложения FanFanTulpan с платформы Telegram Mini App на платформу MAX Mini App. Миграция охватывает два уровня:

**Фронтенд:** замена Telegram WebApp SDK (`window.Telegram.WebApp`) на MAX Bridge API (`window.WebApp`). Переписываются типы, хук инициализации, хранилище корзины, обработка диалогов.

**Бэкенд:** замена aiogram на httpx + прямые HTTP-запросы к MAX Bot API. Переписывается валидация `initData` (собственная HMAC-SHA256 реализация), бот-клиент (long polling), отправка уведомлений менеджеру.

Бизнес-логика, вёрстка, навигация, REST API и база данных **не меняются**.

---

## Зачем

Приложение должно работать в мессенджере MAX. Платформа MAX имеет собственный Bridge API, аналогичный Telegram WebApp API, но с ключевыми отличиями. Без миграции приложение не запустится в MAX.

---

## Контекст и ограничения

- MAX-бот уже создан в панели разработчика (`dev.max.ru`)
- Тестирование в реальном MAX Mini App — отдельный этап после деплоя
- Приёмка данной задачи: успешная сборка (`npm run build`, `tsc`) и корректный запуск при ручном тесте
- Бэкенд не использует Python SDK для MAX (его нет) — только httpx к `platform-api.max.ru`
- Алгоритм валидации MAX initData идентичен Telegram (HMAC-SHA256, ключ `"WebAppData"`)

---

## Пользовательские флоу

### Флоу 1: Открытие приложения в MAX
1. Пользователь нажимает кнопку "Открыть магазин" в чате с ботом
2. MAX открывает Mini App, загружает `max-web-app.js`
3. `window.WebApp.ready()` вызывается (без `expand()` — в MAX нет аналога)
4. `initData` отправляется с каждым API-запросом в заголовке `Authorization: tma <initData>`
5. Бэкенд валидирует подпись через HMAC-SHA256 и возвращает данные пользователя

### Флоу 2: Сохранение корзины
1. Пользователь добавляет товар в корзину
2. Состояние сохраняется через `DeviceStorage.setItem()` (синхронный, без колбэков)
3. При следующем открытии приложения корзина восстанавливается из `DeviceStorage`
4. На web-платформе (не в MAX-приложении) — fallback на `localStorage`

### Флоу 3: Оформление заказа — получение телефона
1. Пользователь нажимает "Заказать" в корзине
2. Если `userInfo.phone` пустой — вызывается `window.confirm()` (вместо `webApp.showConfirm()`)
3. `WebApp.requestContact()` вызывается согласно документации MAX
4. После получения телефона — вызывается `PUT /users/me/phone`
5. Оформление заказа продолжается

**Изменение vs Telegram:** убирается polling (`fetchUserInfo` каждую секунду), добавляется прямой вызов REST API после получения контакта. Polling-механизм через бота не работает в MAX (бот не получает contact-сообщения).

### Флоу 4: Приветственное сообщение от бота
1. Пользователь впервые открывает чат с ботом (`bot_started` event)
2. Бот загружает фото `api/images/fanfan-main.jpg` через `POST /uploads` → получает media token
3. Отправляет сообщение с фото + текстом + inline-кнопкой "🌸 Открыть магазин" (`open_app`)
4. Пользователь нажимает кнопку → открывается Mini App

### Флоу 5: Переключение режима (админ)
1. Администратор отправляет `/mode` боту в MAX
2. Бот отвечает inline-клавиатурой с кнопками "Режим администратора" / "Режим клиента"
3. При нажатии — бот обновляет `mode` в БД и отвечает на callback

### Флоу 6: Уведомление менеджера о заказе
1. Заказ создан через REST API
2. `notifications.py` отправляет сообщение через `POST https://platform-api.max.ru/messages?chat_id={manager_chat_id}`
3. Форматирование: Markdown (`**bold**`) вместо HTML (`<b>`)

---

## Детали реализации

### Фронтенд

**`app/index.html`**
- Заменить скрипт: `telegram-web-app.js` → `https://st.max.ru/js/max-web-app.js`

**`app/src/types/max-webapp.d.ts`** (новый файл, заменяет `telegram.d.ts`)
- `window.WebApp` вместо `window.Telegram.WebApp`
- Убрать: `MainButton`, `expand()`, `showAlert()`, `showConfirm()`, `showPopup()`, `disableVerticalSwipes()`
- `CloudStorage` → `DeviceStorage` (синхронный: `setItem(key, value)`, `getItem(key)`, `removeItem(key)`)
- `openTelegramLink()` → `openMaxLink()`
- `enableClosingConfirmation()` / `disableClosingConfirmation()` — методы вместо свойства
- `sendData()` — убрать (нет аналога в MAX)
- Удалить `app/src/types/telegram.d.ts`

**`app/src/hooks/useMaxWebApp.ts`** (переименован из `useTelegramWebApp.ts`)
- `window.Telegram?.WebApp` → `window.WebApp`
- Убрать `tg.expand()`
- Убрать установку CSS-переменных `--tg-theme-*`
- Тип `TelegramWebApp` → `MaxWebApp`

**`app/src/hooks/useCartPersistence.ts`**
- `CloudStorage.setItem(key, value, callback)` → `DeviceStorage.setItem(key, value)` (без колбэка)
- `CloudStorage.getItem(key, callback)` → `DeviceStorage.getItem(key)` (синхронный)
- `CloudStorage.removeItem(key, callback)` → `DeviceStorage.removeItem(key)` (синхронный)
- Тип `TelegramWebApp` → `MaxWebApp`

**`app/src/App.tsx`**
- Импорт: `useTelegramWebApp` → `useMaxWebApp`
- `webApp.showAlert(msg, cb)` → `window.alert(msg); cb?.()`
- `webApp.showConfirm(msg, cb)` → `const r = window.confirm(msg); cb?.(r)`
- `webApp.openTelegramLink(url)` → `webApp.openMaxLink(url)`
- `webApp.disableVerticalSwipes?.()` → удалить
- `buildSupportChatLink()`: оставить заглушку (вернуть `''` или пустую строку — детали MAX deeplink уточним позже)
- `BackButton` — без изменений (API совпадает)

**`app/src/components/Cart.tsx`**
- Импорт: `useTelegramWebApp` → `useMaxWebApp`
- `webApp.sendData(...)` → удалить (заказ уже создан через REST)
- `webApp.showAlert(msg)` → `window.alert(msg)`
- `webApp.showConfirm(msg, cb)` → `const r = window.confirm(msg); cb?.(r)`
- `webApp.requestContact()`: вызвать, получить телефон, вызвать `PUT /users/me/phone`, убрать polling
- `HapticFeedback` — без изменений

**`app/src/components/DeliveryDateTimeModal.tsx`**
- Обновить тип `TelegramWebApp` → `MaxWebApp` если используется

**`app/src/components/AdminProductCard.tsx`**
- Строки ~420, ~497: `window.Telegram?.WebApp?.initData` → `window.WebApp?.initData`

**Глобальная замена по `app/src/`:**
- Тип `TelegramWebApp` → `MaxWebApp`
- Хук `useTelegramWebApp` → `useMaxWebApp`

### Бэкенд

**`api/auth.py`**
- Убрать `from aiogram.utils.web_app import safe_parse_webapp_init_data`
- Реализовать `verify_max_init_data(init_data_str, bot_token)`: HMAC-SHA256 с ключом `"WebAppData"`
- Добавить alias `verify_telegram_init_data = verify_init_data` для обратной совместимости (роутеры не меняем)

**`api/main.py`** (полная перезапись)
- Убрать aiogram (`Bot`, `Dispatcher`, `Command`, `WebAppInfo`, etc.)
- `MaxBotClient` — HTTP-клиент к `https://platform-api.max.ru` через httpx
- Long polling: `GET /updates` с `timeout=35.0`
- Обработчики событий: `bot_started`, `message_created` (`/mode`), `message_callback`
- Приветственное сообщение: 2-шаговая отправка фото (`POST /uploads` → `POST /messages` с attachment)
- Файл фото: `api/images/fanfan-main.jpg`

**`api/notifications.py`**
- Заменить `Bot(token=bot_token)` на `httpx.AsyncClient` + `POST /messages?chat_id={id}`
- Форматирование: HTML (`<b>`) → Markdown (`**`)
- `send_order_notification_to_email` — без изменений

**`api/requirements.txt`**
- Убрать `aiogram==3.21.0`
- `httpx` уже есть (оставить)

**`api/dependencies.py`**
- Обновить docstring (опционально, alias в auth.py делает это необязательным)

---

## Деплой

### Что нужно сделать перед деплоем

1. Обновить `api/.env`:
   - `BOT_TOKEN` → токен MAX-бота (из `dev.max.ru`)
   - `APP_URL` → URL Mini App (уже на сервере)
2. Обновить `manager_chat_id` в таблице `settings` в БД — вручную через SQL (MAX user ID менеджера)
3. Привязать Mini App к боту: `dev.max.ru → Чат-боты → [бот] → Мини-приложение → вставить URL`
4. `docker-compose up --build -d`

### Проверка после деплоя
- MAX-бот отвечает на открытие чата (фото + кнопка)
- Нажатие кнопки открывает Mini App
- Пользователь авторизуется (корзина отображается, данные профиля видны)
- Можно добавить товар, оформить заказ
- Менеджер получает уведомление в MAX

---

## Что НЕ меняется

- Вся бизнес-логика компонентов
- Tailwind-стили и вёрстка
- REST API вызовы (`fetchGoods`, `createOrder`, etc.)
- Touch/swipe-логика каруселей
- Навигация через состояния
- `BackButton` логика (API совпадает)
- `HapticFeedback` (API совпадает)
- База данных и схема
- Роутеры FastAPI (`routers/*.py`) — через alias в auth.py
- Email-уведомления

---

## Критерии приёмки

**Фронтенд — сборка:**
- [ ] `npm run build` завершается без ошибок
- [ ] `npm run lint` не выдаёт ошибок связанных с Telegram API
- [ ] TypeScript не ругается на `window.Telegram` (тип убран)
- [ ] Файл `app/src/types/telegram.d.ts` удалён, `max-webapp.d.ts` создан

**Бэкенд — сборка:**
- [ ] `docker-compose up --build` завершается без ошибок
- [ ] `GET /api/health` возвращает 200

**Функциональность (ручная проверка в MAX):**
- [ ] Бот отвечает на открытие чата фото + текстом + кнопкой
- [ ] Кнопка открывает Mini App
- [ ] Пользователь видит каталог товаров (авторизация прошла)
- [ ] Корзина сохраняется между сессиями
- [ ] Можно оформить заказ с доставкой (COURIER и PICKUP)
- [ ] Менеджер получает уведомление о заказе в MAX
- [ ] Команда `/mode` работает для администратора
- [ ] Телефон запрашивается при оформлении заказа (requestContact)

**Регрессия:**
- [ ] Существующие заказы и данные пользователей не затронуты
- [ ] Admin panel работает (CRUD товаров, категорий, баннеров)

---

## Открытые вопросы (TBD)

- **MAX deeplink для чата поддержки** — формат `buildSupportChatLink()`. Заглушка сейчас, уточнить при тестировании.
- **requestContact() поведение в MAX** — точный формат ответа (callback/promise). Уточнить при тестировании, при необходимости доработать.
- **DeviceStorage синхронность** — документация MAX не уточняет. Реализовать как синхронный, скорректировать если Promise.
