import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface EmptyStateProps {
    title: string
    description?: string
    icon?: ReactNode
    action?: ReactNode
    className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong bg-white px-6 py-14 text-center',
                className,
            )}
        >
            {icon ? (
                <span
                    aria-hidden="true"
                    className="flex size-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-soft"
                >
                    {icon}
                </span>
            ) : null}

            <div className="max-w-md space-y-2">
                <p className="text-xl font-bold text-ink">{title}</p>
                {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
            </div>

            {action}
        </div>
    )
}
