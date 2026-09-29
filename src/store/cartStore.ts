import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import type { CartItem } from '@/@types/cart'
import { PERSONALIZATION_MAX_LENGTH } from '@/@types/order'
import type { Product } from '@/@types/product'
import { stockOf } from '@/utils/productStock'

interface CartState {
    items: CartItem[]
    addItem: (
        product: Product,
        variantId: string,
        quantity?: number,
        personalization?: string,
    ) => void
    removeItem: (lineId: string) => void
    updateQuantity: (lineId: string, quantity: number) => void
    /** Changes a line's text; a line with the same product, variant and text absorbs it. */
    updatePersonalization: (lineId: string, personalization: string) => void
    clear: () => void
}

export interface CartActions {
    addItem: CartState['addItem']
    removeItem: CartState['removeItem']
    updateQuantity: CartState['updateQuantity']
    updatePersonalization: CartState['updatePersonalization']
    clear: CartState['clear']
}

export const MAX_LINE_QUANTITY = 99
const CART_VERSION = 2

/** Trimmed, inner whitespace collapsed and cut to the API limit. */
export function normalizePersonalization(text: string | undefined): string {
    return (text ?? '').trim().replace(/\s+/g, ' ').slice(0, PERSONALIZATION_MAX_LENGTH)
}

/** The text is part of the identity: the same mug with two names is two lines. */
function buildLineId(productId: string, variantId: string, personalization: string): string {
    return personalization
        ? `${productId}:${variantId}:${encodeURIComponent(personalization)}`
        : `${productId}:${variantId}`
}

/** Adds `line` to `items`, merging it into an identical line (quantities capped). */
function mergeLine(items: CartItem[], line: CartItem, cap: number): CartItem[] {
    const existing = items.find((item) => item.lineId === line.lineId)
    if (!existing) return [...items, line]
    return items.map((item) =>
        item.lineId === line.lineId
            ? { ...item, quantity: clampQuantity(item.quantity + line.quantity, cap) }
            : item,
    )
}

function clampQuantity(quantity: number, stock: number): number {
    const ceiling = Math.min(stock, MAX_LINE_QUANTITY)
    return Math.max(1, Math.min(Math.trunc(quantity), ceiling))
}

function createLine(
    product: Product,
    variantId: string,
    quantity: number,
    rawPersonalization: string | undefined,
): CartItem | null {
    const variant = product.variants.find((candidate) => candidate.id === variantId)
    // A sold-out version cannot be added (the server would refuse it at checkout anyway).
    if (!variant || stockOf(product, variant) <= 0) return null
    const personalizable = product.tags.includes('personalizable')
    const personalization = personalizable ? normalizePersonalization(rawPersonalization) : ''

    return {
        lineId: buildLineId(product.id, variant.id, personalization),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        variantId: variant.id,
        variantLabel: variant.label,
        colorHex: product.colorHex,
        printText: product.printText,
        imageUrl: product.images.at(0)?.url,
        unitPrice: product.price + variant.priceDelta,
        quantity: clampQuantity(quantity, stockOf(product, variant)),
        personalization,
        personalizable,
    }
}

/**
 * v1 lines had no personalization. They keep their id shape (`product:variant`) and cannot
 * be edited from the cart, since the product tags were not stored; anything unreadable is dropped.
 */
function migrateCart(persisted: unknown, version: number): { items: CartItem[] } {
    const raw = (persisted as { items?: unknown } | null)?.items
    const items = Array.isArray(raw) ? (raw as Partial<CartItem>[]) : []
    if (version >= CART_VERSION) return { items: items as CartItem[] }
    return {
        items: items
            .filter(
                (item): item is Partial<CartItem> & Pick<CartItem, 'productId' | 'variantId'> =>
                    typeof item?.productId === 'string' && typeof item.variantId === 'string',
            )
            .map((item) => {
                const personalization = normalizePersonalization(item.personalization)
                return {
                    ...(item as CartItem),
                    personalization,
                    personalizable: item.personalizable === true,
                    lineId: buildLineId(item.productId, item.variantId, personalization),
                }
            }),
    }
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],

            addItem: (product, variantId, quantity = 1, personalization) =>
                set((state) => {
                    const line = createLine(product, variantId, quantity, personalization)
                    if (!line) return state
                    const variant = product.variants.find((item) => item.id === variantId)
                    return { items: mergeLine(state.items, line, stockOf(product, variant)) }
                }),

            updatePersonalization: (lineId, text) =>
                set((state) => {
                    const current = state.items.find((item) => item.lineId === lineId)
                    if (!current) return state
                    const personalization = normalizePersonalization(text)
                    const nextId = buildLineId(
                        current.productId,
                        current.variantId,
                        personalization,
                    )
                    if (nextId === lineId) return state
                    const updated = { ...current, personalization, lineId: nextId }
                    const others = state.items.filter((item) => item.lineId !== lineId)
                    // Keep the edited line where it was unless it merges into another one.
                    if (others.some((item) => item.lineId === nextId)) {
                        return { items: mergeLine(others, updated, MAX_LINE_QUANTITY) }
                    }
                    return {
                        items: state.items.map((item) => (item.lineId === lineId ? updated : item)),
                    }
                }),

            removeItem: (lineId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.lineId !== lineId),
                })),

            updateQuantity: (lineId, quantity) =>
                set((state) => {
                    if (quantity < 1) {
                        return { items: state.items.filter((item) => item.lineId !== lineId) }
                    }

                    return {
                        items: state.items.map((item) =>
                            item.lineId === lineId
                                ? {
                                      ...item,
                                      quantity: clampQuantity(quantity, MAX_LINE_QUANTITY),
                                  }
                                : item,
                        ),
                    }
                }),

            clear: () => set({ items: [] }),
        }),
        {
            name: 'manada-russo-cart',
            version: CART_VERSION,
            partialize: (state) => ({ items: state.items }),
            migrate: migrateCart,
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

export function useCartActions(): CartActions {
    return useCartStore(
        useShallow((state) => ({
            addItem: state.addItem,
            removeItem: state.removeItem,
            updateQuantity: state.updateQuantity,
            updatePersonalization: state.updatePersonalization,
            clear: state.clear,
        })),
    )
}
