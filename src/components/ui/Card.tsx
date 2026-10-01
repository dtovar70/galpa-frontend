import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const cardVariants = cva('rounded-2xl border transition duration-300', {
    variants: {
        tone: {
            white: 'border-line bg-white',
            /** Recessed panel on the page background. */
            muted: 'border-line bg-page',
            brand: 'border-brand-100 bg-brand-50',
            info: 'border-frost-100 bg-frost-50',
            /** Dark band: ink surface with light text. */
            dark: 'border-white/10 bg-surface text-white',
        },
        elevation: {
            none: '',
            soft: 'shadow-soft',
            lift: 'shadow-lift',
        },
        interactive: {
            true: 'hover:-translate-y-1 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none',
            false: '',
        },
        padding: {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        },
    },
    defaultVariants: {
        tone: 'white',
        elevation: 'soft',
        interactive: false,
        padding: 'md',
    },
})

export interface CardProps
    extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
    children: ReactNode
}

export function Card({
    tone,
    elevation,
    interactive,
    padding,
    className,
    children,
    ...rest
}: CardProps) {
    return (
        <div
            className={cn(cardVariants({ tone, elevation, interactive, padding }), className)}
            {...rest}
        >
            {children}
        </div>
    )
}
