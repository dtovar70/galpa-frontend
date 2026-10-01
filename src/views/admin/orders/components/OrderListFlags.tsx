import { AlarmClock, Clock, PackageX, Undo2, Wrench } from 'lucide-react'

import type { AdminOrderListItem } from '@/@types/order'
import { Badge } from '@/components/ui'
import { PaymentFlagBadges } from '@/views/admin/orders/components/PaymentFlagBadges'

/**
 * Every flag of one order in the list: late payment, missing stock, pending refund, on-order
 * items, installation request, duplicated reference.
 */
export function OrderListFlags({ order }: { order: AdminOrderListItem }) {
    return (
        <span className="flex flex-wrap gap-1.5">
            {order.latePayment ? (
                <Badge tone="info" size="sm" title="El pago llegó después del plazo">
                    <AlarmClock aria-hidden="true" className="size-3" />
                    Fuera de plazo
                </Badge>
            ) : null}
            {order.stockConflict ? (
                <Badge tone="danger" size="sm" title="Falta stock para este pedido">
                    <PackageX aria-hidden="true" className="size-3" />
                    Stock insuficiente
                </Badge>
            ) : null}
            {order.refundStatus === 'PENDIENTE' ? (
                <Badge tone="warning" size="sm" title="Hay que devolverle el dinero al cliente">
                    <Undo2 aria-hidden="true" className="size-3" />
                    Reembolso pendiente
                </Badge>
            ) : null}
            {order.hasOnOrderItems ? (
                <Badge tone="warning" size="sm" title="Incluye equipos bajo pedido">
                    <Clock aria-hidden="true" className="size-3" />
                    Bajo pedido
                </Badge>
            ) : null}
            {order.wantsInstallation ? (
                <Badge
                    tone="outline"
                    size="sm"
                    title="El cliente pidió asesoría para la instalación"
                >
                    <Wrench aria-hidden="true" className="size-3" />
                    Instalación
                </Badge>
            ) : null}
            {order.latestPayment ? (
                <PaymentFlagBadges payment={order.latestPayment} className="contents" />
            ) : null}
        </span>
    )
}
