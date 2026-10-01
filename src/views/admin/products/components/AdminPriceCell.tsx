import { useCallback, useId, useRef, useState, type FocusEvent, type PointerEvent } from 'react'
import { Tags } from 'lucide-react'

import type { AdminProduct } from '@/@types/admin'
import { Popover } from '@/components/ui'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { priceRange, variantPrice } from '@/utils/productPrice'

/** "$20" instead of "$20,00" when there are no cents, so the range fits a narrow column. */
function formatCompact(amount: number): string {
    return formatCurrency(amount).replace(/,00$/, '')
}

function formatDelta(delta: number): string {
    if (delta === 0) return 'precio base'
    return `${delta > 0 ? '+' : '−'}${formatCurrency(Math.abs(delta))}`
}

function DeltaPill({ delta }: { delta: number }) {
    if (delta === 0) {
        return <span className="text-[0.7rem] font-semibold text-ink-soft">base</span>
    }
    return (
        <span
            className={cn(
                'rounded-full px-1.5 py-px text-[0.7rem] font-bold tabular-nums',
                delta < 0 ? 'bg-frost-100 text-frost-800' : 'bg-warning-100 text-ink',
            )}
        >
            {formatDelta(delta)}
        </span>
    )
}

export interface AdminPriceCellProps {
    product: AdminProduct
    align?: 'start' | 'center'
}

/**
 * The base price, plus what the store really charges when variants adjust it: the range, and
 * each variant's final price in a popover (hover, keyboard focus or a tap). Without it "$22"
 * in the list and "$20" in the store look like a bug.
 */
export function AdminPriceCell({ product, align = 'start' }: AdminPriceCellProps) {
    const { min, max } = priceRange(product)
    const isVariable = min !== max
    const hasCompareAt = product.compareAtPrice !== undefined && product.compareAtPrice > min
    const breakdown = product.variants.map(
        (variant) =>
            `${variant.label}: ${formatCurrency(variantPrice(product, variant))} (${formatDelta(variant.priceDelta)})`,
    )

    const triggerRef = useRef<HTMLButtonElement>(null)
    const lastPointer = useRef<string>('')
    const [isOpen, setIsOpen] = useState(false)
    const srId = useId()
    const close = useCallback(() => setIsOpen(false), [])

    const onPointerEnter = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') setIsOpen(true)
    }
    const onPointerLeave = (event: PointerEvent) => {
        if (event.pointerType === 'mouse' && document.activeElement !== triggerRef.current) {
            setIsOpen(false)
        }
    }
    /* Only keyboard focus opens it; a tap focuses too, and the click below toggles instead. */
    const onFocus = (event: FocusEvent<HTMLButtonElement>) => {
        if (event.currentTarget.matches(':focus-visible')) setIsOpen(true)
    }
    const onClick = () => {
        if (lastPointer.current === 'mouse') setIsOpen(true)
        else setIsOpen((current) => !current)
        lastPointer.current = ''
    }

    return (
        <div
            className={cn(
                'flex flex-col gap-0.5',
                align === 'center' ? 'items-center text-center' : 'items-start',
            )}
        >
            <span className="font-semibold text-ink">{formatCurrency(product.price)}</span>

            {isVariable ? (
                <>
                    <button
                        ref={triggerRef}
                        type="button"
                        aria-describedby={srId}
                        onPointerDown={(event) => (lastPointer.current = event.pointerType)}
                        onPointerEnter={onPointerEnter}
                        onPointerLeave={onPointerLeave}
                        onFocus={onFocus}
                        onBlur={close}
                        onClick={onClick}
                        className={cn(
                            'inline-flex cursor-help items-center gap-1 rounded-full bg-frost-50 px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap text-frost-900 transition hover:bg-frost-100',
                            isOpen && 'bg-frost-100',
                        )}
                    >
                        <Tags aria-hidden="true" className="size-3" />
                        {formatCompact(min)} – {formatCompact(max)}
                        <span className="sr-only"> según la variante</span>
                    </button>
                    {/* The popover is visual only; screen readers get the same list from here. */}
                    <span id={srId} className="sr-only">
                        {breakdown.join('. ')}.
                    </span>

                    <Popover
                        open={isOpen}
                        anchorRef={triggerRef}
                        onClose={close}
                        placement="bottom"
                        align="center"
                        arrow
                        decorative
                        className="w-64 p-3.5 text-left"
                    >
                        <p className="mb-2 text-sm font-semibold text-ink">Precio por variante</p>
                        <ul className="divide-y divide-line">
                            {product.variants.map((variant, index) => (
                                <li
                                    key={`${index}-${variant.label}`}
                                    className="flex items-center justify-between gap-3 py-1.5"
                                >
                                    <span className="min-w-0 truncate text-sm text-ink-soft">
                                        {variant.label}
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2">
                                        <DeltaPill delta={variant.priceDelta} />
                                        <span className="w-16 text-right text-sm font-semibold text-ink tabular-nums">
                                            {formatCurrency(variantPrice(product, variant))}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Popover>
                </>
            ) : null}

            {hasCompareAt ? (
                <span className="text-xs text-ink-soft line-through">
                    <span className="sr-only">Antes </span>
                    {formatCurrency(product.compareAtPrice as number)}
                </span>
            ) : null}
        </div>
    )
}
