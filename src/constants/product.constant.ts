import type { ProductAvailability, ProductTag } from '@/@types/product'
import type { BadgeVariant } from '@/components/ui/Badge'

/** How each tag reads in the store. The stored value stays `bestseller` (relevance sort). */
export const PRODUCT_TAG_LABELS: Record<ProductTag, string> = {
    nuevo: 'Nuevo',
    bestseller: 'Más vendido',
    oferta: 'Oferta',
}

export const PRODUCT_TAG_TONES: Record<ProductTag, BadgeVariant> = {
    nuevo: 'info',
    bestseller: 'solid',
    oferta: 'danger',
}

export const AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
    IN_STOCK: 'En stock',
    ON_ORDER: 'Bajo pedido',
    OUT_OF_STOCK: 'Agotado',
}

export const AVAILABILITY_TONES: Record<ProductAvailability, BadgeVariant> = {
    IN_STOCK: 'success',
    ON_ORDER: 'warning',
    OUT_OF_STOCK: 'neutral',
}

/** "Entrega en ~15 días" for an on-order product; null when the lead time is unknown. */
export function leadTimeText(leadTimeDays: number | null): string | null {
    if (leadTimeDays === null || leadTimeDays <= 0) return null
    return leadTimeDays === 1 ? 'Entrega en ~1 día' : `Entrega en ~${leadTimeDays} días`
}

const BTU_FORMAT = new Intl.NumberFormat('es-VE')

/** "12.000 BTU". */
export function formatBtu(btu: number): string {
    return `${BTU_FORMAT.format(btu)} BTU`
}
