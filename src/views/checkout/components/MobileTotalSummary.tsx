import { ChevronDown } from 'lucide-react'

import type { CartItem } from '@/@types/cart'
import { cn } from '@/utils/cn'
import { formatBolivares, usdToBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { useExchangeRate } from '@/utils/hooks/useExchangeRate'

export interface MobileTotalSummaryProps {
    items: CartItem[]
    subtotal: number
    shipping: number
    total: number
    className?: string
}

/**
 * Phones and tablets: the order total right above the form ("Total: $X · Bs Y"), collapsed,
 * because the full summary card sits below the whole form there.
 */
export function MobileTotalSummary({
    items,
    subtotal,
    shipping,
    total,
    className,
}: MobileTotalSummaryProps) {
    const { data: rate } = useExchangeRate()
    const bolivares = rate?.available ? formatBolivares(usdToBolivares(total, rate.rate)) : null

    return (
        <details
            className={cn('group rounded-2xl border border-line bg-white lg:hidden', className)}
        >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 focus-visible:outline-2 focus-visible:outline-brand-400 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 text-sm text-ink">
                    <span className="font-semibold">Total: {formatCurrency(total)}</span>
                    {bolivares ? <span className="text-ink-soft"> · ≈ {bolivares}</span> : null}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
                    <span className="group-open:hidden">Ver resumen</span>
                    <span className="hidden group-open:inline">Ocultar</span>
                    <ChevronDown
                        aria-hidden="true"
                        className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                </span>
            </summary>

            <div className="space-y-3 border-t border-line px-4 py-3 text-sm">
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item.lineId} className="flex items-start justify-between gap-3">
                            <span className="min-w-0 text-ink">
                                <span className="block truncate font-semibold">{item.name}</span>
                                <span className="text-xs text-ink-soft">
                                    {item.variantLabel} · {item.quantity} u.
                                </span>
                            </span>
                            <span className="shrink-0 font-semibold text-ink">
                                {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                        </li>
                    ))}
                </ul>
                <dl className="space-y-1 border-t border-line pt-3">
                    <div className="flex justify-between">
                        <dt className="text-ink-soft">Subtotal</dt>
                        <dd className="font-semibold text-ink">{formatCurrency(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-ink-soft">Envío</dt>
                        <dd className="font-semibold text-ink">
                            {shipping === 0 ? 'Gratis' : formatCurrency(shipping)}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="font-semibold text-ink">Total</dt>
                        <dd className="font-semibold text-ink">{formatCurrency(total)}</dd>
                    </div>
                </dl>
            </div>
        </details>
    )
}
