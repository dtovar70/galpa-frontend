import { useExchangeRate } from '@/utils/hooks/useExchangeRate'
import { formatBolivares, formatRate, usdToBolivares } from '@/utils/formatBolivares'
import { formatDay } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface BsApproximationProps {
    /** Total in US dollars. */
    usd: number
    className?: string
}

/**
 * "≈ Bs 32.469,62" plus the rate it used ("Tasa BCV del 24/09/2026: 854,46 Bs/$"). Renders
 * nothing while the rate loads or when it is unavailable (the checkout says so on its own).
 */
export function BsApproximation({ usd, className }: BsApproximationProps) {
    const { data } = useExchangeRate()
    if (!data?.available) return null

    return (
        <div className={cn('space-y-0.5 text-right', className)}>
            <p className="text-sm font-semibold text-ink tabular-nums">
                ≈ {formatBolivares(usdToBolivares(usd, data.rate))}
            </p>
            <p className="text-xs text-ink-soft">
                Tasa BCV del {formatDay(data.effectiveDate)}: {formatRate(data.rate)} Bs/$
            </p>
        </div>
    )
}
