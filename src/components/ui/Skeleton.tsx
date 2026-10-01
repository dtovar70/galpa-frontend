import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const skeletonVariants = cva('animate-pulse bg-line motion-reduce:animate-none', {
    variants: {
        shape: {
            line: 'h-4 rounded-full',
            block: 'rounded-2xl',
            circle: 'rounded-full',
        },
    },
    defaultVariants: {
        shape: 'line',
    },
})

export interface SkeletonProps
    extends HTMLAttributes<HTMLElement>, VariantProps<typeof skeletonVariants> {
    /** `span` for a placeholder inside text (a `<div>` is not allowed inside a `<p>`). */
    as?: 'div' | 'span'
}

export function Skeleton({ shape, className, as: Tag = 'div', ...rest }: SkeletonProps) {
    return (
        <Tag aria-hidden="true" className={cn(skeletonVariants({ shape }), className)} {...rest} />
    )
}
