import { PAYMENT_METHOD_CONFIGURED, type PaymentContent } from '@/@types/content'
import type { OrderPayment, OrderTotals, PaymentMethod } from '@/@types/order'
import { isBolivarMethod, PAYMENT_METHOD_ORDER } from '@/constants/payment.constant'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'

/** Methods the store can take now, in display order. */
export function configuredPaymentMethods(payment: PaymentContent): PaymentMethod[] {
    return PAYMENT_METHOD_ORDER.filter((method) => PAYMENT_METHOD_CONFIGURED[method](payment))
}

/**
 * What checkout offers: the configured methods, minus the bolívar ones while there is no BCV
 * rate to price them.
 */
export function checkoutPaymentMethods(
    payment: PaymentContent,
    hasExchangeRate: boolean,
): PaymentMethod[] {
    return configuredPaymentMethods(payment).filter(
        (method) => hasExchangeRate || !isBolivarMethod(method),
    )
}

/** The amount the customer must pay with `method`, formatted in its currency. */
export function formatOrderAmount(method: PaymentMethod, totals: OrderTotals): string {
    return isBolivarMethod(method)
        ? formatBolivares(totals.totalBs)
        : formatCurrency(totals.totalUsd)
}

/** Paid amount of a payment in its method's currency ("Bs 1.234,50" / "$120,00"). */
export function formatPaidAmount(
    payment: Pick<OrderPayment, 'method' | 'amountBs' | 'amountUsd'>,
): string {
    if (isBolivarMethod(payment.method)) {
        return payment.amountBs === null ? '—' : formatBolivares(payment.amountBs)
    }
    return payment.amountUsd === null ? '—' : formatCurrency(payment.amountUsd)
}

/**
 * Paid minus expected, in the method's currency; null when either side is missing. A cent of
 * rounding is not a difference.
 */
export function paymentDifference(
    payment: Pick<OrderPayment, 'method' | 'amountBs' | 'amountUsd' | 'expectedBs' | 'expectedUsd'>,
): number | null {
    const [paid, expected] = isBolivarMethod(payment.method)
        ? [payment.amountBs, payment.expectedBs]
        : [payment.amountUsd, payment.expectedUsd]
    if (paid === null || expected === null) return null
    const difference = Math.round((paid - expected) * 100) / 100
    return Math.abs(difference) < 0.01 ? 0 : difference
}

/** Signed difference in the method's currency: "+Bs 12,00" / "−$5,00". */
export function formatPaymentDifference(method: PaymentMethod, difference: number): string {
    const amount = isBolivarMethod(method)
        ? formatBolivares(Math.abs(difference))
        : formatCurrency(Math.abs(difference))
    return `${difference > 0 ? '+' : '−'}${amount}`
}
