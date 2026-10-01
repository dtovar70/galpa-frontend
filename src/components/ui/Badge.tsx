import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full font-semibold tracking-wide whitespace-nowrap',
    {
        variants: {
            tone: {
                blush: 'bg-blush-100 text-blush-800',
                sky: 'bg-sky-100 text-sky-700',
                mint: 'bg-mint-200 text-ink',
                butter: 'bg-butter-200 text-ink',
                lilac: 'bg-lilac-200 text-ink',
                solid: 'bg-blush-700 text-white',
                neutral: 'bg-line text-ink-soft',
            },
            size: {
                sm: 'px-2.5 py-0.5 text-[11px]',
                md: 'px-3 py-1 text-xs',
            },
        },
        defaultVariants: {
            tone: 'blush',
            size: 'md',
        },
    },
)

export interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
    children: ReactNode
}

export function Badge({ tone, size, className, children, ...rest }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ tone, size }), className)} {...rest}>
            {children}
        </span>
    )
}
