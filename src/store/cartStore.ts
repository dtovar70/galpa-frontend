import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import type { CartItem } from '@/@types/cart'
import type { CartDesign } from '@/@types/design'
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
        design?: CartDesign | null,
    ) => void
    removeItem: (lineId: string) => void
    /**
     * Sets a line's quantity; below 1 removes the line. `max` is the live cap of the line (its
     * variant's stock minus the other lines of that variant); it never goes above
     * `MAX_LINE_QUANTITY`.
     */
    updateQuantity: (lineId: string, quantity: number, max?: number) => void
    /** Changes a line's text; a line with the same product, variant and text absorbs it. */
    updatePersonalization: (lineId: string, personalization: string) => void
    /** Drops a line's own design (e.g. the API refused it); it may merge into a plain line. */
    removeDesign: (lineId: string) => void
    clear: () => void
}

export interface CartActions {
    addItem: CartState['addItem']
    removeItem: CartState['removeItem']
    updateQuantity: CartState['updateQuantity']
    updatePersonalization: CartState['updatePersonalization']
    removeDesign: CartState['removeDesign']
    clear: CartState['clear']
}

export const MAX_LINE_QUANTITY = 99
/** v3: lines may carry a design (`design`, part of the line id). */
const CART_VERSION = 3

/** Trimmed, inner whitespace collapsed and cut to the API limit. */
export function normalizePersonalization(text: string | undefined): string {
    return (text ?? '').trim().replace(/\s+/g, ' ').slice(0, PERSONALIZATION_MAX_LENGTH)
}

/**
 * The text and the design are part of the identity: the same mug with two names (or two images)
 * is two lines. The text is URI-encoded, so it never contains the `:design:` separator.
 */
function buildLineId(
    productId: string,
    variantId: string,
    personalization: string,
    designId?: string | null,
): string {
    const base = personalization
        ? `${productId}:${variantId}:${encodeURIComponent(personalization)}`
        : `${productId}:${variantId}`
    return designId ? `${base}:design:${designId}` : base
}

function isCartDesign(value: unknown): value is CartDesign {
    const design = value as Partial<CartDesign> | null
    return (
        typeof design?.id === 'string' &&
        typeof design.previewPath === 'string' &&
        design.previewPath.startsWith('/designs/')
    )
}

/** The design as stored (a stored garment color is kept only when it is well formed). */
function toCartDesign(value: unknown): CartDesign | null {
    if (!isCartDesign(value)) return null
    const { color, ...design } = value
    const validColor =
        typeof color?.name === 'string' &&
        typeof color.hex === 'string' &&
        /^#[0-9A-Fa-f]{6}$/.test(color.hex)
    return validColor ? { ...design, color: { name: color.name, hex: color.hex } } : design
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

/** Swaps a line for its edited copy, in place unless it merges into another line. */
function replaceLine(items: CartItem[], lineId: string, updated: CartItem): CartItem[] {
    const others = items.filter((item) => item.lineId !== lineId)
    if (others.some((item) => item.lineId === updated.lineId)) {
        return mergeLine(others, updated, MAX_LINE_QUANTITY)
    }
    return items.map((item) => (item.lineId === lineId ? updated : item))
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
    rawDesign: CartDesign | null | undefined,
): CartItem | null {
    const variant = product.variants.find((candidate) => candidate.id === variantId)
    // A sold-out version cannot be added (the server would refuse it at checkout anyway).
    if (!variant || stockOf(product, variant) <= 0) return null
    const personalizable = product.tags.includes('personalizable')
    const personalization = personalizable ? normalizePersonalization(rawPersonalization) : ''
    const design = personalizable ? toCartDesign(rawDesign) : null

    return {
        lineId: buildLineId(product.id, variant.id, personalization, design?.id),
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
        design,
    }
}

/**
 * v1 lines had no personalization. They keep their id shape (`product:variant`) and cannot
 * be edited from the cart, since the product tags were not stored. v2 lines had no design: they
 * keep their ids and get `design: null`. Anything unreadable is dropped.
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
                const design = toCartDesign(item.design)
                return {
                    ...(item as CartItem),
                    personalization,
                    personalizable: item.personalizable === true,
                    design,
                    lineId: buildLineId(
                        item.productId,
                        item.variantId,
                        personalization,
                        design?.id,
                    ),
                }
            }),
    }
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],

            addItem: (product, variantId, quantity = 1, personalization, design) =>
                set((state) => {
                    const line = createLine(product, variantId, quantity, personalization, design)
                    if (!line) return state
                    const variant = product.variants.find((item) => item.id === variantId)
                    // Lines of the same variant (other texts) share its stock.
                    const otherUnits = state.items
                        .filter(
                            (item) =>
                                item.lineId !== line.lineId &&
                                item.productId === line.productId &&
                                item.variantId === line.variantId,
                        )
                        .reduce((sum, item) => sum + item.quantity, 0)
                    const cap = stockOf(product, variant) - otherUnits
                    const current = state.items.find((item) => item.lineId === line.lineId)
                    if (cap <= (current?.quantity ?? 0)) return state
                    return {
                        items: mergeLine(
                            state.items,
                            { ...line, quantity: clampQuantity(line.quantity, cap) },
                            cap,
                        ),
                    }
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
                        current.design?.id,
                    )
                    if (nextId === lineId) return state
                    return {
                        items: replaceLine(state.items, lineId, {
                            ...current,
                            personalization,
                            lineId: nextId,
                        }),
                    }
                }),

            removeDesign: (lineId) =>
                set((state) => {
                    const current = state.items.find((item) => item.lineId === lineId)
                    if (!current?.design) return state
                    const nextId = buildLineId(
                        current.productId,
                        current.variantId,
                        current.personalization,
                    )
                    return {
                        items: replaceLine(state.items, lineId, {
                            ...current,
                            design: null,
                            lineId: nextId,
                        }),
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
            removeDesign: state.removeDesign,
            clear: state.clear,
        })),
    )
}
