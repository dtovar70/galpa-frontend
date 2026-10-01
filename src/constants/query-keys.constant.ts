import type { AdminProductQueryParams } from '@/@types/admin'
import type { ProductQueryParams } from '@/@types/common'
import type { AdminOrderQueryParams } from '@/@types/order'
import type { AdminUserQueryParams } from '@/@types/user'

/**
 * Hierarchical key factory: every list/detail key starts with its parent key so a
 * single `queryClient.invalidateQueries({ queryKey: queryKeys.products.all })`
 * reaches every product-derived cache entry.
 */
export const queryKeys = {
    products: {
        all: ['products'] as const,
        lists: () => [...queryKeys.products.all, 'list'] as const,
        list: (params: ProductQueryParams) => [...queryKeys.products.lists(), params] as const,
        details: () => [...queryKeys.products.all, 'detail'] as const,
        detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
        featured: (limit?: number) => [...queryKeys.products.all, 'featured', limit] as const,
        related: (slug: string, limit?: number) =>
            [...queryKeys.products.all, 'related', slug, limit] as const,
        /** Live stock of the cart lines; `stockKeys` are the sorted "product:variant" keys. */
        availability: (stockKeys: readonly string[]) =>
            [...queryKeys.products.all, 'availability', stockKeys] as const,
    },
    categories: {
        all: ['categories'] as const,
    },
    /** Editable site content (`GET /content`), loaded once at start-up. */
    content: ['content'] as const,
    /** Business catalogs kept in the API's database, loaded once and rarely refreshed. */
    catalogs: {
        all: ['catalogs'] as const,
        orderStatuses: () => [...queryKeys.catalogs.all, 'order-statuses'] as const,
        banks: () => [...queryKeys.catalogs.all, 'banks'] as const,
        mobilePrefixes: () => [...queryKeys.catalogs.all, 'mobile-prefixes'] as const,
    },
    /** Current BCV rate for the approximate bolívar amounts (`GET /exchange-rate/current`). */
    exchangeRate: ['exchange-rate'] as const,
    /** A customer's order page (`GET /orders/:code?t=`). The token is not part of the key. */
    orders: {
        all: ['orders'] as const,
        detail: (code: string) => [...queryKeys.orders.all, code] as const,
    },
    /** Current admin session (`GET /auth/me`); `null` data means logged out. */
    session: ['session'] as const,
    /** Everything behind the admin login, so logging out can drop it in one call. */
    admin: {
        all: ['admin'] as const,
        products: {
            all: () => [...queryKeys.admin.all, 'products'] as const,
            lists: () => [...queryKeys.admin.products.all(), 'list'] as const,
            list: (params: AdminProductQueryParams) =>
                [...queryKeys.admin.products.lists(), params] as const,
            detail: (id: string) => [...queryKeys.admin.products.all(), 'detail', id] as const,
        },
        categories: () => [...queryKeys.admin.all, 'categories'] as const,
        content: () => [...queryKeys.admin.all, 'content'] as const,
        orders: {
            all: () => [...queryKeys.admin.all, 'orders'] as const,
            lists: () => [...queryKeys.admin.orders.all(), 'list'] as const,
            list: (params: AdminOrderQueryParams) =>
                [...queryKeys.admin.orders.lists(), params] as const,
            detail: (code: string) => [...queryKeys.admin.orders.all(), 'detail', code] as const,
            summary: () => [...queryKeys.admin.orders.all(), 'summary'] as const,
        },
        exchangeRate: () => [...queryKeys.admin.all, 'exchange-rate'] as const,
        banks: () => [...queryKeys.admin.all, 'banks'] as const,
        mobilePrefixes: () => [...queryKeys.admin.all, 'mobile-prefixes'] as const,
        /** The status catalog with the WhatsApp templates (Catálogos). */
        orderStatuses: () => [...queryKeys.admin.all, 'order-statuses'] as const,
        /** Telegram bot status and linked chats (`GET /admin/telegram`). */
        telegram: () => [...queryKeys.admin.all, 'telegram'] as const,
        /** Panel accounts (`GET /admin/users`), ADMIN only. */
        users: {
            all: () => [...queryKeys.admin.all, 'users'] as const,
            list: (params: AdminUserQueryParams) =>
                [...queryKeys.admin.users.all(), 'list', params] as const,
        },
    },
} as const
