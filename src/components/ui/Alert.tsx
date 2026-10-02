import type { CSSProperties, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

const alertVariants = cva(
    'group relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm font-medium',
    {
        variants: {
            tone: {
                success: 'border-success-200 bg-success-50 text-success-900',
                error: 'border-danger-200 bg-danger-50 text-danger-800',
                info: 'border-frost-200 bg-frost-50 text-frost-900',
            },
        },
        defaultVariants: {
            tone: 'error',
        },
    },
)

type AlertTone = NonNullable<VariantProps<typeof alertVariants>['tone']>

const TONE_DETAILS: Record<AlertTone, { icon: LucideIcon; iconClass: string; barClass: string }> = {
    success: { icon: CircleCheck, iconClass: 'text-success-600', barClass: 'bg-success-500' },
    error: { icon: CircleAlert, iconClass: 'text-danger-600', barClass: 'bg-danger-400' },
    info: { icon: Info, iconClass: 'text-frost-600', barClass: 'bg-frost-400' },
}

export interface AlertProps extends VariantProps<typeof alertVariants> {
    children: ReactNode
    className?: string
    /** Shows a close button; with `autoDismissMs` it also fires when the countdown ends. */
    onDismiss?: () => void
    /** Countdown before `onDismiss` fires. Pauses while hovered or focused. */
    autoDismissMs?: number
}

/** Inline status message. Errors interrupt screen readers; other tones wait their turn. */
export function Alert({
    tone = 'error',
    children,
    className,
    onDismiss,
    autoDismissMs,
}: AlertProps) {
    const { icon: Icon, iconClass, barClass } = TONE_DETAILS[tone ?? 'error']
    const hasCountdown = onDismiss !== undefined && autoDismissMs !== undefined

    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className={cn(alertVariants({ tone }), className)}
        >
            <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', iconClass)} />
            <div className="min-w-0 flex-1">{children}</div>

            {onDismiss ? (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Cerrar mensaje"
                    className="-my-1 -mr-2 grid size-7 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
                >
                    <X aria-hidden="true" className="size-4" />
                </button>
            ) : null}

            {hasCountdown ? (
                <span
                    aria-hidden="true"
                    data-countdown=""
                    onAnimationEnd={onDismiss}
                    style={
                        {
                            animationDuration: `${autoDismissMs}ms`,
                            '--countdown-duration': `${autoDismissMs}ms`,
                        } as CSSProperties
                    }
                    className={cn(
                        'absolute inset-x-0 bottom-0 h-1 origin-left animate-countdown',
                        'group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]',
                        barClass,
                    )}
                />
            ) : null}
        </div>
    )
}
