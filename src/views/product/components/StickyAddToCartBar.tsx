import { useEffect, useState, type ReactNode, type RefObject } from 'react'

import { PriceTag } from '@/components/shared/PriceTag'
import { cn } from '@/utils/cn'

/** Matches the bar's height below `lg` (where the bar is shown). */
const BODY_PADDING_CLASS = 'max-lg:pb-20'

export interface StickyAddToCartBarProps {
    /** The inline add-to-cart row; the bar shows once it has scrolled up out of view. */
    anchorRef: RefObject<HTMLElement | null>
    price: number
    compareAtPrice?: number
    /** The add button (same rules as the inline one: stock, design, quantity). */
    children: ReactNode
}

/**
 * Phones only: a bar pinned to the bottom with the price and "Agregar al carrito", so the
 * customer never has to scroll back up past the description and details to buy.
 */
export function StickyAddToCartBar({
    anchorRef,
    price,
    compareAtPrice,
    children,
}: StickyAddToCartBarProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const anchor = anchorRef.current
        if (!anchor || typeof IntersectionObserver === 'undefined') return
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry) return
            // Only once it is above the viewport: before reaching it, it is still ahead.
            setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
        })
        observer.observe(anchor)
        return () => observer.disconnect()
    }, [anchorRef])

    // While the bar is up, the page gets room at the bottom so it never hides the footer.
    useEffect(() => {
        if (!isVisible) return
        document.body.classList.add(BODY_PADDING_CLASS)
        return () => document.body.classList.remove(BODY_PADDING_CLASS)
    }, [isVisible])

    return (
        <div
            aria-hidden={!isVisible}
            inert={!isVisible}
            className={cn(
                'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lift backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden',
                isVisible ? 'translate-y-0' : 'translate-y-full',
            )}
        >
            <div className="mx-auto flex max-w-xl items-center gap-3">
                <PriceTag
                    price={price}
                    compareAtPrice={compareAtPrice}
                    size="md"
                    className="min-w-0 shrink-0 flex-col items-start gap-0"
                />
                <div className="min-w-0 flex-1 [&>button]:w-full">{children}</div>
            </div>
        </div>
    )
}
