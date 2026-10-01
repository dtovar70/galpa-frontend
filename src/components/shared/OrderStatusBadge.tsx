import type { OrderStatus } from '@/@types/order'
import { Badge, Skeleton, type BadgeProps } from '@/components/ui'
import { STATUS_TONE_VARIANTS } from '@/constants/tone.constant'
import { cn } from '@/utils/cn'
import { useOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'

export interface OrderStatusBadgeProps {
    status: OrderStatus
    size?: BadgeProps['size']
    className?: string
}

/** The status's label and color, both from the status catalog (edited in the admin). */
export function OrderStatusBadge({ status, size, className }: OrderStatusBadgeProps) {
    const catalog = useOrderStatusCatalog()
    if (catalog.isLoading) {
        return (
            <Skeleton
                as="span"
                shape="circle"
                className={cn('inline-block align-middle', size === 'sm' ? 'h-5 w-24' : 'h-6 w-28')}
            />
        )
    }
    const info = catalog.status(status)
    return (
        <Badge tone={STATUS_TONE_VARIANTS[info.tone]} size={size} className={className}>
            {info.label}
        </Badge>
    )
}
