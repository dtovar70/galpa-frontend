import type { AdminOrder } from '@/@types/order'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import { Card } from '@/components/ui'
import { formatDateTime } from '@/utils/formatDate'

/** Every status change, oldest first, with who made it and the note. */
export function OrderHistory({ order }: { order: AdminOrder }) {
    return (
        <Card padding="md" className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Historial</h2>
            <ol className="space-y-3 border-l-2 border-line pl-4">
                {order.history.map((entry, index) => (
                    <li key={`${entry.to}-${index}`} className="relative space-y-1">
                        <span
                            aria-hidden="true"
                            className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-brand-400"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <OrderStatusBadge status={entry.to} size="sm" />
                            <span className="text-xs text-ink-soft">
                                {formatDateTime(entry.at)} · {entry.actorName}
                            </span>
                        </div>
                        {entry.note ? (
                            <p className="text-sm break-words text-ink">{entry.note}</p>
                        ) : null}
                    </li>
                ))}
            </ol>
        </Card>
    )
}
