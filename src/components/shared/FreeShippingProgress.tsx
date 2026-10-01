import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export interface FreeShippingProgressProps {
    subtotal: number
    className?: string
}

export function FreeShippingProgress({ subtotal, className }: FreeShippingProgressProps) {
    const { freeThreshold } = useSiteContent().shipping
    const remaining = Math.max(0, freeThreshold - subtotal)
    // A zero threshold means every order ships free.
    const percent =
        freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100

    return (
        <div className={cn('space-y-2', className)}>
            <p className="text-sm text-ink-soft">
                {remaining === 0 ? (
                    <span className="font-semibold text-blush-700">
                        ¡Listo! Tu envío va por nuestra cuenta.
                    </span>
                ) : (
                    <>
                        Te faltan{' '}
                        <span className="font-semibold text-ink">{formatCurrency(remaining)}</span>{' '}
                        para el envío gratis.
                    </>
                )}
            </p>

            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Progreso hacia el envío gratis"
                className="h-2.5 w-full overflow-hidden rounded-full bg-blush-100"
            >
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blush-400 to-sky-400 transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}
