import type { QuoteStatus } from '@/@types/quote'
import type { BadgeVariant } from '@/components/ui/Badge'

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
    BORRADOR: 'Borrador',
    ENVIADA: 'Enviada',
    ACEPTADA: 'Aceptada',
    CONVERTIDA: 'Convertida en pedido',
    RECHAZADA: 'Rechazada',
    VENCIDA: 'Vencida',
}

export const QUOTE_STATUS_TONES: Record<QuoteStatus, BadgeVariant> = {
    BORRADOR: 'neutral',
    ENVIADA: 'info',
    ACEPTADA: 'brand',
    CONVERTIDA: 'solid',
    RECHAZADA: 'danger',
    VENCIDA: 'warning',
}

/** Statuses the admin can set by hand from each one (conversion and expiry have their own path). */
export const QUOTE_MANUAL_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
    BORRADOR: ['ENVIADA'],
    ENVIADA: ['ACEPTADA', 'RECHAZADA'],
    ACEPTADA: ['RECHAZADA'],
    CONVERTIDA: [],
    RECHAZADA: [],
    // An expired quote goes back to draft to be updated and sent again.
    VENCIDA: ['BORRADOR'],
}

/** The quote can still be edited (the API refuses changes in the other statuses). */
export function isQuoteEditable(status: QuoteStatus): boolean {
    return status === 'BORRADOR' || status === 'ENVIADA'
}

/** "Convertir en pedido" (mirrors the API's CONVERTIBLE_QUOTE_STATUSES). */
export function isQuoteConvertible(status: QuoteStatus): boolean {
    return status === 'BORRADOR' || status === 'ENVIADA' || status === 'ACEPTADA'
}

/** Days a new quote stays valid by default. */
export const QUOTE_DEFAULT_VALIDITY_DAYS = 15

export const QUOTE_DEFAULT_TERMS =
    'Precios en dólares, pagaderos en bolívares a la tasa BCV del día del pago. Disponibilidad sujeta a existencia; los equipos bajo pedido tienen el tiempo de entrega indicado. Garantía del fabricante.'
