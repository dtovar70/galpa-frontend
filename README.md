# Corporación Galpa 2022 C.A. — Storefront and admin

Storefront and back office of Galpa, a distributor of air conditioners (residential and
commercial), spare parts and accessories with 30 years of experience. React 19 + Vite + react-router
data router + TanStack Query + zustand + react-hook-form/zod + Tailwind v4. Talks to the
`backend-galpa` API (`VITE_API_URL`, default `http://localhost:3000/api`).

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
npm run build      # typecheck + production build
```

## Design system

- Tokens live in `src/index.css` (`@theme`): brand green scale `brand-50…900` (500 = `#10B981`),
  ink `#0A0F0D`, dark surface `#111814`, frost accent `#38BDF8`, `warning` (amber, "Bajo pedido"),
  `danger`, neutrals (`page`, `mist`, `line`, `line-strong`, `ink-soft`, `ink-muted`), shadows
  (`soft`, `lift`, `glow` for the primary CTA).
- Fonts: Plus Jakarta Sans for the whole UI (headings use its heavier weights) and Space Grotesk
  (`font-tech`) for BTU, prices and codes. Loaded in `index.html`.
- Hand-made UI kit in `src/components/ui` (`Button` variants `primary`, `secondary`, `dark`,
  `outline-light`, `ghost`, `info`, `whatsapp`, `danger`; `Badge` tones `brand`, `warning`, `info`,
  `danger`, `neutral`, `outline`, `solid`). The API's stored status tones are painted through
  `constants/tone.constant.ts`.
- Loader: `components/shared/AirFlowLoader.tsx` (spinning turbine plus airflow waves, pure
  SVG/CSS, static with reduced motion) inside `RouteFallback` (180 ms delay, global loading
  store). Preview it at `/dev/loader` in development.
- Brand mark: `components/shared/BrandMark.tsx` (same drawing as `public/favicon.svg`).

## Storefront

- **Catalog** (`/catalogo`, `/catalogo/:category`): filters synced to the URL
  (`useCatalogFilters`): category, brand (multi, from `GET /products/facets`), availability, BTU
  (chips from the facets, or a range from the home calculator: `?btuMin=&btuMax=`), voltage,
  inverter only, price bracket and tags. Products without photos show a per-category line-art
  placeholder (`ProductPlaceholder`).
- **Product page**: gallery, brand/model/SKU, availability (en stock / bajo pedido with lead time /
  agotado), variants, ficha técnica (structured fields plus `specs`), "Solicitar asesoría"
  (WhatsApp prefilled with the product, or `/asesoria?producto=<slug>`), related products.
- **Cart** (`galpa-cart` in `localStorage`): one line per product and variant. Stock checks only
  apply to `STOCK` items; on-order lines show their lead time.
- **Checkout**: delivery method, optional cédula/RIF, "Deseo asesoría para la instalación", and a
  payment method picker with only the configured methods (Pago Móvil and transferencia in Bs at the
  BCV rate, hidden while there is no rate; Zelle and Binance in USD).
- **Order page** (`/pedido/:code?t=<token>`): payment instructions for the order's method (copy
  buttons, exact amount in its currency), method switch while waiting for or after a rejected
  payment, method-specific proof form, timeline (pickup vs delivery, "Esperando mercancía" only for
  on-order items), receipt PDF, QR.
- **Home**: dark hero, trust figures, categories, featured products, BTU calculator, why choose us
  (the content's `steps`), brands strip, testimonials and a WhatsApp CTA.
- **Asesoría y contacto** (`/asesoria`, `/contacto` redirects): topic, space type, area, linked
  product, FAQ. A floating WhatsApp button shows on every public page.

## Admin (`/admin`)

Orders (method, currency-aware amounts, new statuses and transitions, on-order and installation
flags, manual payments for any method), **Cotizaciones** (`/admin/cotizaciones`: list with status
filter and search, editor with catalog or free lines, live USD/Bs totals, PDF, email, WhatsApp,
status changes and conversion into an order), products (brand, model, SKU, stock mode and lead
time, BTU, voltage, inverter, refrigerant, ficha técnica editor), categories (icon), content
(payment methods with enable switches and preview, dispatch copy), catalogs, BCV rate, Telegram,
users and "Mi cuenta".

Site content defaults (`configs/content.defaults.ts`) mirror the API's defaults; contact data are
placeholders to be edited from Contenido.
