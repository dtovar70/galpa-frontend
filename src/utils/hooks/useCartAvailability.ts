import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { CartAvailability, CartItem } from '@/@types/cart'
import { queryKeys } from '@/constants/query-keys.constant'
import { ProductService } from '@/services/ProductService'
import { MAX_LINE_QUANTITY } from '@/store/cartStore'
import {
    AVAILABILITY_MAX_LINES,
    cartStockKeys,
    lineStock,
    stockKey,
    type LineStock,
} from '@/utils/cartAvailability'

/** Stock changes with every order: a short cache, refreshed on focus and on open. */
const AVAILABILITY_STALE_MS = 15_000

export interface CartAvailabilityResult {
    /** Stepper cap and stock problem of each line, by `lineId`. */
    lines: ReadonlyMap<string, LineStock>
    /** Some line is sold out, gone or over the stock left: checkout would refuse it. */
    hasIssues: boolean
}

/**
 * Live stock of the cart lines (`POST /products/availability`), fetched while `enabled` (the
 * drawer or the cart page is open). Cart lines keep no stock of their own. While loading or
 * after a failed call every line falls back to `MAX_LINE_QUANTITY` and nothing is blocked: the
 * checkout still validates the stock on the server.
 */
export function useCartAvailability(
    items: readonly CartItem[],
    enabled = true,
): CartAvailabilityResult {
    const { keys, requests } = useMemo(() => {
        const firstByKey = new Map(
            items.map((item) => [stockKey(item.productId, item.variantId), item] as const),
        )
        const keys = cartStockKeys(items).slice(0, AVAILABILITY_MAX_LINES)
        const requests = keys.flatMap((key) => {
            const item = firstByKey.get(key)
            if (!item) return []
            return item.variantId
                ? [{ productId: item.productId, variantId: item.variantId }]
                : [{ productId: item.productId }]
        })
        return { keys, requests }
    }, [items])

    const query = useQuery({
        queryKey: queryKeys.products.availability(keys),
        queryFn: ({ signal }) => ProductService.getCartAvailability(requests, signal),
        enabled: enabled && keys.length > 0,
        staleTime: AVAILABILITY_STALE_MS,
        refetchOnWindowFocus: true,
        // A new line changes the key: keep showing the previous answer meanwhile.
        placeholderData: keepPreviousData,
        retry: false,
    })

    return useMemo(() => {
        const byKey = query.isError
            ? undefined
            : new Map<string, CartAvailability>(
                  (query.data ?? []).map((row) => [stockKey(row.productId, row.variantId), row]),
              )
        const lines = new Map<string, LineStock>()
        items.forEach((item, index) => {
            lines.set(item.lineId, lineStock(items, index, byKey, MAX_LINE_QUANTITY))
        })
        const hasIssues = [...lines.values()].some((line) => line.issue !== null)
        return { lines, hasIssues }
    }, [items, query.data, query.isError])
}
