import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const stickerVariants = cva(
    'inline-flex items-center justify-center rounded-full border-2 border-white font-display font-semibold shadow-soft',
    {
        variants: {
            tone: {
                blush: 'bg-blush-700 text-white',
                sky: 'bg-sky-400 text-white',
                butter: 'bg-butter-400 text-ink',
                mint: 'bg-mint-400 text-ink',
                lilac: 'bg-lilac-400 text-white',
            },
            size: {
                sm: 'px-3 py-1 text-xs',
                md: 'px-4 py-1.5 text-sm',
                lg: 'px-5 py-2 text-base',
            },
            rotation: {
                left: '-rotate-6',
                right: 'rotate-6',
                none: 'rotate-0',
            },
        },
        defaultVariants: {
            tone: 'blush',
            size: 'md',
            rotation: 'left',
        },
    },
)

export interface StickerProps
    extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof stickerVariants> {
    children: ReactNode
}

export function Sticker({ tone, size, rotation, className, children, ...rest }: StickerProps) {
    return (
        <span className={cn(stickerVariants({ tone, size, rotation }), className)} {...rest}>
            {children}
        </span>
    )
}
