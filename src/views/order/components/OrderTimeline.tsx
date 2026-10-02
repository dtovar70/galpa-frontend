import { Check } from 'lucide-react'

import type { OrderStatus, PublicOrder } from '@/@types/order'
import { orderProgress } from '@/constants/order.constant'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/formatDate'
import { useOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'

/**
 * The happy path, with the date each step was reached and where the order is now. Pickup orders
 * end at the store counter, deliveries leave it; on-order items add the wait for the goods.
 * Step names are the catalog's customer labels ("Esperando tu pago", "Pago aprobado"…).
 */
export function OrderTimeline({ order }: { order: PublicOrder }) {
    const catalog = useOrderStatusCatalog()
    const stepLabel = (status: OrderStatus) => catalog.status(status).customerLabel
    const steps = orderProgress(order.customer.deliveryMethod, order.hasOnOrderItems)
    const reachedAt = (status: OrderStatus) =>
        order.history.filter((entry) => entry.status === status).at(-1)?.at
    // A rejected payment sits between "pago enviado" and "pago aprobado".
    const currentStatus: OrderStatus =
        order.status === 'PAGO_RECHAZADO' ? 'PENDIENTE_PAGO' : order.status
    const currentIndex = steps.indexOf(currentStatus)
    const isClosed = order.status === 'CANCELADO' || order.status === 'EXPIRADO'

    return (
        <ol className="space-y-0" aria-label="Seguimiento del pedido">
            {steps.map((status, index) => {
                const done = !isClosed && index <= currentIndex
                const current = !isClosed && index === currentIndex
                const at = done ? reachedAt(status) : undefined
                return (
                    <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < steps.length - 1 ? (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'absolute top-7 bottom-0 left-3.5 w-0.5 -translate-x-1/2',
                                    done && index < currentIndex ? 'bg-brand-400' : 'bg-line',
                                )}
                            />
                        ) : null}
                        <span
                            className={cn(
                                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs',
                                done
                                    ? 'border-brand-600 bg-brand-600 text-white'
                                    : 'border-line-strong bg-white text-ink-soft tabular-nums',
                                current && 'ring-4 ring-brand-100',
                            )}
                        >
                            {done ? <Check aria-hidden="true" className="size-4" /> : index + 1}
                        </span>
                        <div className="min-w-0 pt-0.5">
                            <p
                                className={cn(
                                    'text-sm font-semibold',
                                    done ? 'text-ink' : 'text-ink-soft',
                                )}
                                aria-current={current ? 'step' : undefined}
                            >
                                {stepLabel(status)}
                            </p>
                            {at ? (
                                <p className="text-xs text-ink-soft">{formatDateTime(at)}</p>
                            ) : null}
                        </div>
                    </li>
                )
            })}
            {isClosed ? (
                <li className="mt-4 rounded-xl bg-mist px-4 py-2 text-sm font-semibold text-ink-soft">
                    {stepLabel(order.status)}
                    {reachedAt(order.status)
                        ? ` · ${formatDateTime(reachedAt(order.status) ?? '')}`
                        : ''}
                </li>
            ) : null}
        </ol>
    )
}
