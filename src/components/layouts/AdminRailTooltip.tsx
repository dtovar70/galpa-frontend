import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type FocusEvent,
    type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/cn'

/** Hover intent: a pointer just passing over the rail does not flash every tooltip. */
const SHOW_DELAY_MS = 150
/** Space between the trigger and the card, where the arrow sits. */
const GAP_PX = 12
const VIEWPORT_MARGIN_PX = 8
/** How close the arrow may get to the card's rounded corners. */
const ARROW_INSET_PX = 14

type Side = 'right' | 'left' | 'top' | 'bottom'

interface Position {
    top: number
    left: number
    side: Side
    /** Along the card edge that faces the trigger: from its top, or from its left. */
    arrowOffset: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

const ARROW_CLASS: Record<Side, string> = {
    right: '-left-[6px] -translate-y-1/2 border-b border-l',
    left: '-right-[6px] -translate-y-1/2 border-t border-r',
    top: '-bottom-[6px] -translate-x-1/2 border-r border-b',
    bottom: '-top-[6px] -translate-x-1/2 border-t border-l',
}

const ORIGIN_CLASS: Record<Side, string> = {
    right: 'origin-left',
    left: 'origin-right',
    top: 'origin-bottom',
    bottom: 'origin-top',
}

export interface RailTooltipProps {
    /** Card content. It is decorative: the trigger carries the full accessible name. */
    content: ReactNode
    /** Off, it only renders the trigger (e.g. while the sidebar shows its labels). */
    enabled: boolean
    /** The trigger: one focusable element (a link or a button). */
    children: ReactNode
    className?: string
    /**
     * `side` (default): to the right of the trigger, flipped left without room. `top`: above
     * it, flipped below without room; for triggers inside a row, where a card on the side
     * would cover their neighbours.
     */
    placement?: 'side' | 'top'
    /**
     * `side` only: a selector for an ancestor (e.g. the rail) whose edge the card starts from,
     * instead of the trigger's own edge. In a grid of icons, the card of the first column then
     * clears the second one. The card stays vertically centred on the trigger.
     */
    sideEdge?: string
}

/**
 * A tooltip for the admin sidebar: a white card to the right of the trigger (or of the rail,
 * see `sideEdge`; or above it, see `placement`), with an arrow pointing at it. It is
 * portalled so the sidebar's `overflow` never clips it, centred
 * on the trigger, flipped to the left or clamped when the viewport has no room, shown after
 * a short hover or on keyboard focus and hidden at once on leave, blur, click or Escape.
 */
export function RailTooltip({
    content,
    enabled,
    children,
    className,
    placement = 'side',
    sideEdge,
}: RailTooltipProps) {
    const anchorRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<number | undefined>(undefined)
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState<Position | null>(null)

    // Turning the rail off (expanding the sidebar) drops an open tooltip...
    const [wasEnabled, setWasEnabled] = useState(enabled)
    if (enabled !== wasEnabled) {
        setWasEnabled(enabled)
        if (!enabled) setOpen(false)
    }
    // ...and a pending one.
    useEffect(() => {
        if (!enabled) return
        return () => window.clearTimeout(timerRef.current)
    }, [enabled])

    const hide = useCallback(() => {
        window.clearTimeout(timerRef.current)
        setOpen(false)
    }, [])

    const showSoon = () => {
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    }

    const place = useCallback(() => {
        const anchor = anchorRef.current
        const card = cardRef.current
        if (!anchor || !card) return
        const rect = anchor.getBoundingClientRect()
        const width = card.offsetWidth
        const height = card.offsetHeight

        const maxLeft = window.innerWidth - VIEWPORT_MARGIN_PX - width
        const maxTop = window.innerHeight - VIEWPORT_MARGIN_PX - height

        if (placement === 'top') {
            const roomAbove = rect.top - GAP_PX - VIEWPORT_MARGIN_PX
            const roomBelow = window.innerHeight - rect.bottom - GAP_PX - VIEWPORT_MARGIN_PX
            const side = roomAbove < height && roomBelow > roomAbove ? 'bottom' : 'top'
            const anchorCenter = rect.left + rect.width / 2
            const left = clamp(anchorCenter - width / 2, VIEWPORT_MARGIN_PX, maxLeft)
            setPosition({
                top: side === 'top' ? rect.top - GAP_PX - height : rect.bottom + GAP_PX,
                left,
                side,
                arrowOffset: clamp(anchorCenter - left, ARROW_INSET_PX, width - ARROW_INSET_PX),
            })
            return
        }

        const edge = (sideEdge ? anchor.closest(sideEdge) : null)?.getBoundingClientRect() ?? rect
        const roomRight = window.innerWidth - edge.right - GAP_PX - VIEWPORT_MARGIN_PX
        const roomLeft = edge.left - GAP_PX - VIEWPORT_MARGIN_PX
        const side = roomRight < width && roomLeft > roomRight ? 'left' : 'right'
        const preferredLeft = side === 'right' ? edge.right + GAP_PX : edge.left - GAP_PX - width
        const left = clamp(preferredLeft, VIEWPORT_MARGIN_PX, maxLeft)

        const anchorCenter = rect.top + rect.height / 2
        const top = clamp(anchorCenter - height / 2, VIEWPORT_MARGIN_PX, maxTop)

        setPosition({
            top,
            left,
            side,
            arrowOffset: clamp(anchorCenter - top, ARROW_INSET_PX, height - ARROW_INSET_PX),
        })
    }, [placement, sideEdge])

    /* Measured before paint, then kept in place while anything scrolls or resizes. */
    useLayoutEffect(() => {
        if (!open) return
        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') hide()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
            document.removeEventListener('keydown', onKeyDown)
            setPosition(null)
        }
    }, [hide, open, place])

    return (
        <div
            ref={anchorRef}
            className={className}
            onMouseEnter={enabled ? showSoon : undefined}
            onMouseLeave={enabled ? hide : undefined}
            // Only keyboard focus: a mouse click also focuses, and the pointer already hovers.
            onFocus={
                enabled
                    ? (event: FocusEvent<HTMLDivElement>) => {
                          if ((event.target as HTMLElement).matches(':focus-visible')) showSoon()
                      }
                    : undefined
            }
            onBlur={enabled ? hide : undefined}
            onClickCapture={enabled ? hide : undefined}
        >
            {children}
            {open
                ? createPortal(
                      <div
                          ref={cardRef}
                          aria-hidden="true"
                          style={{
                              top: position?.top ?? 0,
                              left: position?.left ?? 0,
                              opacity: position ? undefined : 0,
                          }}
                          className={cn(
                              'pointer-events-none fixed z-60 max-w-[calc(100vw-1rem)] rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-soft',
                              ORIGIN_CLASS[position?.side ?? 'right'],
                              position && 'animate-select-pop motion-reduce:animate-none',
                          )}
                      >
                          {position ? (
                              <span
                                  style={
                                      position.side === 'right' || position.side === 'left'
                                          ? { top: position.arrowOffset }
                                          : { left: position.arrowOffset }
                                  }
                                  className={cn(
                                      'absolute size-2.5 rotate-45 border-line bg-white',
                                      ARROW_CLASS[position.side],
                                  )}
                              />
                          ) : null}
                          {content}
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    )
}
