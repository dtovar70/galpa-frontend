import type { DeliveryMethod, PaymentMethod } from '@/@types/order'

/** `VENCIDA` is set by the API when `validUntil` passes on a sent quote. */
export const QUOTE_STATUSES = [
    'BORRADOR',
    'ENVIADA',
    'ACEPTADA',
    'CONVERTIDA',
    'RECHAZADA',
    'VENCIDA',
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

/** A quote line: a catalog product or free text (`productId` null). */
export interface QuoteItem {
    id: string
    productId: string | null
    /** The chosen version of a product with variants; null otherwise. */
    variantId: string | null
    productSlug: string | null
    description: string
    brand: string | null
    model: string | null
    quantity: number
    unitPrice: number
    lineTotal: number
    sortOrder: number
}

export interface Quote {
    id: string
    /** `COT-000045`. */
    code: string
    status: QuoteStatus
    statusLabel: string
    /** Why it was rejected (when given). */
    statusReason: string | null
    customerName: string
    customerEmail: string | null
    customerPhone: string | null
    customerIdNumber: string | null
    customerCompany: string | null
    notes: string
    terms: string
    /** `YYYY-MM-DD`. */
    validUntil: string
    items: QuoteItem[]
    /** USD. */
    subtotal: number
    discount: number
    total: number
    exchangeRate: number | null
    totalBs: number | null
    createdBy: { id: string; name: string } | null
    sentAt: string | null
    convertedOrderCode: string | null
    createdAt: string
    updatedAt: string
}

/** `GET /admin/quotes`: list rows are full quotes. */
export interface QuoteList {
    items: Quote[]
    total: number
    page: number
    pageSize: number
}

export interface QuoteQueryParams {
    status?: QuoteStatus
    search?: string
    page?: number
}

export interface QuoteItemInput {
    productId: string | null
    /** Required to convert a line whose product has variants. */
    variantId: string | null
    description: string
    brand: string | null
    model: string | null
    quantity: number
    unitPrice: number
}

/** Body of `POST /admin/quotes` and `PUT /admin/quotes/:code`. */
export interface QuoteInput {
    customerName: string
    customerEmail: string | null
    customerPhone: string | null
    customerIdNumber: string | null
    customerCompany: string | null
    notes: string
    terms: string
    validUntil: string
    discount: number
    items: QuoteItemInput[]
}

export interface QuoteStatusInput {
    status: QuoteStatus
    reason?: string
}

/** `POST /admin/quotes/:code/whatsapp-message`. */
export interface QuoteWhatsAppMessage {
    message: string
    /** `wa.me` link; null when the quote has no valid Venezuelan mobile to send it to. */
    url: string | null
    /** The public PDF link included in the message. */
    pdfUrl: string
}

/** Body of `POST /admin/quotes/:code/convert`. */
export interface QuoteConvertInput {
    deliveryMethod: DeliveryMethod
    paymentMethod: PaymentMethod
    address?: string
    city?: string
}

export interface QuoteConvertResult {
    orderCode: string
    customerUrl: string
}
