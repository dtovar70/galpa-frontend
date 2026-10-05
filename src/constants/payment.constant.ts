import {
    Banknote,
    Bitcoin,
    Building2,
    CreditCard,
    DollarSign,
    Landmark,
    Smartphone,
    Wallet,
    type LucideIcon,
} from 'lucide-react'

import type { PaymentMethod } from '@/@types/order'

/**
 * Icons a payment method can use (the admin picks one by name in Catálogos). The names are the
 * ones the API accepts and stores in `payment_methods.icon`; the names, help texts and order of
 * the methods themselves come from `GET /catalogs/payment-methods` (`usePaymentMethods`).
 */
export const PAYMENT_METHOD_ICONS = {
    smartphone: { icon: Smartphone, label: 'Celular' },
    building: { icon: Building2, label: 'Edificio' },
    landmark: { icon: Landmark, label: 'Banco' },
    'dollar-sign': { icon: DollarSign, label: 'Dólar' },
    bitcoin: { icon: Bitcoin, label: 'Cripto' },
    wallet: { icon: Wallet, label: 'Billetera' },
    'credit-card': { icon: CreditCard, label: 'Tarjeta' },
    banknote: { icon: Banknote, label: 'Billete' },
} as const satisfies Record<string, { icon: LucideIcon; label: string }>

export type PaymentMethodIconName = keyof typeof PAYMENT_METHOD_ICONS

export const PAYMENT_METHOD_ICON_NAMES = Object.keys(
    PAYMENT_METHOD_ICONS,
) as PaymentMethodIconName[]

export function isPaymentMethodIconName(
    value: string | null | undefined,
): value is PaymentMethodIconName {
    return typeof value === 'string' && Object.hasOwn(PAYMENT_METHOD_ICONS, value)
}

/** The icon component of a stored icon name; unknown or missing names fall back to a wallet. */
export function paymentMethodIcon(icon: string | null | undefined): LucideIcon {
    return isPaymentMethodIconName(icon) ? PAYMENT_METHOD_ICONS[icon].icon : Wallet
}

/**
 * Methods whose payment proof carries bolívar amounts, the payer's bank and ID (the other ones
 * carry dollars and an account). Mirrors the API's payment validation, like the per-method form
 * fields; what people read about each method comes from the catalog.
 */
const BOLIVAR_METHODS: ReadonlySet<PaymentMethod> = new Set(['PAGO_MOVIL', 'TRANSFERENCIA'])

export function isBolivarMethod(method: PaymentMethod): boolean {
    return BOLIVAR_METHODS.has(method)
}
