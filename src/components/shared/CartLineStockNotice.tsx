import { CircleAlert } from 'lucide-react'

import { cn } from '@/utils/cn'
import type { LineStockIssue } from '@/utils/cartAvailability'

export interface CartLineStockNoticeProps {
    issue: LineStockIssue
    /** Sets the line to what it can keep ("Ajustar a N"). */
    onAdjust: (quantity: number) => void
    className?: string
}

function issueText(issue: LineStockIssue): string {
    switch (issue.kind) {
        case 'unavailable':
            return 'Ya no está disponible: quítalo del carrito.'
        case 'soldOut':
            return 'Agotado: quítalo del carrito.'
        case 'overStock':
            if (issue.fixTo > 0) {
                return issue.stock === 1 ? 'Solo queda 1.' : `Solo quedan ${issue.stock}.`
            }
            return issue.stock === 1
                ? 'La única unidad que queda ya está en otra línea de tu carrito: quita esta.'
                : `Las ${issue.stock} unidades que quedan ya están en otras líneas de tu carrito: quita esta.`
    }
}

/**
 * Inline warning of a cart line whose stock dropped (sold out, gone, or fewer units than the
 * line asks), with a one-tap fix when the line can keep some units.
 */
export function CartLineStockNotice({ issue, onAdjust, className }: CartLineStockNoticeProps) {
    const fixTo = issue.kind === 'overStock' && issue.fixTo > 0 ? issue.fixTo : null

    return (
        <p
            role="status"
            className={cn(
                'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-blush-700',
                className,
            )}
        >
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            <span>{issueText(issue)}</span>
            {fixTo !== null ? (
                <button
                    type="button"
                    onClick={() => onAdjust(fixTo)}
                    className="rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold text-blush-800 transition hover:bg-blush-200 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
                >
                    Ajustar a {fixTo}
                </button>
            ) : null}
        </p>
    )
}
