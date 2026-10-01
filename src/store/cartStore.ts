import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import type { CartItem } from '@/@types/cart'
import type { Product } from '@/@types/product'
import { stockOf } from '@/utils/productStock'

interface CartState {
    items: CartItem[]
    addItem: (product: Product, variantId: string, quantity?: number) => void
    removeItem: (lineId: string) => void
    /**
     * Sets a line's quantity; below 1 removes the line. `max` is the live cap of the line (its
     * variant's stock); it never goes above `MAX_LINE_QUANTITY`.
     */
    updateQuantity: (lineId: string, quantity: number, max?: number) => void
    clear: () => void
}

export interface CartActions {
    addItem: CartState['addItem']
    removeItem: CartState['removeItem']
    updateQuantity: CartState['updateQuantity']
    clear: CartState['clear']
}

export const MAX_LINE_QUANTITY = 99
/** v1 of the Galpa cart: lines keyed by product and variant, with their stock mode. */
const CART_VERSION = 1

/** One line per product and variant. */
function buildLineId(productId: string, variantId: string): string {
    return `${productId}:${variantId}`
}

function clampQuantity(quantity: number, stock: number): number {
    const ceiling = Math.min(stock, MAX_LINE_QUANTITY)
    return Math.max(1, Math.min(Math.trunc(quantity), ceiling))
}

function createLine(product: Product, variantId: string, quantity: number): CartItem | null {
    const variant = product.variants.find((candidate) => candidate.id === variantId)
    // A sold-out version cannot be added (the server would refuse it at checkout anyway).
    if (!variant || stockOf(product, variant) <= 0) return null

    return {
        lineId: buildLineId(product.id, variant.id),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        brand: product.brand,
        model: product.model,
        variantId: variant.id,
        variantLabel: variant.label,
        imageUrl: product.images.at(0)?.url,
        unitPrice: product.price + variant.priceDelta,
        quantity: clampQuantity(quantity, stockOf(product, variant)),
        stockMode: product.stockMode,
        leadTimeDays: product.leadTimeDays,
    }
}

function isCartItem(value: unknown): value is CartItem {
    const item = value as Partial<CartItem> | null
    return (
        typeof item?.productId === 'string' &&
        typeof item.variantId === 'string' &&
        typeof item.quantity === 'number' &&
        (item.stockMode === 'STOCK' || item.stockMode === 'ON_ORDER')
    )
}

/** Anything unreadable (an older or hand-edited payload) is dropped. */
function migrateCart(persisted: unknown): { items: CartItem[] } {
    const raw = (persisted as { items?: unknown } | null)?.items
    return { items: Array.isArray(raw) ? raw.filter(isCartItem) : [] }
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],

            addItem: (product, variantId, quantity = 1) =>
                set((state) => {
                    const line = createLine(product, variantId, quantity)
                    if (!line) return state
                    const variant = product.variants.find((item) => item.id === variantId)
                    const cap = Math.min(stockOf(product, variant), MAX_LINE_QUANTITY)
                    const current = state.items.find((item) => item.lineId === line.lineId)
                    if (!current) {
                        return { items: [...state.items, line] }
                    }
                    if (cap <= current.quantity) return state
                    return {
                        items: state.items.map((item) =>
                            item.lineId === line.lineId
                                ? {
                                      ...item,
                                      quantity: clampQuantity(item.quantity + quantity, cap),
                                  }
                                : item,
                        ),
                    }
                }),

            removeItem: (lineId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.lineId !== lineId),
                })),

            updateQuantity: (lineId, quantity, max = MAX_LINE_QUANTITY) =>
                set((state) => {
                    if (quantity < 1) {
                        return { items: state.items.filter((item) => item.lineId !== lineId) }
                    }
                    const current = state.items.find((item) => item.lineId === lineId)
                    if (!current) return state
                    // Going down is always allowed (it is how an over-stock line is fixed);
                    // going up stops at the cap.
                    const next =
                        quantity > current.quantity
                            ? clampQuantity(quantity, Math.max(max, current.quantity))
                            : clampQuantity(quantity, MAX_LINE_QUANTITY)
                    if (next === current.quantity) return state

                    return {
                        items: state.items.map((item) =>
                            item.lineId === lineId ? { ...item, quantity: next } : item,
                        ),
                    }
                }),

            clear: () => set({ items: [] }),
        }),
        {
            name: 'galpa-cart',
            version: CART_VERSION,
            partialize: (state) => ({ items: state.items }),
            migrate: migrateCart,
            merge: (persisted, current) => ({ ...current, ...migrateCart(persisted) }),
        },
    ),
)

export function useCartItems(): CartItem[] {
    return useCartStore((state) => state.items)
}

export function useCartCount(): number {
    return useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0))
}

export function useCartSubtotal(): number {
    return useCartStore((state) =>
        state.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    )
}

/** Some line is sold "bajo pedido": checkout and the order page explain the wait. */
export function useCartHasOnOrderItems(): boolean {
    return useCartStore((state) => state.items.some((item) => item.stockMode === 'ON_ORDER'))
}

export function useCartActions(): CartActions {
    return useCartStore(
        useShallow((state) => ({
            addItem: state.addItem,
            removeItem: state.removeItem,
            updateQuantity: state.updateQuantity,
            clear: state.clear,
        })),
    )
}
