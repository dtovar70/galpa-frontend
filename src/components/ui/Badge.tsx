import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full font-semibold tracking-wide whitespace-nowrap',
    {
        variants: {
            tone: {
                /** Brand green, also "success": in stock, approved, delivered. */
                brand: 'bg-brand-100 text-brand-800',
                /** Amber: "Bajo pedido", pending actions. */
                warning: 'bg-warning-100 text-warning-800',
                /** Frost: informational states (in review, on its way). */
                info: 'bg-frost-100 text-frost-800',
                danger: 'bg-danger-100 text-danger-700',
                neutral: 'bg-mist text-ink-soft',
                /** Thin outline on white, for low-emphasis labels. */
                outline: 'border border-line-strong bg-white text-ink-soft',
                solid: 'bg-ink text-white',
            },
            size: {
                sm: 'px-2.5 py-0.5 text-[11px]',
                md: 'px-3 py-1 text-xs',
            },
        },
        defaultVariants: {
            tone: 'brand',
            size: 'md',
        },
    },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['tone']>

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
