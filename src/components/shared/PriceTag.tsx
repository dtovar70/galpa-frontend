import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'

const priceVariants = cva('tabular-nums font-bold tracking-tight text-ink', {
    variants: {
        size: {
            sm: 'text-base',
            md: 'text-xl',
            lg: 'text-3xl',
        },
    },
    defaultVariants: {
        size: 'md',
    },
})

const compareVariants = cva('tabular-nums text-ink-muted line-through', {
    variants: {
        size: {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base',
        },
    },
    defaultVariants: {
        size: 'md',
    },
})

export interface PriceTagProps extends VariantProps<typeof priceVariants> {
    price: number
    compareAtPrice?: number
    /** Prefixes "Desde": `price` is the cheapest of several variant prices. */
    isFromPrice?: boolean
    className?: string
}

export function PriceTag({ price, compareAtPrice, isFromPrice, size, className }: PriceTagProps) {
    const hasDiscount = compareAtPrice !== undefined && compareAtPrice > price

    return (
        <p className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
            {isFromPrice ? <span className="text-xs font-medium text-ink-soft">Desde</span> : null}
            <span className={priceVariants({ size })}>{formatCurrency(price)}</span>
            {hasDiscount ? (
                <span className={compareVariants({ size })}>
                    <span className="sr-only">Antes </span>
                    {formatCurrency(compareAtPrice)}
                </span>
            ) : null}
        </p>
    )
}
