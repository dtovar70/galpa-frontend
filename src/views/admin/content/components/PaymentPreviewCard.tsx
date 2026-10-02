import type { DeepPartial } from 'react-hook-form'

import { isMethodConfigured, type PaymentContent } from '@/@types/content'
import type { PaymentMethod } from '@/@types/order'
import { DEFAULT_SITE_CONTENT } from '@/configs/content.defaults'
import {
    PAYMENT_METHOD_ICONS,
    PAYMENT_METHOD_ORDER,
    paymentMethodLabel,
} from '@/constants/payment.constant'
import { cn } from '@/utils/cn'
import { resolveSection } from '@/utils/content'

function rowsFor(method: PaymentMethod, payment: PaymentContent) {
    const bank = (code: string, name: string) => (code && name ? `${code} - ${name}` : '')
    switch (method) {
        case 'PAGO_MOVIL':
            return [
                {
                    label: 'Banco',
                    value: bank(payment.pagoMovil.bankCode, payment.pagoMovil.bankName),
                },
                { label: 'Teléfono', value: payment.pagoMovil.phone },
                { label: 'Cédula / RIF', value: payment.pagoMovil.idNumber },
                { label: 'Titular', value: payment.pagoMovil.holderName },
            ]
        case 'TRANSFERENCIA':
            return [
                {
                    label: 'Banco',
                    value: bank(payment.transfer.bankCode, payment.transfer.bankName),
                },
                { label: 'Cuenta', value: payment.transfer.accountNumber },
                { label: 'Cédula / RIF', value: payment.transfer.idNumber },
                { label: 'Titular', value: payment.transfer.holderName },
            ]
        case 'ZELLE':
            return [
                { label: 'Correo', value: payment.zelle.email },
                { label: 'Titular', value: payment.zelle.holderName },
            ]
        case 'BINANCE':
            return [
                { label: 'Pay ID', value: payment.binance.payId },
                { label: 'Titular', value: payment.binance.holderName },
            ]
    }
}

export interface PaymentPreviewCardProps {
    /** The form values as typed (any field may still be missing). */
    payment: DeepPartial<PaymentContent>
}

/** How the customer will see each method at checkout and on the order page. */
export function PaymentPreviewCard({ payment: draft }: PaymentPreviewCardProps) {
    // Missing fields fall back to the (empty) defaults, as the storefront would read them.
    const payment = resolveSection('payment', draft ?? DEFAULT_SITE_CONTENT.payment)

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-ink-soft">Así lo verá el cliente</p>
            <ul className="grid gap-3 @xl:grid-cols-2">
                {PAYMENT_METHOD_ORDER.map((method) => {
                    const Icon = PAYMENT_METHOD_ICONS[method]
                    const isOffered = isMethodConfigured(payment, method)
                    return (
                        <li
                            key={method}
                            className={cn(
                                'space-y-3 rounded-xl border p-4',
                                isOffered
                                    ? 'border-brand-200 bg-white'
                                    : 'border-line bg-page opacity-70',
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                    <Icon aria-hidden="true" className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="font-bold text-ink">
                                        {paymentMethodLabel(method)}
                                    </p>
                                    <p className="text-xs text-ink-soft">
                                        {isOffered
                                            ? 'Se ofrece en el checkout.'
                                            : 'No se ofrece: está inactivo o le faltan datos.'}
                                    </p>
                                </div>
                            </div>
                            <dl className="grid grid-cols-1 gap-1.5 text-sm">
                                {rowsFor(method, payment).map((row) => (
                                    <div key={row.label} className="flex min-w-0 gap-2">
                                        <dt className="shrink-0 text-ink-soft">{row.label}:</dt>
                                        <dd
                                            className={cn(
                                                'min-w-0 font-semibold break-words',
                                                row.value
                                                    ? 'text-ink'
                                                    : 'font-normal text-ink-muted italic',
                                            )}
                                        >
                                            {row.value || 'Sin completar'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </li>
                    )
                })}
            </ul>
            {payment.instructions ? (
                <p className="text-sm break-words whitespace-pre-line text-ink-soft">
                    {payment.instructions}
                </p>
            ) : null}
        </div>
    )
}
