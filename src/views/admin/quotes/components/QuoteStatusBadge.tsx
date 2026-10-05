import type { Quote } from '@/@types/quote'
import { Badge } from '@/components/ui'
import { STATUS_TONE_VARIANTS } from '@/constants/tone.constant'
import { useQuoteStatuses } from '@/views/admin/hooks/useAdminCatalogs'

export interface QuoteStatusBadgeProps {
    quote: Pick<Quote, 'status' | 'statusLabel'>
    size?: 'sm' | 'md'
    className?: string
}

/**
 * The quote's status as a badge, named and colored by the status catalog. Until the catalog
 * loads (or when it fails) it shows the label the API sent with the quote, in neutral.
 */
export function QuoteStatusBadge({ quote, size = 'sm', className }: QuoteStatusBadgeProps) {
    const catalog = useQuoteStatuses()
    const info = catalog.status(quote.status)
    return (
        <Badge
            tone={info ? STATUS_TONE_VARIANTS[info.tone] : 'neutral'}
            size={size}
            className={className}
        >
            {info?.label ?? quote.statusLabel}
        </Badge>
    )
}
