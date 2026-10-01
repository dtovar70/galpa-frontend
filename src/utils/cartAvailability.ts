import type { CartAvailability, CartItem } from '@/@types/cart'

/** Shown next to a disabled "Ir al checkout" while a line cannot be bought as it is. */
export const CART_STOCK_BLOCKED_MESSAGE =
    'Algunos productos cambiaron de disponibilidad. Ajusta o quita los marcados para continuar.'

/** Lines per availability request (the API's limit, the same as the checkout's). */
export const AVAILABILITY_MAX_LINES = 50

/**
 * Where a line's stock is counted: its variant, or the product without variants.
 */
export function stockKey(productId: string, variantId: string | null | undefined): string {
    return `${productId}:${variantId ?? ''}`
}

/** Distinct stock keys of the cart, sorted (a stable query key whatever the line order). */
export function cartStockKeys(items: readonly CartItem[]): string[] {
    return [...new Set(items.map((item) => stockKey(item.productId, item.variantId)))].sort()
}

/** What is wrong with a line given the live stock; null when it can be bought as it is. */
export type LineStockIssue =
    | { kind: 'unavailable' }
    | { kind: 'soldOut' }
    /**
     * More units than this line can keep. `fixTo` is what it can keep after the earlier lines
     * of the same variant (0: they already take every unit left).
     */
    | { kind: 'overStock'; stock: number; fixTo: number }

export interface LineStock {
    /** Largest quantity the stepper allows now (0 when nothing can be added). */
    max: number
    issue: LineStockIssue | null
}

/**
 * The stepper cap and the stock problem of the line at `index`, with the checkout's rule:
 * lines of the same variant share its stock, and earlier lines keep their units first. On-order
 * lines only need the product to still be sold: they have no stock limit. Without live data for
 * the line (loading, failed) it falls back to `fallbackMax` and no issue: the server still
 * checks the stock at checkout.
 */
export function lineStock(
    items: readonly CartItem[],
    index: number,
    availability: ReadonlyMap<string, CartAvailability> | undefined,
    fallbackMax: number,
): LineStock {
    const item = items[index]
    if (!item) return { max: fallbackMax, issue: null }
    const key = stockKey(item.productId, item.variantId)
    const live = availability?.get(key)
    if (!live) return { max: fallbackMax, issue: null }
    if (!live.exists || !live.isActive) return { max: 0, issue: { kind: 'unavailable' } }
    if (item.stockMode === 'ON_ORDER') return { max: fallbackMax, issue: null }

    const stock = Math.max(0, live.stock)
    if (stock === 0) return { max: 0, issue: { kind: 'soldOut' } }

    let earlier = 0
    let others = 0
    items.forEach((other, otherIndex) => {
        if (otherIndex === index || stockKey(other.productId, other.variantId) !== key) return
        others += other.quantity
        if (otherIndex < index) earlier += other.quantity
    })
    const max = Math.max(0, Math.min(fallbackMax, stock - others))
    const keeps = Math.max(0, Math.min(fallbackMax, stock - earlier))
    return {
        max,
        issue: item.quantity > keeps ? { kind: 'overStock', stock, fixTo: keeps } : null,
    }
}

/** Units of one variant (or product without variants) already in the cart, across lines. */
export function cartUnitsOf(
    items: readonly CartItem[],
    productId: string,
    variantId: string | undefined,
): number {
    const key = stockKey(productId, variantId)
    return items.reduce(
        (sum, item) =>
            stockKey(item.productId, item.variantId) === key ? sum + item.quantity : sum,
        0,
    )
}
