import { type ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface TooltipProps {
    /**
     * Visible hint text. It is decorative on purpose: the wrapped control must carry its
     * own accessible name (`aria-label` or visible text), so assistive tech never hears
     * the same thing twice.
     */
    label: string
    placement?: 'top' | 'bottom'
    /**
     * Which edge the bubble lines up with. Use `end` when the trigger hugs the right edge
     * of a clipping container, so the bubble grows inwards instead of being cut off.
     */
    align?: 'center' | 'start' | 'end'
    children: ReactNode
    className?: string
}

const ALIGNMENT_CLASS: Record<NonNullable<TooltipProps['align']>, string> = {
    center: 'left-1/2 -translate-x-1/2',
    start: 'left-0',
    end: 'right-0',
}

export function Tooltip({
    label,
    placement = 'bottom',
    align = 'center',
    children,
    className,
}: TooltipProps) {
    return (
        <span className={cn('group/tooltip relative inline-flex', className)}>
            {children}

            <span
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute z-20 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-page opacity-0 shadow-soft transition-opacity duration-150 group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100 motion-reduce:transition-none',
                    ALIGNMENT_CLASS[align],
                    placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
                )}
            >
                {label}
            </span>
        </span>
    )
}
