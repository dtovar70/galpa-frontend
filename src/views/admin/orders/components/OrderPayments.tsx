import type { AdminOrder, PaymentStatus } from '@/@types/order'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge, Card, type BadgeProps } from '@/components/ui'
import { AdminOrderService } from '@/services/AdminOrderService'
import { cn } from '@/utils/cn'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatDateTime, formatDay } from '@/utils/formatDate'
import { PaymentFlagBadges } from '@/views/admin/orders/components/PaymentFlagBadges'
import { formatDifference } from '@/views/admin/orders/utils/formatDifference'
import { ProofViewer } from '@/components/shared/ProofViewer'

const STATUS: Record<PaymentStatus, { label: string; tone: BadgeProps['tone'] }> = {
    PENDIENTE: { label: 'Por verificar', tone: 'sky' },
    VERIFICADO: { label: 'Verificado', tone: 'mint' },
    RECHAZADO: { label: 'Rechazado', tone: 'blush' },
}

/** Every payment proof of the order (newest first), with the checks the owner needs. */
export function OrderPayments({ order }: { order: AdminOrder }) {
    return (
        <Card padding="md" className="space-y-4">
            <div className="space-y-1">
                <h2 className="font-display text-xl text-ink">Pagos reportados</h2>
                <p className="text-xs text-ink-soft">
                    El monto esperado es el total en Bs fijado al crear el pedido (
                    {formatBolivares(order.totals.totalBs)}); no cambia aunque la tasa BCV cambie.
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
                        return (
                            <li
                                key={payment.id}
                                className={cn(
                                    'flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row',
                                    payment.status === 'PENDIENTE'
                                        ? 'border-sky-300 bg-sky-50/60'
                                        : 'border-line bg-white',
                                )}
                            >
                                {payment.proofPath ? (
                                    <ProofViewer
                                        src={AdminOrderService.proofUrl(payment.proofPath)}
                                        title={`Captura del pago ref. ${payment.reference}`}
                                    />
                                ) : (
                                    <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line bg-white px-2 text-center text-[11px] text-ink-soft">
                                        Sin captura
                                    </span>
                                )}
                                <div className="min-w-0 flex-1 space-y-2 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="flex min-w-0 items-center gap-1 font-semibold text-ink">
                                            <span className="break-all">
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
                                        <PaymentFlagBadges flags={payment} late={payment.late} />
                                        {payment.source === 'admin' ? (
                                            <Badge tone="lilac" size="sm">
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
                                                    'font-semibold',
                                                    payment.amountMismatch
                                                        ? 'text-blush-700'
                                                        : 'text-ink',
                                                )}
                                            >
                                                {formatBolivares(payment.amountBs)}
                                            </dd>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Esperado:</dt>
                                            <dd className="font-semibold text-ink">
                                                {formatBolivares(payment.expectedBs)}
                                                {payment.amountMismatch
                                                    ? ` (${formatDifference(payment.amountDifferenceBs)})`
                                                    : ''}
                                            </dd>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Banco:</dt>
                                            <dd className="text-ink">
                                                {payment.payerBankCode} - {payment.payerBankName}
                                            </dd>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Teléfono:</dt>
                                            <dd className="text-ink">{payment.payerPhone}</dd>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Cédula:</dt>
                                            <dd className="text-ink">
                                                {payment.payerIdNumber ?? '—'}
                                            </dd>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <dt className="text-ink-soft">Fecha del pago:</dt>
                                            <dd className="text-ink">
                                                {formatDay(payment.paidOn)}
                                            </dd>
                                        </div>
                                    </dl>
                                    <p className="text-xs text-ink-soft">
                                        Enviado el {formatDateTime(payment.createdAt)}
                                        {payment.reviewedAt
                                            ? ` · revisado el ${formatDateTime(payment.reviewedAt)}${payment.reviewedBy ? ` por ${payment.reviewedBy.name}` : ''}`
                                            : ''}
                                    </p>
                                    {payment.rejectionReason ? (
                                        <p className="font-medium break-words text-blush-700">
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
