import { Bitcoin, Building2, DollarSign, Smartphone, type LucideIcon } from 'lucide-react'

import type { PaymentCurrency, PaymentMethod } from '@/@types/order'

export interface PaymentMethodInfo {
    label: string
    /** One line under the label on the checkout cards. */
    description: string
    currency: PaymentCurrency
}

export const PAYMENT_METHOD_INFO: Record<PaymentMethod, PaymentMethodInfo> = {
    PAGO_MOVIL: {
        label: 'Pago Móvil',
        description: 'En bolívares, a la tasa BCV del día.',
        currency: 'VES',
    },
    TRANSFERENCIA: {
        label: 'Transferencia bancaria',
        description: 'En bolívares, a la tasa BCV del día.',
        currency: 'VES',
    },
    ZELLE: {
        label: 'Zelle',
        description: 'En dólares, desde tu cuenta en EE. UU.',
        currency: 'USD',
    },
    BINANCE: {
        label: 'Binance Pay',
        description: 'En dólares (USDT) con Binance Pay.',
        currency: 'USD',
    },
}

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
    PAGO_MOVIL: Smartphone,
    TRANSFERENCIA: Building2,
    ZELLE: DollarSign,
    BINANCE: Bitcoin,
}

/** Order the methods are offered in. */
export const PAYMENT_METHOD_ORDER: readonly PaymentMethod[] = [
    'PAGO_MOVIL',
    'TRANSFERENCIA',
    'ZELLE',
    'BINANCE',
]

export function paymentMethodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_INFO[method].label
}

export function isBolivarMethod(method: PaymentMethod): boolean {
    return PAYMENT_METHOD_INFO[method].currency === 'VES'
}
