import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Button, Tooltip } from '@/components/ui'
import { useCartActions } from '@/store/cartStore'
import { cn } from '@/utils/cn'

/** How long the button stays armed before it falls back to its idle state. */
const CONFIRM_TIMEOUT_MS = 4000

export interface ClearCartButtonProps {
    itemCount: number
    className?: string
}

/**
 * Empties the whole cart in one go. Emptying cannot be undone, so the button arms itself
 * first and only wipes on a second, explicit confirmation.
 */
export function ClearCartButton({ itemCount, className }: ClearCartButtonProps) {
    const { clear } = useCartActions()
    const [isArmed, setIsArmed] = useState(false)

    useEffect(() => {
        if (!isArmed) return

        const timeout = window.setTimeout(() => setIsArmed(false), CONFIRM_TIMEOUT_MS)
        return () => window.clearTimeout(timeout)
    }, [isArmed])

    if (isArmed) {
        return (
            <div className={cn('flex items-center gap-1.5', className)}>
                <span className="text-xs font-semibold text-ink-soft">¿Vaciar todo?</span>
                <Button size="sm" onClick={clear} className="h-8 px-3 text-xs">
                    Sí
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsArmed(false)}
                    className="h-8 px-3 text-xs"
                >
                    No
                </Button>
            </div>
        )
    }

    return (
        <Tooltip label="Vaciar el carrito" align="end" className={className}>
            <button
                type="button"
                aria-label={`Vaciar el carrito (${itemCount} productos)`}
                onClick={() => setIsArmed(true)}
                className="flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700"
            >
                <Trash2 aria-hidden="true" className="size-4" />
            </button>
        </Tooltip>
    )
}
