import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { HighlightedText } from '@/components/shared/HighlightedText'
import { cn } from '@/utils/cn'

const headingVariants = cva('font-display tracking-tight text-balance text-ink', {
    variants: {
        level: {
            h1: 'text-4xl uppercase sm:text-5xl lg:text-6xl',
            h2: 'text-3xl uppercase sm:text-4xl lg:text-5xl',
            h3: 'text-2xl sm:text-3xl',
        },
    },
    defaultVariants: {
        level: 'h2',
    },
})

export interface SectionHeadingProps extends VariantProps<typeof headingVariants> {
    /** Words between asterisks are painted in blush: "Tus *favoritos*". */
    title: string
    /** Applied to the heading element so a section can reference it with aria-labelledby. */
    headingId?: string
    eyebrow?: string
    description?: string
    align?: 'left' | 'center'
    action?: ReactNode
    className?: string
}

export function SectionHeading({
    title,
    headingId,
    eyebrow,
    description,
    align = 'left',
    level = 'h2',
    action,
    className,
}: SectionHeadingProps) {
    const Heading = level ?? 'h2'

    return (
        <div
            className={cn(
                'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
                align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
                className,
            )}
        >
            <div className={cn('max-w-2xl space-y-3', align === 'center' && 'mx-auto')}>
                {eyebrow ? (
                    <p className="font-display text-sm font-semibold tracking-[0.2em] text-blush-700 uppercase">
                        {eyebrow}
                    </p>
                ) : null}

                <Heading id={headingId} className={headingVariants({ level })}>
                    <HighlightedText text={title} />
                </Heading>

                {description ? (
                    <p className="text-base text-ink-soft sm:text-lg">{description}</p>
                ) : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    )
}
