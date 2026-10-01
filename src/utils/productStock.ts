import type { Product, ProductVariant } from '@/@types/product'

type StockSource = Pick<Product, 'stock' | 'stockMode'>

/** Sold "bajo pedido": no stock limit, the store orders it for the customer. */
export function isOnOrder(product: Pick<Product, 'stockMode'>): boolean {
    return product.stockMode === 'ON_ORDER'
}

/**
 * Units that can be bought of `variant` (or of the product without variants). On-order
 * products have no limit, so they report `Infinity`; callers cap quantities themselves.
 */
export function stockOf(product: StockSource, variant?: ProductVariant): number {
    if (isOnOrder(product)) return Number.POSITIVE_INFINITY
    return Math.max(0, variant ? variant.stock : product.stock)
}

export function isVariantSoldOut(product: StockSource, variant: ProductVariant): boolean {
    return stockOf(product, variant) <= 0
}

/**
 * The version preselected on cards and on the product page: the first one available. When
 * every version is sold out it falls back to the first, so the product shows as "Agotado".
 */
export function defaultVariant(
    product: StockSource & Pick<Product, 'variants'>,
): ProductVariant | undefined {
    return (
        product.variants.find((variant) => !isVariantSoldOut(product, variant)) ??
        product.variants.at(0)
    )
}
