# Code Research: MAX Mini App Migration

Feature: Full migration from Telegram Mini App to MAX Mini App.
Scope: frontend (Telegram WebApp API -> MAX Bridge API) + backend (aiogram -> httpx + MAX Bot API, initData validation).

---

## 1. Entry Points

### Backend

**`api/main.py`**
Entry point for both FastAPI and aiogram bot (run concurrently via `asyncio.gather`). Registers `/start` and `/mode` Telegram command handlers, plus a contact-sharing handler.

**`api/auth.py`**
FastAPI dependencies for request authentication. Two functions:
- `verify_telegram_init_data(authorization: str = Header(...)) -> int` — extracts `tma <initData>` from Authorization header, validates signature, returns `user_id`
- `verify_admin_mode(user_id: int = Depends(verify_telegram_init_data)) -> int` — checks `role == ADMIN` in DB

**`api/notifications.py`**
Sends order notifications after order creation. Two functions:
- `send_order_notification_to_manager(order_data: dict) -> bool`
- `send_order_notification_to_email(order_data: dict) -> bool`

### Frontend

**`app/src/App.tsx`**
Root component. All navigation is state-driven (no router). Consumes `useTelegramWebApp()` and passes `webApp` object throughout the tree.

**`app/src/hooks/useTelegramWebApp.ts`**
Single hook that initializes the Telegram SDK. Returns `{ webApp, user, isReady }`.

**`app/src/components/Cart.tsx`**
Handles order placement. Most intensive user of Telegram APIs: `HapticFeedback`, `showAlert`, `showConfirm`, `requestContact`, `sendData`.

---

## 2. Data Layer

No changes to DB schema required for this migration. The `user_info` table fields (`user_id`, `username`, `phone`, `role`, `mode`) are platform-agnostic.

The `initData` string format will change from Telegram's URL-encoded format to MAX's equivalent. The validation logic in `auth.py` is the only place that parses this.

---

## 3. Backend: Current aiogram Usage

### `api/main.py` — Welcome photo on /start

```python
image_path = os.path.join(os.path.dirname(__file__), "images", "fanfan-main.jpg")
photo = FSInputFile(image_path)
await message.answer_photo(photo=photo, caption=caption, reply_markup=keyboard)
```

- Photo is loaded from local filesystem at `api/images/fanfan-main.jpg` relative to `main.py`.
- Uses `FSInputFile` from aiogram to wrap the local path.
- The keyboard uses `WebAppInfo(url=APP_URL)` to attach the Mini App button.
- The `/mode` command callback handler uses `InlineKeyboardButton(callback_data="mode_admin"/"mode_user")` and `CallbackQuery`.
- Contact handler at line 128-153: listens for `message.contact`, validates `contact.user_id == message.from_user.id`, saves phone to DB.

### `api/notifications.py` — aiogram.Bot usage

```python
from aiogram import Bot
bot = Bot(token=bot_token)
await bot.send_message(chat_id=manager_chat_id, text=message, parse_mode="HTML")
await bot.session.close()
```

A new ephemeral `Bot` instance is created per notification call (no persistent bot instance — it reads `BOT_TOKEN` from env each time). Session is explicitly closed in a `finally` block.

**HTML tags used in notification message:**
- `<b>` for bold sections: `НОВЫЙ ЗАКАЗ`, `Клиент:`, `Товары:`, `Услуги:`, `Итого:`, `Доставка:`, `Адрес:`, `Доставка к:`, `Текст открытки:`, `Время заказа:`
- `html.escape()` applied only to `postcard_text_raw` (user-supplied free text)
- All other fields (username, phone, address, order items) are inserted without escaping — potential XSS in bot context if those fields ever contain HTML

### `api/auth.py` — initData validation

```python
from aiogram.utils.web_app import safe_parse_webapp_init_data

init_data = safe_parse_webapp_init_data(token=bot_token, init_data=init_data_str)
user_id = init_data.user.id
```

- Depends on `aiogram`'s utility function which implements Telegram's HMAC-SHA256 check.
- `bot_token` is read from env var `BOT_TOKEN`.
- For MAX migration: `safe_parse_webapp_init_data` must be replaced with MAX's equivalent verification algorithm. If MAX uses a different signature scheme (e.g., different HMAC key derivation or data format), this entire function needs rewriting. The aiogram import can be removed from this module entirely once replaced.

---

## 4. Frontend: All Telegram API Usages

### `app/index.html` — SDK script tag

```html
<script src="https://telegram.org/js/telegram-web-app.js?59"></script>
```

Line 11. This must be replaced with the MAX Bridge SDK script tag. The `?59` is a cache-buster version param.

### `app/src/types/telegram.d.ts` — Full type definitions

Global augmentation of `window.Telegram.WebApp`. Key members used by the app:

| Member | Type | Usage |
|--------|------|-------|
| `initData` | `string` | Auth token sent as `Authorization: tma <initData>` header to all API calls |
| `initDataUnsafe.user` | `{ id, first_name, last_name?, username?, language_code? }` | User identity in Cart order payload |
| `themeParams` | `{ bg_color?, text_color?, button_color?, button_text_color? }` | CSS vars in `useTelegramWebApp` |
| `BackButton` | `{ show, hide, onClick, offClick }` | Navigation back button in App.tsx |
| `HapticFeedback` | `{ impactOccurred, notificationOccurred, selectionChanged }` | Cart.tsx haptics |
| `CloudStorage` | `{ setItem, getItem, removeItem }` (callback-based) | Cart persistence |
| `showAlert` | `(message: string, callback?: () => void) => void` | Error/success dialogs |
| `showConfirm` | `(message: string, callback?: (confirmed: boolean) => void) => void` | Confirmation dialogs |
| `requestContact` | `(callback?: (result: boolean) => void) => void` | Phone number collection |
| `sendData` | `(data: string) => void` | Sends order JSON to bot after order creation |
| `openLink` | `(url: string, options?) => void` | Fallback link opener |
| `openTelegramLink` | `(url: string) => void` | Opens Telegram-internal links |
| `expand` | `() => void` | Called on init to expand to full height |
| `ready` | `() => void` | Called on init to signal readiness |
| `disableVerticalSwipes?` | `() => void` | Typed but not called in current code |
| `enableVerticalSwipes?` | `() => void` | Typed but not called in current code |

`MainButton` and `showPopup` are typed but not used in application code.

Window augmentation: `interface Window { Telegram: { WebApp: TelegramWebApp } }`.

### `app/src/hooks/useTelegramWebApp.ts` — Full SDK initialization

```typescript
const tg = window.Telegram?.WebApp;
tg.ready();
tg.expand();
// Sets CSS vars from tg.themeParams:
//   --tg-theme-bg-color
//   --tg-theme-text-color
//   --tg-theme-button-color
//   --tg-theme-button-text-color
setWebApp(tg);
setIsReady(true);
```

Returns `{ webApp: TelegramWebApp | null, user: ..., isReady: boolean }`.
`user` is derived as `webApp?.initDataUnsafe?.user || null`.

For MAX migration: `window.Telegram?.WebApp` becomes the MAX Bridge object. The hook reads `themeParams` — MAX must provide equivalent theme params or the CSS var setting block needs to be removed/adapted.

### `app/src/hooks/useCartPersistence.ts` — CloudStorage usage

All three operations use callback-based API with `localStorage` fallback:

```typescript
// Save
webApp.CloudStorage.setItem(key, value, (error) => { /* fallback to localStorage */ });

// Load
webApp.CloudStorage.getItem(key, (error, value) => { /* fallback to localStorage on error/null */ });

// Clear
webApp.CloudStorage.removeItem(key, (error) => { /* logs error, no fallback needed */ });
```

Key: `'fanfantulpan_cart'`. Data expires after 24 hours (validated in `validateAndParseCart`).

If MAX Bridge does not support CloudStorage, the hook degrades gracefully to `localStorage` already (fallback path exists for all three operations). The `if (webApp?.CloudStorage)` guard means: if CloudStorage is absent from the MAX API object, all storage silently uses localStorage.

### `app/src/App.tsx` — All Telegram API usages

**`webApp.initData`** — used as auth token in every API call:
- `fetchUserInfo(webApp.initData)` — on mount and after mode change
- `fetchSupportChatId(webApp.initData)` — when opening support chat
- Passed as `initData` prop to Settings, MyOrders, AdminOrders, DeliveryInfo, PaymentInfo, StoreAddresses, useProducts, usePromoBanners

**`webApp.openTelegramLink(url)`** — in `openSupportLink()`:
```typescript
if (preferTelegram && webApp?.openTelegramLink) {
  webApp.openTelegramLink(url);
}
// Falls back to webApp.openLink, then window.open
```

**`webApp.openLink(url)`** — second fallback in `openSupportLink()`

**`webApp.showAlert(message, callback?)`** — used in:
- `handleOpenFeedback`: 3 error cases + fallback `alert()`
- `handleDeleteProduct`: success + error cases (with `alert()` fallback when `webApp.showAlert` absent)

**`webApp.showConfirm(message, callback)`** — used in:
- `handleDeleteProduct`: confirm before delete (with `window.confirm()` fallback)
- `handleDeleteBanner`: confirm before banner delete (NO fallback — requires `webApp.showConfirm` to exist)

**`webApp.BackButton`** — full navigation control in `useEffect` at line 590-642:
```typescript
webApp.BackButton.show();
webApp.BackButton.onClick(handleBackClick);
// cleanup:
webApp.BackButton.offClick(handleBackClick);
// ...
webApp.BackButton.hide();
```
Handles back navigation for: cart, product card, admin card, settings, orders, delivery/payment info, store addresses, menu.

**`disableVerticalSwipes` / `enableClosingConfirmation`** — NOT called anywhere in current `App.tsx` (typed in `.d.ts` but unused).

### `app/src/components/Cart.tsx` — Telegram API usages

**`webApp.HapticFeedback`:**
- `impactOccurred('light')` — on item increase/decrease
- `notificationOccurred('warning')` — on item remove
- `notificationOccurred('error')` — on validation failures
- `notificationOccurred('success')` — when order submit starts
- `selectionChanged()` — on delivery method switch, address suggestion select, postcard checkbox

**`webApp.showAlert(message, callback?)`** — validation errors + contact flow messages:
- "Пожалуйста, введите адрес доставки"
- "Пожалуйста, выберите дату и время доставки"
- "Пожалуйста, введите текст для открытки" / "не должен превышать 300 символов"
- "Ошибка: не удалось получить данные пользователя"
- "Без контактных данных мы не сможем..."
- "Сейчас откроется чат с ботом..." (no callback)
- "✅ Номер телефона получен!..." (after polling success)
- Timeout/error alerts in polling loop
- `Ошибка при создании заказа: ...`

**`webApp.showConfirm(message, callback)`** — two usages:
1. Line 175: "Для оформления заказа нам нужен ваш номер телефона. Поделиться контактом?" → wrapped in `Promise` for `await`
2. Line 283: "Заказ успешно оформлен!... Перейти?" → navigates to MyOrders on confirm

**`webApp.requestContact()`** — line 188, called with no callback:
```typescript
webApp.requestContact();
// Then polls fetchUserInfo() every 1 second, up to 15 attempts
```
After calling `requestContact()`, the app shows an alert and starts polling `fetchUserInfo` with `setInterval` (1s intervals, max 15 attempts = 15s) to detect when phone appears in DB. This is a workaround because `requestContact` here is used without a callback.

**`webApp.sendData(JSON.stringify(botData))`** — line 279, called after successful order creation. Sends full order JSON to the bot. In MAX: this API may not exist or behave differently. If MAX doesn't support `sendData`, this call needs to be removed or replaced with a direct API call — the order is already created in the backend before `sendData` is called, so removing `sendData` would not break order creation.

**`user` from `useTelegramWebApp`** — `user.id` is used as `user_id` in `OrderRequest`. `user.first_name`, `user.last_name`, `user.username` are put in `botData` for the `sendData` payload only.

### `app/src/components/AdminProductCard.tsx` — Direct window.Telegram access

Two locations access `window.Telegram?.WebApp?.initData` directly (does NOT use the `useTelegramWebApp` hook):
- Line 420: `handleDeleteImage` function
- Line 497: `handleSave` function (image reorder after save)

These are the only places in the codebase that access `window.Telegram` directly rather than through the hook.

### `app/src/hooks/useCart.tsx`

`CartProvider` accepts `webApp: TelegramWebApp | null` as a prop (passed from `App.tsx`). It passes `webApp` to `useCartPersistence`. The `loadCart()` call is gated: `if (!webApp) return;` — so cart does not load until `webApp` is available.

### `app/src/hooks/usePromoBanners.ts`

Accepts `webApp: TelegramWebApp | null`. Uses `webApp?.initData` as fallback when `initData` prop is not provided in `handleAddPromoBanner`.

### `app/src/components/DeliveryDateTimeModal.tsx`

No Telegram API usage — pure UI component.

---

## 5. Files Referencing Telegram APIs (Global Search Results)

9 files found by searching for `useTelegramWebApp|window\.Telegram|TelegramWebApp`:

| File | How it uses Telegram |
|------|---------------------|
| `app/src/hooks/useTelegramWebApp.ts` | Core hook — initializes `window.Telegram.WebApp` |
| `app/src/types/telegram.d.ts` | Type definitions for `TelegramWebApp` and `Window.Telegram` |
| `app/src/App.tsx` | Consumes hook; uses `BackButton`, `showAlert`, `showConfirm`, `openTelegramLink`, `openLink`, `initData` |
| `app/src/components/Cart.tsx` | Consumes hook; uses `HapticFeedback`, `showAlert`, `showConfirm`, `requestContact`, `sendData` |
| `app/src/components/AdminProductCard.tsx` | Accesses `window.Telegram?.WebApp?.initData` directly (2 locations) |
| `app/src/hooks/useCartPersistence.ts` | Uses `webApp.CloudStorage.setItem/getItem/removeItem` |
| `app/src/hooks/useCart.tsx` | Accepts `webApp` prop, gates cart load on webApp presence |
| `app/src/hooks/usePromoBanners.ts` | Accepts `webApp` prop for fallback `initData` access |
| `app/src/components/DeliveryDateTimeModal.tsx` | References `TelegramWebApp` type only (not used at runtime) |

---

## 6. Integration Points

**Auth flow (critical path):**
`window.Telegram.WebApp.initData` → `Authorization: tma <initData>` header → `verify_telegram_init_data()` in `auth.py` → `safe_parse_webapp_init_data()` from aiogram → `user_id`.

All 9 frontend API call functions in `app/src/api/client.ts` that require auth accept `initData: string` as a parameter and pass it as the Authorization header.

**Bot → user communication channel:**
- Order confirmation: `webApp.sendData(JSON.stringify(botData))` in Cart.tsx
- Contact collection: `webApp.requestContact()` in Cart.tsx → aiogram `contact_handler` in main.py → saves phone to DB

**Backend bot instance lifecycle:**
`notifications.py` creates a new `Bot(token=BOT_TOKEN)` per notification and closes the session in `finally`. In `main.py` there is a module-level `bot = Bot(token=BOT_TOKEN)` instance used for polling. For MAX migration, both need to be replaced with an httpx-based client calling MAX Bot API endpoints.

---

## 7. Potential Problems

1. **`sendData` coupling**: `webApp.sendData()` is called after order creation in Cart.tsx. In Telegram, `sendData` closes the Mini App and sends data to the bot. If MAX Bridge has the same behavior, calling it would close the app. If it does not exist in MAX, the call silently does nothing (no guard check). The order is already persisted before this call, so it is safe to remove — but the bot currently does NOT process `sendData` for order confirmation anyway (the notification goes through `notifications.py` called from the orders router, not through `sendData`). The `botData` payload is effectively dead code on the backend.

2. **`requestContact` polling**: The contact collection flow (Cart.tsx lines 186-229) opens the bot chat via `requestContact()` and polls the API every second for 15 seconds. In MAX, `requestContact` may not exist or may work differently. If it does not exist, the `if (webApp?.requestContact)` guard at line 187 directs to the `else` branch showing "Ваш Telegram не поддерживает запрос контакта". An alternative contact collection method is needed.

3. **`AdminProductCard.tsx` bypasses hook**: Lines 420 and 497 read `window.Telegram?.WebApp?.initData` directly. After migration, `window.Telegram` won't exist — these will return `''` (empty string), causing auth failures silently. These need to be updated to use the MAX SDK path or the hook.

4. **`safe_parse_webapp_init_data` is aiogram-specific**: The entire `auth.py` validation must be replaced. The replacement must implement MAX's initData signature algorithm. Any mistake here would either break all auth or leave a security hole.

5. **HTML injection in notification**: `notifications.py` does not escape username, phone, delivery address, or order item names when building the HTML-formatted Telegram message. Only `postcard_text_raw` is escaped. If those fields ever contain HTML angle brackets, the Telegram message formatting could break or be exploited.

6. **CloudStorage absence**: If MAX Bridge does not implement `CloudStorage`, the `if (webApp?.CloudStorage)` guards in `useCartPersistence.ts` will fall through to localStorage. This is handled correctly and requires no code change.

7. **Theme params**: `useTelegramWebApp.ts` reads `tg.themeParams.bg_color`, `text_color`, `button_color`, `button_text_color` to set CSS custom properties. If MAX Bridge provides different param names or no theme params, the CSS vars won't be set — but these vars are not critical to the UI (the app has its own color scheme in Tailwind).

---

## 8. Constraints & Infrastructure

- **No automated tests** — all verification is manual in the Mini App environment.
- **No CI/CD** — manual deploy: SSH + `docker-compose up --build -d`.
- **Backend env vars**: `BOT_TOKEN` (used in both aiogram polling and `notifications.py`), `APP_URL` (Mini App URL for the /start keyboard button).
- **aiogram dependency**: Listed in `api/requirements.txt`. After migration, the import chain is: `main.py` → aiogram Bot/Dispatcher, `auth.py` → `aiogram.utils.web_app.safe_parse_webapp_init_data`, `notifications.py` → `aiogram.Bot`. All three files need to have aiogram replaced.
- **Docker**: Backend runs in a single container that starts both FastAPI and aiogram polling via `asyncio.gather(run_bot(), run_fastapi())`. After removing aiogram, `run_bot()` function and `asyncio.gather` pattern need rethinking — the bot polling loop will be replaced by webhook-based or httpx calls.
- **Image path**: Welcome photo at `api/images/fanfan-main.jpg` (relative to `main.py` via `os.path.dirname(__file__)`). This path is filesystem-based and unrelated to platform — stays the same.
