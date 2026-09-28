import { ArrowLeft, ClipboardList } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import { ReceiptDownloadButton } from '@/components/shared/ReceiptDownloadButton'
import { Button, ButtonLink, Skeleton } from '@/components/ui'
import { ADMIN_ROUTES } from '@/constants/route.constant'
import { AdminOrderService } from '@/services/AdminOrderService'
import { getErrorMessage, isApiError } from '@/services/errors'
import { formatDateTime } from '@/utils/formatDate'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminOrder } from '@/views/admin/hooks/useAdminOrders'
import { OrderActions } from '@/views/admin/orders/components/OrderActions'
import { OrderAlerts } from '@/views/admin/orders/components/OrderAlerts'
import { OrderCustomerCard } from '@/views/admin/orders/components/OrderCustomerCard'
import { OrderHistory } from '@/views/admin/orders/components/OrderHistory'
import { OrderItemsTable } from '@/views/admin/orders/components/OrderItemsTable'
import { OrderNotes } from '@/views/admin/orders/components/OrderNotes'
import { OrderPayments } from '@/views/admin/orders/components/OrderPayments'
import { OrderQrAction } from '@/views/admin/orders/components/OrderQrAction'
import { WhatsAppNoticeAction } from '@/views/admin/orders/components/WhatsAppNoticeAction'

function BackLink() {
    return (
        <Link
            to={ADMIN_ROUTES.orders}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-blush-600"
        >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Pedidos
        </Link>
    )
}

export function AdminOrderDetailView() {
    const { code = '' } = useParams()
    const { data: order, isPending, isError, error, refetch } = useAdminOrder(code)

    if (isPending) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <Skeleton shape="block" className="h-80" />
                    <Skeleton shape="block" className="h-64" />
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <>
                <AdminPageHeader title={code} eyebrow={<BackLink />} />
                <EmptyState
                    title={
                        isApiError(error, 404)
                            ? 'No encontramos este pedido'
                            : 'No pudimos cargar el pedido'
                    }
                    description={getErrorMessage(error)}
                    icon={<ClipboardList className="size-6" />}
                    action={
                        isApiError(error, 404) ? (
                            <ButtonLink to={ADMIN_ROUTES.orders}>Volver a pedidos</ButtonLink>
                        ) : (
                            <Button variant="secondary" onClick={() => void refetch()}>
                                Reintentar
                            </Button>
                        )
                    }
                />
            </>
        )
    }

    return (
        <>
            <AdminPageHeader
                title={order.code}
                eyebrow={<BackLink />}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <span>Creado el {formatDateTime(order.createdAt)}</span>
                        {order.status === 'PENDIENTE_PAGO' ? (
                            <span>· vence el {formatDateTime(order.paymentDueAt)}</span>
                        ) : null}
                        {order.refund && order.refund.status !== 'PENDIENTE' ? (
                            <span>
                                · {order.refund.label}
                                {order.refund.reference ? ` (ref. ${order.refund.reference})` : ''}
                            </span>
                        ) : null}
                    </span>
                }
            />

            <OrderAlerts order={order} />

            <div className="mb-4 flex flex-wrap items-start gap-2">
                <WhatsAppNoticeAction order={order} />
                <OrderQrAction order={order} />
                {order.receiptAvailable ? (
                    <ReceiptDownloadButton
                        code={order.code}
                        load={() => AdminOrderService.getReceipt(order.code)}
                    />
                ) : null}
            </div>

            <div className="mb-6">
                <OrderActions order={order} />
            </div>

            <div className="@container grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-6">
                    <OrderPayments order={order} />
                    <OrderItemsTable order={order} />
                    <OrderHistory order={order} />
                </div>
                <div className="min-w-0 space-y-6">
                    <OrderCustomerCard order={order} />
                    <OrderNotes order={order} />
                </div>
            </div>
        </>
    )
}
