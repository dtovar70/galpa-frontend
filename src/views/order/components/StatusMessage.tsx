import {
    CircleCheck,
    CircleX,
    Clock,
    PackageOpen,
    PartyPopper,
    SearchCheck,
    Store,
    Truck,
    Wallet,
    Warehouse,
    type LucideIcon,
} from 'lucide-react'

import type { OrderStatus, PublicOrder } from '@/@types/order'
import { cn } from '@/utils/cn'
import { useOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'
import { useFillPlaceholders } from '@/utils/hooks/useSiteContent'

type MessageTone = 'warning' | 'info' | 'success' | 'danger' | 'neutral'

const TONE_CLASS: Record<MessageTone, string> = {
    warning: 'border-warning-200 bg-warning-50',
    info: 'border-frost-200 bg-frost-50',
    success: 'border-success-200 bg-success-50',
    danger: 'border-danger-200 bg-danger-50',
    neutral: 'border-line bg-white',
}

const ICON_CLASS: Record<MessageTone, string> = {
    warning: 'text-warning-700',
    info: 'text-frost-700',
    success: 'text-success-700',
    danger: 'text-danger-700',
    neutral: 'text-ink-soft',
}

/**
 * Icon and box color of each status's message. The texts come from the status catalog
 * (`customerTitle` / `customerDescription`, edited in the admin); these stay here because they
 * are part of the page's design, not wording.
 */
const MESSAGE_STYLE: Record<OrderStatus, { icon: LucideIcon; tone: MessageTone }> = {
    PENDIENTE_PAGO: { icon: Wallet, tone: 'warning' },
    PENDIENTE_VERIFICACION: { icon: SearchCheck, tone: 'info' },
    PAGO_RECHAZADO: { icon: CircleX, tone: 'danger' },
    PAGO_VERIFICADO: { icon: CircleCheck, tone: 'success' },
    ESPERANDO_MERCANCIA: { icon: Warehouse, tone: 'warning' },
    EN_PREPARACION: { icon: PackageOpen, tone: 'success' },
    LISTO_PARA_RETIRO: { icon: Store, tone: 'success' },
    DESPACHADO: { icon: Truck, tone: 'info' },
    ENTREGADO: { icon: PartyPopper, tone: 'success' },
    CANCELADO: { icon: CircleX, tone: 'neutral' },
    EXPIRADO: { icon: Clock, tone: 'warning' },
}

/** Statuses whose latest history note (dispatch details, cancellation reason) replaces the body. */
const NOTE_STATUSES: readonly OrderStatus[] = ['DESPACHADO', 'CANCELADO', 'ESPERANDO_MERCANCIA']

function lastNote(order: PublicOrder, status: OrderStatus): string | null {
    return order.history.filter((entry) => entry.status === status).at(-1)?.note ?? null
}

export interface StatusMessageProps {
    order: PublicOrder
    /** The payment deadline passed (or the order expired) but a proof can still be sent. */
    late?: boolean
}

/** Friendly explanation of where the order stands and what happens next. */
export function StatusMessage({ order, late = false }: StatusMessageProps) {
    const catalog = useOrderStatusCatalog()
    const fill = useFillPlaceholders()

    // A late payment reads like an expired order: the proof is still welcome.
    const status: OrderStatus = late ? 'EXPIRADO' : order.status
    const info = catalog.status(status)
    const { icon: Icon, tone } = MESSAGE_STYLE[status]
    const note = !late && NOTE_STATUSES.includes(status) ? lastNote(order, status) : null

    const title = info.customerTitle ?? info.customerLabel
    const body = note ?? (info.customerDescription ? fill(info.customerDescription) : null)

    return (
        <div
            role="status"
            className={cn('flex items-start gap-4 rounded-2xl border p-5', TONE_CLASS[tone])}
        >
            <span
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-soft',
                    ICON_CLASS[tone],
                )}
            >
                <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
                <p className="text-lg font-bold text-ink">{title}</p>
                {body ? <p className="text-sm break-words text-ink-soft">{body}</p> : null}
            </div>
        </div>
    )
}
