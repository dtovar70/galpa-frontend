import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type AriaRole,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/cn'
import { useLockBodyScroll } from '@/utils/hooks/useLockBodyScroll'
import { useMediaQuery } from '@/utils/hooks/useMediaQuery'

/** Gap between the panel and the viewport edges. */
const VIEWPORT_MARGIN_PX = 8
/** How close the arrow may get to the panel's rounded corners. */
const ARROW_INSET_PX = 16
const SHEET_QUERY = '(max-width: 639px)'

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type PopoverCloseReason = 'escape' | 'outside'

export interface PopoverProps {
    open: boolean
    /** The element the panel points at; it also counts as "inside" for outside clicks. */
    anchorRef: RefObject<HTMLElement | null>
    onClose: (reason: PopoverCloseReason) => void
    children: ReactNode
    /** Preferred side. It flips when the other side has more room. */
    placement?: 'bottom' | 'top'
    align?: 'start' | 'center' | 'end'
    offset?: number
    arrow?: boolean
    /** Below 640px the panel becomes a bottom sheet with a backdrop. */
    sheetOnMobile?: boolean
    /** Keeps Tab inside the panel, for dialog-like content. */
    trapFocus?: boolean
    /** A purely visual panel (a hint): no pointer events, hidden from assistive tech. */
    decorative?: boolean
    /**
     * Where the panel is portalled; `document.body` by default. Inside a modal `<dialog>` pass
     * the dialog: everything outside the top layer is inert and drawn beneath it.
     */
    container?: Element | null
    id?: string
    role?: AriaRole
    'aria-label'?: string
    className?: string
}

interface Position {
    top: number
    left: number
    side: 'bottom' | 'top'
    arrowLeft: number
    /** Set only when the panel is taller than the room on either side: it then scrolls. */
    maxHeight?: number
}

/**
 * A floating panel rendered in a portal, so no `overflow` container clips it. It is placed
 * against the viewport, flips above or below to find room, stays inside the screen (scrolling
 * inside only when neither side fits it) and closes on Escape (handing focus back to the
 * anchor) and on a press outside.
 */
export function Popover({
    open,
    anchorRef,
    onClose,
    children,
    placement = 'bottom',
    align = 'center',
    offset = 10,
    arrow = false,
    sheetOnMobile = false,
    trapFocus = false,
    decorative = false,
    container,
    id,
    role,
    'aria-label': ariaLabel,
    className,
}: PopoverProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<Position | null>(null)
    const isSmall = useMediaQuery(SHEET_QUERY)
    const asSheet = sheetOnMobile && isSmall

    useLockBodyScroll(open && asSheet)

    const place = useCallback(() => {
        const anchor = anchorRef.current
        const panel = panelRef.current
        if (!anchor || !panel) return
        const rect = anchor.getBoundingClientRect()
        const width = panel.offsetWidth
        // The natural height, even while a previous `maxHeight` is clipping it.
        const height = panel.scrollHeight + panel.offsetHeight - panel.clientHeight

        const roomBelow = window.innerHeight - rect.bottom - offset - VIEWPORT_MARGIN_PX
        const roomAbove = rect.top - offset - VIEWPORT_MARGIN_PX
        const side =
            placement === 'bottom'
                ? roomBelow < height && roomAbove > roomBelow
                    ? 'top'
                    : 'bottom'
                : roomAbove < height && roomBelow > roomAbove
                  ? 'bottom'
                  : 'top'
        const room = side === 'bottom' ? roomBelow : roomAbove
        const shownHeight = Math.min(height, room)

        const preferredLeft =
            align === 'start'
                ? rect.left
                : align === 'end'
                  ? rect.right - width
                  : rect.left + rect.width / 2 - width / 2
        const maxLeft = window.innerWidth - VIEWPORT_MARGIN_PX - width
        const left = Math.max(VIEWPORT_MARGIN_PX, Math.min(preferredLeft, maxLeft))
        const top = side === 'bottom' ? rect.bottom + offset : rect.top - offset - shownHeight
        const anchorCenter = rect.left + rect.width / 2 - left

        setPosition({
            top: Math.max(VIEWPORT_MARGIN_PX, top),
            left,
            side,
            arrowLeft: Math.max(ARROW_INSET_PX, Math.min(anchorCenter, width - ARROW_INSET_PX)),
            // Last resort, on very short windows: scroll inside rather than leave the screen.
            maxHeight: height > room ? Math.max(room, 0) : undefined,
        })
    }, [align, anchorRef, offset, placement])

    /* Measured before paint, then kept in place while anything scrolls or resizes. */
    useLayoutEffect(() => {
        if (!open || asSheet) return
        place()
        const panel = panelRef.current
        const observer = new ResizeObserver(place)
        if (panel) observer.observe(panel)
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
            // Next time it opens hidden, until it is measured again.
            setPosition(null)
        }
    }, [asSheet, open, place])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Escape') return
            event.preventDefault()
            onClose('escape')
            anchorRef.current?.focus()
        }
        /* Pointer down rather than click, like the Select: gone before the next widget reacts. */
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node
            if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
            onClose('outside')
        }
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('pointerdown', onPointerDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('pointerdown', onPointerDown)
        }
    }, [anchorRef, onClose, open])

    const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!trapFocus || event.key !== 'Tab') return
        const focusable = [
            ...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
        ].filter((element) => element.offsetParent !== null)
        const first = focusable[0]
        const last = focusable.at(-1)
        if (!first || !last) return
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
        }
    }

    if (!open) return null

    const a11y = decorative
        ? { 'aria-hidden': true as const }
        : { id, role, 'aria-label': ariaLabel, 'aria-modal': asSheet ? true : undefined }

    if (asSheet) {
        return createPortal(
            <div className="fixed inset-0 z-60 flex flex-col justify-end">
                <div aria-hidden="true" className="absolute inset-0 bg-ink/35" />
                <div
                    ref={panelRef}
                    {...a11y}
                    onKeyDown={onPanelKeyDown}
                    className={cn(
                        'relative max-h-[88dvh] animate-sheet-up overflow-y-auto overscroll-contain rounded-t-3xl border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-lift',
                        className,
                    )}
                >
                    <div
                        aria-hidden="true"
                        className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line"
                    />
                    {children}
                </div>
            </div>,
            container ?? document.body,
        )
    }

    return createPortal(
        <div
            ref={panelRef}
            {...a11y}
            onKeyDown={onPanelKeyDown}
            style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                maxHeight: position?.maxHeight,
                // Transparent rather than hidden until measured, so content can take focus on mount.
                opacity: position ? undefined : 0,
            }}
            className={cn(
                'fixed z-60 max-w-[calc(100vw-1rem)] rounded-2xl border-2 border-line bg-white shadow-lift',
                position?.maxHeight !== undefined && 'overflow-y-auto overscroll-contain',
                position?.side === 'top' ? 'origin-bottom' : 'origin-top',
                position && 'animate-select-pop',
                decorative && 'pointer-events-none',
                className,
            )}
        >
            {arrow && position ? (
                <span
                    aria-hidden="true"
                    style={{ left: position.arrowLeft }}
                    className={cn(
                        'absolute size-3 -translate-x-1/2 rotate-45 border-line bg-white',
                        position.side === 'bottom'
                            ? '-top-[7px] border-t-2 border-l-2'
                            : '-bottom-[7px] border-r-2 border-b-2',
                    )}
                />
            ) : null}
            {children}
        </div>,
        container ?? document.body,
    )
}
