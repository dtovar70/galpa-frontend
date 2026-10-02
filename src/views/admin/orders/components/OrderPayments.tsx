import type { AdminOrder, AdminOrderPayment, PaymentStatus } from '@/@types/order'
import { CopyButton } from '@/components/shared/CopyButton'
import { ProofViewer } from '@/components/shared/ProofViewer'
import { Badge, Card, type BadgeVariant } from '@/components/ui'
import { isBolivarMethod, paymentMethodLabel } from '@/constants/payment.constant'
import { AdminOrderService } from '@/services/AdminOrderService'
import { cn } from '@/utils/cn'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime, formatDay } from '@/utils/formatDate'
import { formatPaidAmount, formatPaymentDifference } from '@/utils/payment'
import { PaymentFlagBadges } from '@/views/admin/orders/components/PaymentFlagBadges'

const STATUS: Record<PaymentStatus, { label: string; tone: BadgeVariant }> = {
    PENDIENTE: { label: 'Por verificar', tone: 'info' },
    VERIFICADO: { label: 'Aprobado', tone: 'success' },
    RECHAZADO: { label: 'Rechazado', tone: 'danger' },
}

/** The payer's details that apply to the payment's method, as label/value rows. */
function payerRows(payment: AdminOrderPayment): { label: string; value: string }[] {
    const rows: { label: string; value: string | null }[] = isBolivarMethod(payment.method)
        ? [
              {
                  label: 'Banco',
                  value: payment.payerBankCode
                      ? `${payment.payerBankCode} - ${payment.payerBankName ?? ''}`
                      : null,
              },
              { label: 'Teléfono', value: payment.payerPhone },
              { label: 'Cédula / RIF', value: payment.payerIdNumber },
          ]
        : [
              { label: 'Titular', value: payment.payerName },
              {
                  label: payment.method === 'ZELLE' ? 'Cuenta Zelle' : 'Binance',
                  value: payment.payerAccount,
              },
          ]
    rows.push({ label: 'Fecha del pago', value: formatDay(payment.paidOn) })
    return rows.map((row) => ({ label: row.label, value: row.value ?? '—' }))
}

function expectedAmount(payment: AdminOrderPayment): string {
    if (isBolivarMethod(payment.method)) {
        return payment.expectedBs === null ? '—' : formatBolivares(payment.expectedBs)
    }
    return payment.expectedUsd === null ? '—' : formatCurrency(payment.expectedUsd)
}

/** Every payment proof of the order (newest first), with the checks the owner needs. */
export function OrderPayments({ order }: { order: AdminOrder }) {
    return (
        <Card padding="md" className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-xl text-ink">Pagos reportados</h2>
                <p className="text-xs text-ink-soft">
                    Método elegido: {paymentMethodLabel(order.paymentMethod)}. Los montos esperados
                    se fijaron al crear el pedido ({formatCurrency(order.totals.totalUsd)} ·{' '}
                    {formatBolivares(order.totals.totalBs)}); no cambian aunque la tasa BCV cambie.
                </p>
            </div>
            {order.payments.length === 0 ? (
                <p className="text-sm text-ink-soft">
                    El cliente todavía no ha enviado ningún comprobante.
                </p>
            ) : (
                <ul className="space-y-3">
                    {order.payments.map((payment) => {
                        const status = STATUS[payment.status]
                        const amountOff = payment.amountMismatch && payment.amountDifference !== 0
                        return (
                            <li
                                key={payment.id}
                                className={cn(
                                    'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row',
                                    payment.status === 'PENDIENTE'
                                        ? 'border-frost-200 bg-frost-50/60'
                                        : 'border-line bg-white',
                                )}
                            >
                                {payment.proofPath ? (
                                    <ProofViewer
                                        src={AdminOrderService.proofUrl(payment.proofPath)}
                                        title={`Captura del pago ref. ${payment.reference}`}
                                    />
                                ) : (
                                    <span className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong bg-white px-2 text-center text-[11px] text-ink-soft">
                                        Sin captura
                                    </span>
                                )}
                                <div className="min-w-0 flex-1 space-y-2 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="flex min-w-0 items-center gap-1 font-semibold text-ink">
                                            <span className="break-all tabular-nums">
                                                Ref. {payment.reference}
                                            </span>
                                            <CopyButton
                                                value={payment.reference}
                                                label="Copiar referencia"
                                                className="size-7"
                                            />
                                        </span>
                                        <Badge tone={status.tone} size="sm">
                                            {status.label}
                                        </Badge>
                                        <Badge tone="outline" size="sm">
                                            {payment.methodLabel}
                                        </Badge>
                                        <PaymentFlagBadges payment={payment} />
                                        {payment.source === 'admin' ? (
                                            <Badge tone="neutral" size="sm">
                                                Registrado por{' '}
                                                {payment.recordedBy?.name ?? 'administración'}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 @lg:grid-cols-2">
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Pagó:</dt>
                                            <dd
                                                className={cn(
                                                    'font-semibold tabular-nums',
                                                    amountOff ? 'text-warning-800' : 'text-ink',
                                                )}
                                            >
                                                {formatPaidAmount(payment)}
                                            </dd>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Esperado:</dt>
                                            <dd className="font-semibold text-ink tabular-nums">
                                                {expectedAmount(payment)}
                                                {amountOff
                                                    ? ` (${formatPaymentDifference(payment.currency, payment.amountDifference)})`
                                                    : ''}
                                            </dd>
                                        </div>
                                        {payerRows(payment).map((row) => (
                                            <div key={row.label} className="flex flex-wrap gap-1">
                                                <dt className="text-ink-soft">{row.label}:</dt>
                                                <dd className="break-all text-ink">{row.value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    <p className="text-xs text-ink-soft">
                                        Enviado el {formatDateTime(payment.createdAt)}
                                        {payment.reviewedAt
                                            ? ` · revisado el ${formatDateTime(payment.reviewedAt)}${payment.reviewedBy ? ` por ${payment.reviewedBy.name}` : ''}`
                                            : ''}
                                    </p>
                                    {payment.rejectionReason ? (
                                        <p className="font-medium break-words text-danger-700">
                                            Motivo: {payment.rejectionReason}
                                        </p>
                                    ) : null}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Card>
    )
}
