import { isMethodConfigured, type PaymentContent } from '@/@types/content'
import type {
    AmountDue,
    OrderPayment,
    OrderTotals,
    PaymentCurrency,
    PaymentMethod,
} from '@/@types/order'
import { isBolivarMethod, PAYMENT_METHOD_ORDER } from '@/constants/payment.constant'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'

/** Methods the store can take now, in display order. */
export function configuredPaymentMethods(payment: PaymentContent): PaymentMethod[] {
    return PAYMENT_METHOD_ORDER.filter((method) => isMethodConfigured(payment, method))
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

/** An amount in a payment currency: "Bs 1.234,50" (VES) or "$120,00" (USD). */
export function formatMoney(currency: PaymentCurrency, amount: number): string {
    return currency === 'VES' ? formatBolivares(amount) : formatCurrency(amount)
}

/** What the order's method must pay, as the API computed it (`amountDue`). */
export function formatAmountDue(amountDue: AmountDue): string {
    return formatMoney(amountDue.currency, amountDue.amount)
}

/** Signed difference in the payment's currency: "+Bs 12,00" / "−$5,00". */
export function formatPaymentDifference(currency: PaymentCurrency, difference: number): string {
    return `${difference > 0 ? '+' : '−'}${formatMoney(currency, Math.abs(difference))}`
}
