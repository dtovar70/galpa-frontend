import { Clock } from 'lucide-react'

import { leadTimeText } from '@/constants/product.constant'
import { cn } from '@/utils/cn'

export interface OnOrderNoteProps {
    leadTimeDays: number | null
    className?: string
}

/** "Bajo pedido · Entrega en ~15 días" under an on-order cart or order line. */
export function OnOrderNote({ leadTimeDays, className }: OnOrderNoteProps) {
    const leadTime = leadTimeText(leadTimeDays)
    return (
        <p
            className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold text-warning-800',
                className,
            )}
        >
            <Clock aria-hidden="true" className="size-3.5 shrink-0" />
            Bajo pedido{leadTime ? ` · ${leadTime}` : ''}
        </p>
    )
}
