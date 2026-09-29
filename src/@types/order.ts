import type { Paginated } from '@/@types/common'
import type { PaymentContent } from '@/@types/content'
import type { RateSource } from '@/@types/exchange-rate'

/** Mirrors backend-cups/src/orders/order-status.ts and order.mapper.ts. */
export const ORDER_STATUSES = [
    'PENDIENTE_PAGO',
    'PENDIENTE_VERIFICACION',
    'PAGO_VERIFICADO',
    'PAGO_RECHAZADO',
    'EN_PRODUCCION',
    'LISTO_PARA_ENTREGA',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
    'EXPIRADO',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type DeliveryMethod = 'delivery' | 'pickup'

export type PaymentStatus = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO'

export type PaymentSource = 'customer' | 'admin'

/** Asked when an order with a payment is cancelled (mirrors the API's REFUND_STATUSES). */
export const REFUND_STATUSES = ['NO_APLICA', 'PENDIENTE', 'REEMBOLSADO'] as const
export type RefundStatus = (typeof REFUND_STATUSES)[number]

/** Longest personalization text per item (same limit as the API). */
export const PERSONALIZATION_MAX_LENGTH = 140

export interface OrderCustomer {
    fullName: string
    email: string
    phone: string
    city: string
    address: string
    deliveryMethod: DeliveryMethod
    notes: string
}

export interface OrderItem {
    productId: string | null
    productName: string
    productSlug: string
    variantId: string | null
    variantLabel: string | null
    imageUrl: string | null
    unitPriceUsd: number
    quantity: number
    lineTotalUsd: number
    personalization: string | null
}

export interface OrderTotals {
    subtotalUsd: number
    shippingUsd: number
    totalUsd: number
    totalBs: number
    exchangeRate: number
    exchangeRateDate: string
    exchangeRateSource: RateSource
    exchangeRateSourceLabel: string
}

export interface OrderPayment {
    id: string
    status: PaymentStatus
    reference: string
    payerBankCode: string
    payerBankName: string
    amountBs: number
    paidOn: string
    hasProof: boolean
    rejectionReason: string | null
    createdAt: string
}

export interface OrderHistoryEntry {
    status: OrderStatus
    label: string
    at: string
    note: string | null
}

/** `GET /orders/:code?t=`: the customer's view of their order. */
export interface PublicOrder {
    code: string
    status: OrderStatus
    statusLabel: string
    createdAt: string
    paymentDueAt: string
    canSubmitPayment: boolean
    /** The purchase receipt PDF can be downloaded (verified payment, not cancelled). */
    receiptAvailable: boolean
    customer: OrderCustomer
    items: OrderItem[]
    totals: OrderTotals
    pagoMovil: PaymentContent | null
    payments: OrderPayment[]
    history: OrderHistoryEntry[]
}

/** Body of `POST /orders`. Prices are never sent: the API computes them. */
export interface CreateOrderInput {
    fullName: string
    email: string
    phone: string
    city: string
    address: string
    notes: string
    deliveryMethod: DeliveryMethod
    items: { productId: string; variantId?: string; quantity: number; personalization?: string }[]
}

export interface CreatedOrder {
    code: string
    /** Returned once: the customer's private link is `/pedido/<code>?t=<accessToken>`. */
    accessToken: string
    order: PublicOrder
}

/** One problem with one cart line (400 `ORDER_ITEMS_INVALID`). */
export interface OrderLineProblem {
    index: number
    productId: string
    variantId: string | null
    available: number
    message: string
}

/** Text fields of `POST /orders/:code/payment` (sent as multipart with the `proof` image). */
export interface SubmitPaymentInput {
    reference: string
    payerBankCode: string
    payerPhone: string
    payerIdNumber: string
    paidOn: string
    amountBs: string
    proof: File | null
}

export interface PaymentFlags {
    duplicateReference: boolean
    amountMismatch: boolean
    amountDifferenceBs: number
}

export interface AdminOrderPayment extends OrderPayment, PaymentFlags {
    /** Recorded after the deadline or while the order was expired. */
    late: boolean
    /** `admin`: recorded by an admin from a proof the customer sent by WhatsApp. */
    source: PaymentSource
    recordedBy: { id: string; name: string } | null
    payerPhone: string
    payerIdNumber: string | null
    expectedBs: number
    /** API path of the private screenshot; null when none was sent. */
    proofPath: string | null
    reviewedAt: string | null
    reviewedBy: { id: string; name: string } | null
}

export type OrderActorKind = 'admin' | 'customer' | 'system' | 'telegram'

export interface AdminOrderHistoryEntry {
    from: OrderStatus | null
    to: OrderStatus
    label: string
    actor: OrderActorKind
    actorName: string
    note: string | null
    at: string
}

export interface AdminOrderNote {
    id: string
    body: string
    author: { id: string; name: string } | null
    createdAt: string
}

export interface AllowedTransition {
    to: OrderStatus
    label: string
    requiresReason: boolean
    restoresStock: boolean
    /** Reached by recording a payment ("Registrar pago manualmente"). */
    requiresPayment: boolean
    /** "Reactivar pedido": fresh deadline, takes the stock back. */
    reactivates: boolean
}

/** One variant (or product without variants) the order could not fully take back from stock. */
export interface StockConflictLine {
    productId: string | null
    /** Absent on conflicts recorded before stock was kept per variant. */
    variantId?: string | null
    productName: string
    variantLabel?: string | null
    requested: number
    available: number
    reserved: number
}

export interface StockConflict {
    detectedAt: string
    lines: StockConflictLine[]
    resolvedAt: string | null
    resolvedById: string | null
}

export interface OrderRefund {
    status: RefundStatus
    label: string
    reference: string | null
    refundedAt: string | null
    refundedBy: { id: string; name: string } | null
}

/** Options of `POST /admin/orders/:code/transitions` besides the target status. */
export interface TransitionInput {
    to: OrderStatus
    note?: string
    acknowledgeStockConflict?: boolean
    forceStock?: boolean
    refundStatus?: RefundStatus
    refundReference?: string
}

export interface AdminOrder {
    id: string
    code: string
    status: OrderStatus
    statusLabel: string
    createdAt: string
    updatedAt: string
    paymentDueAt: string
    stockRestored: boolean
    latePayment: boolean
    stockConflict: StockConflict | null
    /** The purchase receipt PDF can be downloaded (verified payment, not cancelled). */
    receiptAvailable: boolean
    refund: OrderRefund | null
    customer: OrderCustomer
    items: OrderItem[]
    totals: OrderTotals
    payments: AdminOrderPayment[]
    history: AdminOrderHistoryEntry[]
    notes: AdminOrderNote[]
    allowedTransitions: AllowedTransition[]
}

export interface AdminOrderListItem {
    code: string
    status: OrderStatus
    statusLabel: string
    createdAt: string
    paymentDueAt: string
    customerName: string
    customerPhone: string
    deliveryMethod: DeliveryMethod
    totalUsd: number
    totalBs: number
    itemCount: number
    latePayment: boolean
    /** Unresolved: the payment cannot be confirmed without acknowledging it. */
    stockConflict: boolean
    refundStatus: RefundStatus | null
    latestPayment:
        (PaymentFlags & { reference: string; amountBs: number; status: PaymentStatus }) | null
}

export interface AdminOrderList extends Paginated<AdminOrderListItem> {
    counts: Record<OrderStatus, number>
    countAll: number
    pendingRefunds: number
}

export interface AdminOrderQueryParams {
    /** Orders in any of these statuses (sent comma-separated). */
    status?: readonly OrderStatus[]
    refundStatus?: RefundStatus
    search?: string
    from?: string
    to?: string
    page?: number
    pageSize?: number
}

export interface AdminOrdersSummary {
    pendingVerification: number
    pendingPayment: number
    pendingRefunds: number
    paymentConfigured: boolean
    exchangeRate: {
        available: boolean
        isStale: boolean
        rate: number | null
        effectiveDate: string | null
    }
}

/** `POST /admin/orders/:code/whatsapp-message`: the status's template rendered for the order. */
export interface WhatsAppMessage {
    status: OrderStatus
    statusLabel: string
    /** The customer's phone as typed at checkout. */
    customerPhone: string
    /** WhatsApp number ("584141234567"); null when the phone is not a Venezuelan mobile. */
    phone: string | null
    text: string
    /** `https://wa.me/<phone>?text=…`; null without a valid phone. */
    url: string | null
    /** Fresh private link issued for this message (null when the template has none). */
    link: string | null
    receiptUrl: string | null
}

/** `POST /admin/orders/:code/access-links`: a new private link, shown only once. */
export interface IssuedAccessLink {
    token: string
    url: string
    createdAt: string
}
