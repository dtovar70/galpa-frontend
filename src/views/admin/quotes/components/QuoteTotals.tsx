import { useWatch, type Control } from 'react-hook-form'

import { formatBolivares, formatRate, usdToBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { quoteSubtotal, type QuoteFormValues } from '@/views/admin/quotes/schema/quote.schema'

export interface QuoteTotalsProps {
    control: Control<QuoteFormValues>
    /** BCV rate for the bolívar total: the quote's own once saved, else today's. */
    rate: number | null
    rateLabel: string
}

/** Live subtotal, discount and total (USD and Bs at the BCV rate) as the lines are edited. */
export function QuoteTotals({ control, rate, rateLabel }: QuoteTotalsProps) {
    const [items, discount] = useWatch({ control, name: ['items', 'discount'] })
    const subtotal = quoteSubtotal(items ?? [])
    const discountValue = Number.isFinite(Number(discount)) ? Math.max(0, Number(discount)) : 0
    const total = Math.max(0, Math.round((subtotal - discountValue) * 100) / 100)

    return (
        <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-semibold text-ink tabular-nums">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Descuento</dt>
                <dd className="font-semibold text-ink tabular-nums">
                    {discountValue > 0 ? `−${formatCurrency(discountValue)}` : formatCurrency(0)}
                </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <dt className="text-base font-bold text-ink">Total</dt>
                <dd className="text-right">
                    <span className="block text-2xl font-bold text-ink tabular-nums">
                        {formatCurrency(total)}
                    </span>
                    {rate !== null ? (
                        <span className="text-sm font-semibold text-ink-soft tabular-nums">
                            {formatBolivares(usdToBolivares(total, rate))}
                        </span>
                    ) : null}
                </dd>
            </div>
            <p className="text-xs text-ink-soft">
                {rate !== null
                    ? `${rateLabel}: ${formatRate(rate)} Bs/$.`
                    : 'Sin tasa BCV disponible: el total en Bs se calcula al guardar.'}
            </p>
        </dl>
    )
}
