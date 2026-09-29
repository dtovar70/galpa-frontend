import type { StockConflictLine } from '@/@types/order'

/** "Franela X – Talla M" (just the product name on lines without a variant). */
export function stockLineName(line: StockConflictLine): string {
    return line.variantLabel ? `${line.productName} – ${line.variantLabel}` : line.productName
}

/** "Franela X – Talla M pidió 3, hay 1" (one line of a stock conflict). */
export function describeStockLine(line: StockConflictLine): string {
    return `${stockLineName(line)} pidió ${line.requested}, hay ${line.available}`
}

/** Lines still missing units once the conflict was acknowledged. */
export function missingUnits(line: StockConflictLine): number {
    return Math.max(0, line.requested - line.reserved)
}
