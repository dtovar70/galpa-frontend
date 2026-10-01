import type { QuoteStatus } from '@/@types/quote'
import { Badge } from '@/components/ui'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONES } from '@/constants/quote.constant'

export interface QuoteStatusBadgeProps {
    status: QuoteStatus
    size?: 'sm' | 'md'
    className?: string
}

export function QuoteStatusBadge({ status, size = 'sm', className }: QuoteStatusBadgeProps) {
    return (
        <Badge tone={QUOTE_STATUS_TONES[status]} size={size} className={className}>
            {QUOTE_STATUS_LABELS[status]}
        </Badge>
    )
}
