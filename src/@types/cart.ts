import type { CategorySlug, StockMode } from '@/@types/product'

/**
 * A cart line stores a render-ready snapshot instead of the whole product so the persisted
 * payload stays small and survives catalog changes. A line is identified by its product and
 * variant: adding the same pair again only raises the quantity.
 */
export interface CartItem {
    lineId: string
    productId: string
    slug: string
    name: string
    category: CategorySlug
    brand: string
    model: string | null
    variantId: string
    variantLabel: string
    /** First product photo at the time it was added; absent when the product has none. */
    imageUrl?: string
    unitPrice: number
    quantity: number
    stockMode: StockMode
    /** Days until an on-order line arrives (null when unknown). */
    leadTimeDays: number | null
}

export interface CartLineTotals {
    subtotal: number
    itemCount: number
    shipping: number
    total: number
}

/** Live stock of one cart line (`POST /products/availability`). */
export interface CartAvailability {
    productId: string
    /** Null for a product without variants. */
    variantId: string | null
    /** Units left of the variant (or of the product without variants). */
    stock: number
    isActive: boolean
    /** False when the product or its variant was deleted. */
    exists: boolean
}
