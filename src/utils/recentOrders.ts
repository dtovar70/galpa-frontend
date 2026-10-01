/**
 * "Mis pedidos recientes": the private links of the orders placed from this browser, so the
 * customer can come back without an account. Browser storage can be missing or throw (private
 * windows, blocked site data), so every access is guarded and failures are silent.
 */
export interface RecentOrder {
    code: string
    token: string
    /** ISO date the order was placed. */
    createdAt: string
    totalUsd: number
}

const STORAGE_KEY = 'galpa-recent-orders'
const MAX_ORDERS = 10

function isRecentOrder(value: unknown): value is RecentOrder {
    if (typeof value !== 'object' || value === null) return false
    const order = value as Record<string, unknown>
    return (
        typeof order.code === 'string' &&
        typeof order.token === 'string' &&
        typeof order.createdAt === 'string' &&
        typeof order.totalUsd === 'number'
    )
}

export function readRecentOrders(): RecentOrder[] {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        const parsed: unknown = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed.filter(isRecentOrder) : []
    } catch {
        return []
    }
}

function write(orders: RecentOrder[]): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, MAX_ORDERS)))
    } catch {
        // Storage unavailable or full: the link still works, it is just not remembered.
    }
}

/** Adds (or refreshes) an order at the top of the list. */
export function rememberOrder(order: RecentOrder): void {
    write([order, ...readRecentOrders().filter((item) => item.code !== order.code)])
}

export function forgetOrder(code: string): void {
    write(readRecentOrders().filter((item) => item.code !== code))
}
