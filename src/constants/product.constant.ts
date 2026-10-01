import type { ProductTag } from '@/@types/product'

/**
 * How each tag reads in the store. The stored value stays `bestseller` (it drives the
 * relevance sort); customers see "favorito", which everyone understands.
 */
export const PRODUCT_TAG_LABELS: Record<ProductTag, string> = {
    nuevo: 'nuevo',
    bestseller: 'favorito',
    oferta: 'oferta',
    personalizable: 'personalizable',
}
