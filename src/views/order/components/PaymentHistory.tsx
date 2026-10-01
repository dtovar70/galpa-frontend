import type { OrderPayment, PaymentStatus } from '@/@types/order'
import { Badge, type BadgeVariant } from '@/components/ui'
import { paymentMethodLabel } from '@/constants/payment.constant'
import { formatDateTime, formatDay } from '@/utils/formatDate'
import { formatPaidAmount } from '@/utils/payment'

const PAYMENT_LABELS: Record<PaymentStatus, { label: string; tone: BadgeVariant }> = {
    PENDIENTE: { label: 'En revisión', tone: 'info' },
    VERIFICADO: { label: 'Aprobado', tone: 'brand' },
    RECHAZADO: { label: 'Rechazado', tone: 'danger' },
}

/** Where the payment came from: the payer's bank, or their Zelle/Binance account. */
function payerOf(payment: OrderPayment): string | null {
    return payment.payerBankName ?? payment.payerAccount ?? payment.payerName
}

/** Every proof the customer sent for this order, newest first. */
export function PaymentHistory({ payments }: { payments: OrderPayment[] }) {
    if (payments.length === 0) return null
    return (
        <section className="space-y-3" aria-labelledby="payments-title">
            <h2 id="payments-title" className="text-xl text-ink">
                Pagos enviados
            </h2>
            <ul className="space-y-2">
                {payments.map((payment) => {
                    const status = PAYMENT_LABELS[payment.status]
                    const payer = payerOf(payment)
                    return (
                        <li
                            key={payment.id}
                            className="space-y-1 rounded-xl border border-line bg-white px-4 py-3 text-sm"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-tech font-semibold break-all text-ink">
                                    Ref. {payment.reference}
                                </span>
                                <Badge tone={status.tone} size="sm">
                                    {status.label}
                                </Badge>
                            </div>
                            <p className="text-ink-soft">
                                {paymentMethodLabel(payment.method)} ·{' '}
                                <span className="font-tech">{formatPaidAmount(payment)}</span>
                                {payer ? ` · ${payer}` : ''} · pagado el {formatDay(payment.paidOn)}
                            </p>
                            <p className="text-xs text-ink-soft">
                                Enviado el {formatDateTime(payment.createdAt)}
                                {payment.hasProof ? ' · con captura' : ''}
                            </p>
                            {payment.rejectionReason ? (
                                <p className="text-sm font-medium break-words text-danger-700">
                                    Motivo: {payment.rejectionReason}
                                </p>
                            ) : null}
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
