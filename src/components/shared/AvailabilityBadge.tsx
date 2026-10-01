import { CircleCheck, CircleSlash, Clock } from 'lucide-react'

import type { Product } from '@/@types/product'
import { Badge } from '@/components/ui'
import { AVAILABILITY_LABELS, AVAILABILITY_TONES, leadTimeText } from '@/constants/product.constant'

const ICONS = {
    IN_STOCK: CircleCheck,
    ON_ORDER: Clock,
    OUT_OF_STOCK: CircleSlash,
} as const

export interface AvailabilityBadgeProps {
    product: Pick<Product, 'availability' | 'leadTimeDays'>
    /** Adds "Entrega en ~N días" next to an on-order badge. */
    showLeadTime?: boolean
    size?: 'sm' | 'md'
    className?: string
}

/** "En stock" (green), "Bajo pedido" (amber, with its lead time) or "Agotado". */
export function AvailabilityBadge({
    product,
    showLeadTime = false,
    size = 'sm',
    className,
}: AvailabilityBadgeProps) {
    const Icon = ICONS[product.availability]
    const leadTime =
        showLeadTime && product.availability === 'ON_ORDER'
            ? leadTimeText(product.leadTimeDays)
            : null

    return (
        <Badge tone={AVAILABILITY_TONES[product.availability]} size={size} className={className}>
            <Icon aria-hidden="true" className="size-3" />
            {AVAILABILITY_LABELS[product.availability]}
            {leadTime ? <span className="font-medium opacity-80">· {leadTime}</span> : null}
        </Badge>
    )
}
