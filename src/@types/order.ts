import type { Paginated } from '@/@types/common'
import type { PaymentContent } from '@/@types/content'
import type { RateSource } from '@/@types/exchange-rate'
import type { StockMode } from '@/@types/product'

/** Mirrors the API's order statuses (see the shared contract). */
export const ORDER_STATUSES = [
    'PENDIENTE_PAGO',
    'PENDIENTE_VERIFICACION',
    'PAGO_VERIFICADO',
    'PAGO_RECHAZADO',
    'ESPERANDO_MERCANCIA',
    'EN_PREPARACION',
    'LISTO_PARA_RETIRO',
    'DESPACHADO',
    'ENTREGADO',
    'CANCELADO',
    'EXPIRADO',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type DeliveryMethod = 'delivery' | 'pickup'

/** How the customer pays. Pago Móvil and transfers are paid in Bs; Zelle and Binance in USD. */
export const PAYMENT_METHODS = ['PAGO_MOVIL', 'TRANSFERENCIA', 'ZELLE', 'BINANCE'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** Currency a method pays in (mirrors the API): bolívares (`VES`) or dollars. */
export type PaymentCurrency = 'VES' | 'USD'

export type PaymentStatus = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO'

export type PaymentSource = 'customer' | 'admin'

/** Asked when an order with a payment is cancelled (mirrors the API's REFUND_STATUSES). */
export const REFUND_STATUSES = ['NO_APLICA', 'PENDIENTE', 'REEMBOLSADO'] as const
export type RefundStatus = (typeof REFUND_STATUSES)[number]

export interface OrderCustomer {
    fullName: string
    email: string
    phone: string
    /** Cédula or RIF; null when not given. */
    idNumber: string | null
    city: string
    address: string
    deliveryMethod: DeliveryMethod
    notes: string
}

export interface OrderItem {
    productId: string | null
    productName: string
    /** Null for a free-text line (from a quote) or a product without a page. */
    productSlug: string | null
    variantId: string | null
    variantLabel: string | null
    imageUrl: string | null
    brand: string | null
    model: string | null
    stockMode: StockMode
    unitPriceUsd: number
    quantity: number
    lineTotalUsd: number
}

export interface AdminOrderItem extends OrderItem {
    id: string
}

export interface OrderTotals {
    subtotalUsd: number
    /** Discount of a quote converted into the order (0 otherwise). */
    discountUsd: number
    shippingUsd: number
    totalUsd: number
    totalBs: number
    exchangeRate: number
    exchangeRateDate: string
    exchangeRateSource: RateSource
    exchangeRateSourceLabel: string
}

/** A payment the customer (or an admin) reported. Fields of other methods are null. */
export interface OrderPayment {
    id: string
    method: PaymentMethod
    status: PaymentStatus
    reference: string
    payerBankCode: string | null
    payerBankName: string | null
    payerPhone: string | null
    payerIdNumber: string | null
    payerName: string | null
    /** Zelle email/phone or Binance Pay ID/email. */
    payerAccount: string | null
    paidOn: string
    /** Bs methods. */
    amountBs: number | null
    /** USD methods. */
    amountUsd: number | null
    expectedBs: number | null
    expectedUsd: number | null
    hasProof: boolean
    /** Recorded after the deadline or while the order was expired. */
    late: boolean
    /** The same reference appears on another order. */
    duplicateReference: boolean
    /** `admin`: recorded by an admin from a proof the customer sent by WhatsApp. */
    source: PaymentSource
    rejectionReason: string | null
    createdAt: string
    reviewedAt: string | null
}

/** The amount to pay with the order's method: `totalBs` in VES or `totalUsd` in USD. */
export interface AmountDue {
    currency: PaymentCurrency
    amount: number
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
    /** The customer may still switch the payment method (`PATCH .../payment-method`). */
    canChangePaymentMethod: boolean
    /** The purchase receipt PDF can be downloaded (verified payment, not cancelled). */
    receiptAvailable: boolean
    paymentMethod: PaymentMethod
    paymentMethodLabel: string
    amountDue: AmountDue
    /** Some line is sold "bajo pedido": the order may wait for the goods. */
    hasOnOrderItems: boolean
    /** The customer asked for installation advice. */
    wantsInstallation: boolean
    customer: OrderCustomer
    items: OrderItem[]
    totals: OrderTotals
    /**
     * Where to pay: the store's payment section, where only the methods offered now keep their
     * details (the rest come back disabled and empty).
     */
    payment: PaymentContent
    /** The methods offered now, in display order. */
    availablePaymentMethods: PaymentMethod[]
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
    paymentMethod: PaymentMethod
    customerIdNumber?: string
    wantsInstallation: boolean
    items: {
        productId: string
        variantId?: string
        quantity: number
    }[]
}

export interface CreatedOrder {
    code: string
    /** Returned once: the customer's private link is `/pedido/<code>?t=<accessToken>`. */
    accessToken: string
    order: PublicOrder
    /** A retried checkout (same `Idempotency-Key`): no new order was created. */
    replayed: boolean
}

/** One problem with one cart line: 400 `ORDER_ITEMS_INVALID` (stock, product gone). */
export interface OrderLineProblem {
    index: number
    productId: string
    variantId: string | null
    available: number
    message: string
}

/**
 * Fields of `POST /orders/:code/payment` (multipart, with the `proof` image). Only the fields of
 * the chosen method are sent; amounts are kept as typed and parsed by the API.
 */
export interface SubmitPaymentInput {
    method: PaymentMethod
    reference: string
    paidOn: string
    payerBankCode: string
    payerPhone: string
    payerIdNumber: string
    payerName: string
    payerAccount: string
    amountBs: string
    amountUsd: string
    proof: File | null
}

/** Review flags of a payment, computed by the API in the method's currency. */
export interface PaymentFlags {
    duplicateReference: boolean
    /** VES for bolívar methods, USD for Zelle and Binance. */
    currency: PaymentCurrency
    amountMismatch: boolean
    /** Paid minus expected, in `currency`; 0 when exact. */
    amountDifference: number
}

export interface AdminOrderPayment extends OrderPayment, PaymentFlags {
    methodLabel: string
    recordedBy: { id: string; name: string } | null
    /** API path of the private screenshot; null when none was sent. */
    proofPath: string | null
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

/** A stock conflict line with the stock there is now (`available`) while the conflict is open. */
export interface LiveStockConflictLine extends StockConflictLine {
    /** The units this order still misses are more than what is in stock now. */
    stillShort: boolean
}

export interface StockConflict {
    detectedAt: string
    lines: LiveStockConflictLine[]
    resolvedAt: string | null
    resolvedById: string | null
    /**
     * Still short with the current stock: confirming the payment needs an acknowledgement.
     * False once restocked (the missing units are taken on confirmation) or resolved.
     */
    stillShort: boolean
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
    paymentMethod: PaymentMethod
    paymentMethodLabel: string
    amountDue: AmountDue
    hasOnOrderItems: boolean
    wantsInstallation: boolean
    customer: OrderCustomer
    items: AdminOrderItem[]
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
    paymentMethod: PaymentMethod
    hasOnOrderItems: boolean
    wantsInstallation: boolean
    totalUsd: number
    totalBs: number
    itemCount: number
    latePayment: boolean
    /** Unresolved: the payment cannot be confirmed without acknowledging it. */
    stockConflict: boolean
    refundStatus: RefundStatus | null
    /** The newest payment proof, if any (`amount` in the method's `currency`). */
    latestPayment:
        | (PaymentFlags & {
              method: PaymentMethod
              reference: string
              amount: number | null
              status: PaymentStatus
          })
        | null
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
    /** The methods checkout offers now. */
    paymentMethods: PaymentMethod[]
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
