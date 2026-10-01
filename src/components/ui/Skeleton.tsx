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
    extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

export function Skeleton({ shape, className, ...rest }: SkeletonProps) {
    return (
        <div aria-hidden="true" className={cn(skeletonVariants({ shape }), className)} {...rest} />
    )
}
