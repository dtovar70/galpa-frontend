import type { OrderLineProblem } from '@/@types/order'
import { isApiError, type ApiError } from '@/services/errors'
import { ORDER_ITEMS_INVALID } from '@/views/checkout/hooks/useCreateOrder'

function isLineProblem(value: unknown): value is OrderLineProblem {
    if (typeof value !== 'object' || value === null) return false
    const line = value as Record<string, unknown>
    return typeof line.index === 'number' && typeof line.message === 'string'
}

/** Whether the API refused the order because of its lines (stock, hidden product). */
export function isLineProblemsError(error: unknown): error is ApiError {
    return isApiError(error, 400) && error.code === ORDER_ITEMS_INVALID
}

/** Per-line problems of a 400 `ORDER_ITEMS_INVALID` (stock, hidden product, variant gone). */
export function lineProblemsOf(error: unknown): OrderLineProblem[] {
    if (!isLineProblemsError(error)) return []
    const lines = error.payload.lines
    return Array.isArray(lines) ? lines.filter(isLineProblem) : []
}
