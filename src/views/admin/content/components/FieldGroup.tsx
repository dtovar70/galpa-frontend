import type { ReactNode } from 'react'

import { Card } from '@/components/ui'

export interface FieldGroupProps {
    title: string
    description?: ReactNode
    /** Control next to the title, e.g. a switch that turns the group on. */
    action?: ReactNode
    children: ReactNode
}

/** A titled card of related fields. `@container` lets the fields sit in columns when wide. */
export function FieldGroup({ title, description, action, children }: FieldGroupProps) {
    return (
        <Card className="@container space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <h3 className="text-xl text-ink">{title}</h3>
                    {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            {children}
        </Card>
    )
}

/** Two columns once the card is wide enough. */
export function FieldRow({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-1 items-start gap-5 @xl:grid-cols-2">{children}</div>
}
