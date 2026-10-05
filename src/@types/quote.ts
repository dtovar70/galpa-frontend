import type { DeliveryMethod, PaymentMethod } from '@/@types/order'

/**
 * A quote status code. The codes, their labels, tones and rules live in the API: the list comes
 * from `GET /admin/catalogs/quote-statuses` and each quote carries what may be done with it.
 */
export type QuoteStatus = string

/** A status the admin may move the quote to by hand ("Cambiar estado"). */
export interface QuoteTransition {
    status: QuoteStatus
    label: string
    requiresReason: boolean
}

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
    /** The catalog's admin label of the status. */
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
    /** Manual moves allowed from the current status (none: no "Cambiar estado"). */
    allowedTransitions: QuoteTransition[]
    /** Its lines and conditions may still change. */
    canEdit: boolean
    /** "Convertir en pedido". */
    canConvert: boolean
    /** Only drafts. */
    canDelete: boolean
    /** It may be emailed (the status allows it and the customer has an email). */
    canSend: boolean
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
