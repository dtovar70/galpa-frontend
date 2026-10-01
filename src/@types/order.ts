import type { Paginated } from '@/@types/common'
import type { PaymentContent } from '@/@types/content'
import type {
    DesignPlacement,
    DpiLevel,
    GarmentColor,
    TextAlign,
    TextOutline,
} from '@/@types/design'
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
    /** The customer's own image ("Diseño propio"); null for a regular line. */
    design: OrderItemDesign | null
}

export interface OrderItemDesign {
    id: string
    /** API path of the preview. Customer: add the order's `?t=` token; admin: the session. */
    previewPath: string
    /** The garment color it was made on; null without template colors. */
    color: GarmentColor | null
}

export interface AdminDesignImageLayer {
    type: 'image'
    /** Position in the design, bottom (0) to top. */
    index: number
    /** 1-based among the design's images ("Imagen 2"). */
    number: number
    placement: DesignPlacement
    format: string
    width: number
    height: number
    bytes: number
    dpi: number
    dpiLevel: DpiLevel
    /** API path that downloads the original, named like `downloadName`. */
    downloadPath: string
    /** API path that shows the original inline (thumbnail). */
    viewPath: string
    /** `MR-000123-linea1-imagen1.jpg`. */
    downloadName: string
}

export interface AdminDesignTextLayer {
    type: 'text'
    index: number
    placement: DesignPlacement
    content: string
    font: string
    fontLabel: string
    color: string
    outline: TextOutline
    align: TextAlign
}

export type AdminDesignLayer = AdminDesignImageLayer | AdminDesignTextLayer

export interface AdminOrderItemDesign extends OrderItemDesign {
    printSize: { widthCm: number; heightCm: number } | null
    /** The lowest DPI among the images; null with only text. */
    dpiEstimate: number | null
    dpiLevel: DpiLevel | null
    /** Bottom to top. */
    layers: AdminDesignLayer[]
    /** The print-ready PNG; null for designs made before it existed. */
    artwork: {
        path: string
        /** `MR-000123-linea1-arte-final.png`. */
        downloadName: string
        width: number
        height: number
        bytes: number
        /** Its print resolution (100–200); null if unknown. */
        dpi: number | null
    } | null
}

export interface AdminOrderItem extends OrderItem {
    id: string
    design: AdminOrderItemDesign | null
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
    items: {
        productId: string
        variantId?: string
        quantity: number
        personalization?: string
        designId?: string
    }[]
}

export interface CreatedOrder {
    code: string
    /** Returned once: the customer's private link is `/pedido/<code>?t=<accessToken>`. */
    accessToken: string
    order: PublicOrder
}

/**
 * One problem with one cart line: 400 `ORDER_ITEMS_INVALID` (stock, product gone), or a design
 * the API refused (`kind: 'design'`, 400 `ORDER_DESIGN_INVALID` / 409 `ORDER_DESIGN_USED`).
 */
export interface OrderLineProblem {
    index: number
    productId: string
    variantId: string | null
    available: number
    message: string
    kind?: 'design'
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
