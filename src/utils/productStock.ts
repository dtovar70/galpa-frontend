import type { Product, ProductVariant } from '@/@types/product'

/** Units left of `variant`, or of the product itself when it has no variants. */
export function stockOf(product: Pick<Product, 'stock'>, variant?: ProductVariant): number {
    return Math.max(0, variant ? variant.stock : product.stock)
}

export function isVariantSoldOut(variant: ProductVariant): boolean {
    return variant.stock <= 0
}

/**
 * The version preselected on cards and on the product page: the first one in stock. When
 * every version is sold out it falls back to the first, so the product shows as "Agotado".
 */
export function defaultVariant(product: Pick<Product, 'variants'>): ProductVariant | undefined {
    return product.variants.find((variant) => !isVariantSoldOut(variant)) ?? product.variants.at(0)
}
