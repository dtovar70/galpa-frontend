# Manada Russo Creativa — Storefront and admin

React + Vite + TanStack Query + zustand. Talks to the `backend-cups` API (`VITE_API_URL`,
default `http://localhost:3000/api`).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run lint
```

## Orders and payments (Phase 3)

- **Cart and checkout** show the USD total plus an approximate bolívar amount with the current
  BCV rate (`GET /exchange-rate/current`, `useExchangeRate`, `BsApproximation`). The exact Bs
  amount is fixed by the API when the order is created.
- **Checkout** (`/checkout`) sends the form and the cart lines to `POST /orders` (never prices).
  Field errors are pinned on the form; stock problems are shown per cart line with an "Ajustar mi
  carrito" button. If the Pago Móvil content is incomplete, or there is no usable BCV rate, the
  checkout shows a WhatsApp notice instead of taking the order.
- **Order page** (`/pedido/:code?t=<token>`): the private link returned once by the API. It shows
  the status and timeline, the Pago Móvil card (copy buttons and "Copiar todo"), the payment
  deadline, the proof form (reference, bank, phone, date, amount, screenshot) and every later
  status. It polls every 25 s while the payment is being verified and refetches on focus.
- **Late payments**: after the deadline, or once the order expired, the order page still shows
  the proof form ("El plazo venció, pero si ya hiciste el pago súbelo aquí y lo verificaremos")
  with a WhatsApp link; the API flags the payment as late. A cancelled order shows a WhatsApp
  notice instead ("Si hiciste un pago, escríbenos").
- **Personalization**: products tagged `personalizable` show an optional "Personalización" field
  (140 characters, counter, the product's print text as the example) and a WhatsApp link
  pre-filled with the product name. The text is part of the cart line identity (same product and
  variant with two texts are two lines), shows in the cart, drawer, checkout summary and order
  page, and is edited from the cart page. The persisted cart is version 2 (`migrate` keeps v1
  lines, without personalization). The order page links to WhatsApp with the order code for
  more details.
- **Mis pedidos** (`/mis-pedidos`, linked in the footer): the links of the orders placed from this
  browser, kept in `localStorage` (`manada-russo-recent-orders`; every access is guarded).
- **Admin**: `/admin/pedidos` (status chips with counts, a "Reembolsos pendientes" chip, search,
  dates, table or cards by width, flags per order: late payment, missing stock, pending refund,
  duplicate reference, amount off), `/admin/pedidos/:code` (alerts for late payments, stock
  conflicts and pending refunds; payments with the private screenshot viewer and their flags;
  each item's personalization with a copy button; actions through `ConfirmDialog`: confirming a
  payment with missing stock needs "Entiendo que falta stock", cancelling an order with a
  payment asks "¿Hay que devolver dinero al cliente?", "Reactivar pedido" (can be forced when
  stock is missing), "Registrar pago manualmente" (same form as the customer's) and "Marcar
  reembolso realizado"; history, internal notes) and `/admin/tasa-bcv` (current rate, last 30, manual
  rate for ADMIN, "Actualizar ahora"). The "Pedidos" nav item shows the number of payments waiting
  for verification (polled every 30 s).

- **Avisar por WhatsApp** (admin order detail): renders the current status's message on the API
  (with a fresh customer link), lets the owner edit it, and offers "Abrir WhatsApp" (a `wa.me`
  link in a new tab, which also leaves an internal note) and "Copiar mensaje". Without a mobile
  phone only copying is offered. The templates are edited in Catálogos → Estados de pedido
  (placeholder chips, counter, chat-bubble preview with sample data;
  `views/admin/catalogs/utils/whatsappTemplate.ts` mirrors the API's rules).
- **Descargar comprobante**: the purchase receipt PDF, on the customer's order page and the admin
  detail once the payment is verified (`receiptAvailable`).

- **Order QR** (`qrcode`, `utils/orderQr.ts`, `useOrderQr`; error correction M, quiet zone,
  black on white). The order page shows "Abre tu pedido desde tu teléfono" with the QR of the page's
  own link and "Descargar QR" (`pedido-MR-000012.png`); below 1024px it starts collapsed ("Ver
  QR"). The admin detail has "QR del pedido": a fresh customer link as a QR, "Descargar PNG" and
  "Imprimir etiqueta" (a new window with a 6×4 cm label: QR, code, customer, brand;
  `views/admin/orders/utils/printOrderLabel.ts`). The receipt PDF carries the QR too (API).

**Field lengths.** `Input` caps text-like types (text, email, search, tel, url) at 100 characters
(`TEXT_INPUT_MAX_LENGTH`) unless a smaller `maxLength` is passed; `Textarea` requires `maxLength`.
Both show a "87/100" counter past 80% of limits of 20 or more (`showCount` shows it always). The zod
schemas and the API use the same limits.

**Admin login URL.** The address bar always reads `/admin/login`: the page to return to (`next`) and
why the session ended (`reason`) travel in navigation state (`adminLoginState`). Old
`?next=`/`?reason=` links are honored once and replaced with the clean URL.

**Password recovery** (`/admin/recuperar`, `AdminPasswordRecoveryView`): "¿Olvidaste tu
contraseña?" under the login form. Step 1 asks for the email and always shows the same notice (plus
"¿No tienes Telegram vinculado?…"); step 2 takes the 6-digit code from the Telegram bot and the
new password (the Users page's `PasswordField` with strength hint, plus the repeat). Both steps
live in component state, so the URL stays clean; success goes to `/admin/login` with a success
notice (`notice: 'password-reset'` in the navigation state). No auto-login. The login page also
says "¿No recuerdas tu correo? Pídeselo a un administrador." (there is deliberately no public
email lookup). Both pages share `views/admin/auth/components/AdminAuthCard.tsx`.

## Telegram (Phase 4)

ADMIN users manage the Telegram bot at `/admin/telegram` ("Telegram" in the sidebar, `Send`
icon, hidden for EDITOR). The page reads `GET /admin/telegram` (`useAdminTelegram`,
`AdminTelegramService`, types in `@types/telegram.ts`):

- **Bot status**: connected or not, `@username` (links to `t.me`), name, mode (Polling/Webhook)
  and the API's Spanish `error` when it is not connected. "Actualizar" refetches.
- **Vincular un chat** (disabled while the bot is down): `POST /admin/telegram/link-codes` returns
  a 6-digit code. The page shows it (copyable), the `/start <code>` command (copyable), an
  "Abrir en Telegram" deep link and a countdown ("El código vence en 9:41"; the deadline is
  computed from `expiresInSeconds`, so the device clock does not matter). While the code is valid
  the list is polled every 4 s; the first chat linked in that window (a new id, or a `linkedAt`
  after the code was issued) replaces the code with "¡Listo! Chat vinculado 🎉" and stops polling.
  An expired code shows "El código venció. Genera uno nuevo."
- **Chats vinculados**: name, `@username`, "Inactivo" when the chat blocked the bot, linked
  date and who linked it, last activity. Each chat has the "Nuevos pedidos" switch (optimistic,
  rolled back with an error notice), "Enviar mensaje de prueba" (shows the API's message on
  502/503) and "Desvincular" (`ConfirmDialog`).
- Payment notifications go to every linked chat; "Nuevos pedidos" also sends each new order;
  approving in Telegram updates the website right away.

## Users and "Mi cuenta"

ADMIN users manage the panel accounts at `/admin/usuarios` ("Usuarios" in the sidebar, `Users`
icon, before "Telegram", hidden for EDITOR; `useAdminUsers`, `AdminUsersService`, types in
`@types/user.ts`):

- **List** (table or cards by the width the list gets, like Productos): name, email, role badge
  (Administrador / Editor), status (Activo / Inactivo), last access ("Nunca" if never) and the
  Telegram chats the user linked. Search by name or email; the URL keeps the search and page.
  The signed-in admin's row says "(tú)"; its "Restablecer contraseña" and "Desactivar" are
  disabled (still focusable) with a tooltip saying why.
- **Nuevo usuario / Editar**: name, email, role (the custom `Select`, whose options can now carry
  a `description` line) and, for new users, the password with show/hide, a strength hint with
  the policy checklist, and "Generar contraseña segura" (14 random characters from
  `crypto.getRandomValues`, no look-alikes) plus a copy button. After creating, a one-time panel
  shows the email and password to copy ("Copiar mensaje con el acceso" adds the login link) and
  asks to share them privately and have the person change the password from "Mi cuenta".
- **Restablecer contraseña**: same generator, a warning that it closes that user's sessions,
  then the same one-time panel.
- **Desactivar / Activar** (`ConfirmDialog`): users are never deleted. The page explains it:
  deactivating blocks the login, closes the sessions and mutes the Telegram chats the user
  linked, while the order history keeps showing who did what. Activating does not switch those
  chats back on.

**Mi cuenta** (`/admin/cuenta`, every role): change your name and your password (current, new,
repeat), each with a success `Alert` with countdown. Changing the password closes your other
sessions; this one stays signed in. It opens from the name/avatar area of the sidebar user row
(a tooltip in the collapsed rail); the logout button is unchanged. On windows shorter than
800px the collapsed rail's links are 44px tall, so the rail never scrolls at 1280×720.

## Catalogs

Order status labels, badge colors, customer texts and the admin order tabs come from
`GET /catalogs/order-statuses` (`useOrderStatusCatalog`, loaded once per session). Only the status
codes stay in code (`ORDER_STATUSES`): if the catalog cannot be loaded, pages show the codes
prettified ("Pendiente pago") instead of crashing. The banks of the Pago Móvil selects (payment
form, "Registrar pago manualmente", Contenido → Pago Móvil) come from `GET /catalogs/banks`
(`useBanks`); the mobile operator codes from `GET /catalogs/mobile-prefixes`
(`useMobilePrefixes`). ADMIN users edit them at `/admin/catalogos` ("Catálogos"): status names,
tones and customer texts with a live preview, tab names and order, banks (add, rename, activate,
reorder, delete when unused) and "Códigos de celular" (`?seccion=celulares`: add, activate,
reorder, delete when no order in progress or store phone uses it). Codes, the tab of each status
and "final" are shown locked.

**Phone and cédula fields** (`components/shared`, used through a react-hook-form `Controller`;
formats and zod rules in `utils/veFormats.ts`):

- `MobilePhoneField`: operator code select (active codes; a stored inactive one still shows as
  "No disponible") plus the 7 digits. Only digits can be typed; pasting or autofilling
  "04241234567", "0424-1234567" or "+58 424 1234567" fills both parts. Emits "0424-1234567" or
  "". Used by Contenido → Pago Móvil "Teléfono" and Contacto "WhatsApp", the checkout "Celular"
  (mobiles only now) and the payment form "Teléfono del pagador" (also "Registrar pago
  manualmente"). Contacto "Teléfono" stays a plain input: it takes landlines.
- `IdNumberField`: letter (V, J, G; V by default) plus up to 9 digits; pasting "v12345678" or
  "V-12.345.678" normalizes. Emits "V-12345678" or "". Used by Pago Móvil "Cédula o RIF" and the
  optional "Cédula del pagador".
