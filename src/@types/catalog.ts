import type { OrderStatus } from '@/@types/order'

/**
 * Colors a status may take, as the API stores them (mirrors its `BADGE_TONES`): the semantic
 * variants of the `Badge` component.
 */
export const BADGE_TONES = [
    'brand',
    'warning',
    'info',
    'danger',
    'outline',
    'solid',
    'neutral',
] as const
export type BadgeTone = (typeof BADGE_TONES)[number]

/** One order status as `GET /catalogs/order-statuses` returns it. */
export interface OrderStatusInfo {
    code: OrderStatus
    /** Admin label: badges, tabs, the status filter, history. */
    label: string
    /** Name of the step on the customer's order timeline. */
    customerLabel: string
    /** Heading of the message on the customer's order page. */
    customerTitle: string | null
    /** Body of that message; may use `{marca}`. */
    customerDescription: string | null
    groupCode: string
    tone: BadgeTone
    sortOrder: number
    /** Informational only: the workflow ends here. */
    isTerminal: boolean
}

/** A status as the admin catalog returns it: also its WhatsApp message template. */
export interface AdminOrderStatusInfo extends OrderStatusInfo {
    whatsappTemplate: string
}

/** One tab of the admin orders page. */
export interface OrderStatusGroupInfo {
    code: string
    label: string
    /** Shown when the tab has no orders. */
    description: string | null
    sortOrder: number
    /** Its counter stands out while above zero. */
    highlight: boolean
    statuses: OrderStatus[]
}

export interface OrderStatusCatalog {
    groups: OrderStatusGroupInfo[]
    statuses: OrderStatusInfo[]
}

/** `GET /admin/catalogs/order-statuses` (ADMIN): the catalog plus the WhatsApp templates. */
export interface AdminOrderStatusCatalog {
    groups: OrderStatusGroupInfo[]
    statuses: AdminOrderStatusInfo[]
}

/** Body of `PATCH /admin/catalogs/order-statuses/:code`. Codes, groups and `isTerminal` are fixed. */
export interface OrderStatusInput {
    label?: string
    customerLabel?: string
    customerTitle?: string | null
    customerDescription?: string | null
    tone?: BadgeTone
    /** "Avisar por WhatsApp" message; placeholders like `{nombre}` are filled in by the API. */
    whatsappTemplate?: string
}

/** Body of `PATCH /admin/catalogs/order-statuses/groups/:code`. */
export interface OrderStatusGroupInput {
    label?: string
    description?: string | null
    sortOrder?: number
}

/** An active bank, as the public `GET /catalogs/banks` lists it. */
export interface Bank {
    code: string
    name: string
}

export interface AdminBank extends Bank {
    isActive: boolean
    sortOrder: number
    /** Payment proofs that name this bank: it can be deactivated, never deleted. */
    paymentCount: number
    /** The store's Pago Móvil details use it. */
    usedByPaymentContent: boolean
}

export interface BankCreateInput {
    code: string
    name: string
    isActive?: boolean
}

export type BankInput = Partial<Omit<BankCreateInput, 'code'>>

/** An active mobile operator code ("0424"), as `GET /catalogs/mobile-prefixes` lists it. */
export interface MobilePrefix {
    code: string
}

/** Content fields checked against the mobile codes. */
export type ContentPhoneField = 'payment.phone' | 'contact.whatsapp'

export interface AdminMobilePrefix extends MobilePrefix {
    isActive: boolean
    sortOrder: number
    /** Orders in progress (not delivered, cancelled or expired) with a phone on this code. */
    activeOrderCount: number
    /** Store content with a phone on this code (defaults included). */
    contentFields: ContentPhoneField[]
}

export interface MobilePrefixCreateInput {
    code: string
    isActive?: boolean
}
