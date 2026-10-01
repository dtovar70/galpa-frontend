import { AlarmClock, PackageCheck, PackageX, Undo2 } from 'lucide-react'

import type { AdminOrder } from '@/@types/order'
import { Alert } from '@/components/ui'
import { formatDateTime } from '@/utils/formatDate'
import {
    describeStockLine,
    missingUnits,
    stockLineName,
} from '@/views/admin/orders/utils/stockConflict'

/**
 * What the owner must not miss on this order: a payment that arrived late, products that ran
 * out while the order waited, money to give back.
 */
export function OrderAlerts({ order }: { order: AdminOrder }) {
    const conflict = order.stockConflict
    const refund = order.refund
    if (!order.latePayment && !conflict && refund?.status !== 'PENDIENTE') return null

    return (
        <div className="mb-6 space-y-3" aria-label="Alertas del pedido">
            {order.latePayment ? (
                <Alert tone="info">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <AlarmClock aria-hidden="true" className="size-4" />
                        Pago fuera de plazo
                    </p>
                    <p className="font-normal">
                        La fecha de pago indicada es posterior al plazo (vencía el{' '}
                        {formatDateTime(order.paymentDueAt)}), así que se pagó con una tasa BCV
                        distinta a la del pedido. Revisa el banco y el monto antes de confirmarlo.
                    </p>
                </Alert>
            ) : null}

            {conflict && !conflict.resolvedAt && !conflict.stillShort ? (
                <Alert tone="info">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <PackageCheck aria-hidden="true" className="size-4" />
                        Ya hay stock para este pedido
                    </p>
                    <p className="font-normal">Al confirmar el pago se aparta automáticamente.</p>
                </Alert>
            ) : conflict ? (
                <Alert tone={conflict.resolvedAt ? 'info' : 'error'}>
                    <p className="flex items-center gap-1.5 font-semibold">
                        <PackageX aria-hidden="true" className="size-4" />
                        {conflict.resolvedAt
                            ? 'Confirmado con stock insuficiente'
                            : 'Stock insuficiente'}
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5 font-normal">
                        {conflict.lines.map((line) => (
                            <li
                                key={`${line.productId ?? ''}-${line.variantId ?? ''}-${line.productName}`}
                            >
                                {conflict.resolvedAt
                                    ? `${stockLineName(line)}: ${missingUnits(line) === 0 ? 'ya está completo' : `faltan ${missingUnits(line)} de ${line.requested}`}`
                                    : line.stillShort
                                      ? describeStockLine(line)
                                      : `${stockLineName(line)}: ya hay stock`}
                            </li>
                        ))}
                    </ul>
                    {conflict.resolvedAt ? null : (
                        <p className="font-normal">
                            Para confirmar el pago tendrás que indicar que entiendes que falta
                            stock. Se descontará lo que haya, nunca por debajo de 0.
                        </p>
                    )}
                </Alert>
            ) : null}

            {refund?.status === 'PENDIENTE' ? (
                <Alert>
                    <p className="flex items-center gap-1.5 font-semibold">
                        <Undo2 aria-hidden="true" className="size-4" />
                        Reembolso pendiente
                    </p>
                    <p className="font-normal">
                        El pedido se canceló con un pago del cliente. Cuando le devuelvas el dinero,
                        usa «Marcar reembolso realizado».
                    </p>
                </Alert>
            ) : null}
        </div>
    )
}
