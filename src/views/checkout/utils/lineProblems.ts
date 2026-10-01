import type { OrderLineProblem } from '@/@types/order'
import { isApiError, type ApiError } from '@/services/errors'
import {
    ORDER_DESIGN_INVALID,
    ORDER_DESIGN_USED,
    ORDER_ITEMS_INVALID,
} from '@/views/checkout/hooks/useCreateOrder'

function isLineProblem(value: unknown): value is OrderLineProblem {
    if (typeof value !== 'object' || value === null) return false
    const line = value as Record<string, unknown>
    return typeof line.index === 'number' && typeof line.message === 'string'
}

/** Whether the API refused the order because of its lines (stock or designs). */
export function isLineProblemsError(error: unknown): error is ApiError {
    return (
        (isApiError(error, 400) &&
            (error.code === ORDER_ITEMS_INVALID || error.code === ORDER_DESIGN_INVALID)) ||
        (isApiError(error, 409) && error.code === ORDER_DESIGN_USED)
    )
}

/**
 * Per-line problems of a 400 `ORDER_ITEMS_INVALID` (stock, hidden product, variant gone), or of
 * a refused design (400 `ORDER_DESIGN_INVALID`, 409 `ORDER_DESIGN_USED`).
 */
export function lineProblemsOf(error: unknown): OrderLineProblem[] {
    if (!isLineProblemsError(error)) return []
    const lines = error.payload.lines
    return Array.isArray(lines) ? lines.filter(isLineProblem) : []
}
