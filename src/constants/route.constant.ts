import type { CategorySlug } from '@/@types/product'

export const ROUTES = {
    home: '/',
    catalog: '/catalogo',
    catalogByCategory: '/catalogo/:category',
    product: '/producto/:slug',
    cart: '/carrito',
    checkout: '/checkout',
    order: '/pedido/:code',
    myOrders: '/mis-pedidos',
    about: '/nosotros',
    contact: '/contacto',
    notFound: '*',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]

/**
 * Back office. Deliberately not linked from the storefront: staff reach it by URL.
 */
export const ADMIN_ROUTES = {
    login: '/admin/login',
    /** "¿Olvidaste tu contraseña?": code by Telegram, then a new password. */
    recover: '/admin/recuperar',
    root: '/admin',
    orders: '/admin/pedidos',
    orderDetail: '/admin/pedidos/:code',
    exchangeRate: '/admin/tasa-bcv',
    products: '/admin/productos',
    productNew: '/admin/productos/nuevo',
    productEdit: '/admin/productos/:id',
    categories: '/admin/categorias',
    content: '/admin/contenido',
    catalogs: '/admin/catalogos',
    telegram: '/admin/telegram',
    users: '/admin/usuarios',
    account: '/admin/cuenta',
} as const

export function adminOrderPath(code: string): string {
    return `/admin/pedidos/${encodeURIComponent(code)}`
}

export function adminProductPath(id: string): string {
    return `/admin/productos/${encodeURIComponent(id)}`
}

/**
 * What the login page receives in navigation `state` (never in the query string, so the
 * address bar always reads `/admin/login`): `next` is the admin path to return to once
 * signed in; `reason` explains why the session ended (e.g. `inactividad`). History state
 * survives a reload in most browsers but not every one, so both are best-effort.
 */
export interface AdminLoginState {
    next?: string
    reason?: string
    /** A success notice to show once, e.g. after resetting the password. */
    notice?: AdminLoginNotice
}

export type AdminLoginNotice = 'password-reset'

/** Navigation state for `navigate(ADMIN_ROUTES.login, { state })` and `<Navigate state>`. */
export function adminLoginState(
    next?: string,
    reason?: string,
    notice?: AdminLoginNotice,
): AdminLoginState {
    const state: AdminLoginState = {}
    if (next) state.next = next
    if (reason) state.reason = reason
    if (notice) state.notice = notice
    return state
}

/** Sandboxes for reviewing UI in isolation. Wired into the router only in development. */
export const DEV_ROUTES = {
    loaderPreview: '/dev/loader',
} as const

/** The customer's private order page: `/pedido/MR-000123?t=<token>`. */
export function orderPath(code: string, token: string): string {
    return `/pedido/${encodeURIComponent(code)}?t=${encodeURIComponent(token)}`
}

export function productPath(slug: string): string {
    return `/producto/${slug}`
}

export function categoryPath(slug: CategorySlug): string {
    return `/catalogo/${encodeURIComponent(slug)}`
}
