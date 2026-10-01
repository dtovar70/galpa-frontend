import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { HighlightedText } from '@/components/shared/HighlightedText'
import { cn } from '@/utils/cn'

const headingVariants = cva('font-extrabold tracking-tight text-balance', {
    variants: {
        level: {
            h1: 'text-4xl sm:text-5xl lg:text-6xl',
            h2: 'text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-tight',
            h3: 'text-2xl sm:text-3xl',
        },
        tone: {
            light: 'text-ink',
            dark: 'text-white',
        },
    },
    defaultVariants: {
        level: 'h2',
        tone: 'light',
    },
})

export interface SectionHeadingProps extends VariantProps<typeof headingVariants> {
    /** Words between asterisks are painted green: "Tu *confort*". */
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
    tone = 'light',
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
                    <p
                        className={cn(
                            'inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase',
                            tone === 'dark' ? 'text-brand-400' : 'text-brand-700',
                        )}
                    >
                        <span aria-hidden="true" className="h-px w-6 bg-current" />
                        {eyebrow}
                    </p>
                ) : null}

                <Heading id={headingId} className={headingVariants({ level, tone })}>
                    <HighlightedText
                        text={title}
                        className={tone === 'dark' ? 'text-brand-400' : undefined}
                    />
                </Heading>

                {description ? (
                    <p
                        className={cn(
                            'text-base sm:text-lg',
                            tone === 'dark' ? 'text-white/70' : 'text-ink-soft',
                        )}
                    >
                        {description}
                    </p>
                ) : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    )
}
