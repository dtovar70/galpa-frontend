import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react'

import type { DesignPrintArea } from '@/@types/product'
import { cn } from '@/utils/cn'
import { growArea, moveArea, resizeArea, roundArea, type AreaCorner } from '@/utils/printArea'

/** Arrow keys move (or, with Alt, resize) 0.5 % of the photo; with Shift, 5 %. */
const KEY_STEP = 0.005
const KEY_STEP_FAST = 0.05
/** Largest share of the viewport height the photo may take. */
const MAX_VIEWPORT_HEIGHT = 60

const CORNERS: { corner: AreaCorner; className: string; label: string }[] = [
    {
        corner: 'nw',
        className: '-top-3.5 -left-3.5 cursor-nwse-resize',
        label: 'superior izquierda',
    },
    {
        corner: 'ne',
        className: '-top-3.5 -right-3.5 cursor-nesw-resize',
        label: 'superior derecha',
    },
    {
        corner: 'sw',
        className: '-bottom-3.5 -left-3.5 cursor-nesw-resize',
        label: 'inferior izquierda',
    },
    {
        corner: 'se',
        className: '-right-3.5 -bottom-3.5 cursor-nwse-resize',
        label: 'inferior derecha',
    },
]

const ARROWS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
}

type Drag = {
    pointerId: number
    mode: 'move' | AreaCorner
    startX: number
    startY: number
    start: DesignPrintArea
    /** The photo box in CSS pixels, to turn pointer movement into fractions of the photo. */
    width: number
    height: number
}

export interface PrintAreaEditorProps {
    imageUrl: string
    /** Pixel size of the photo. */
    photoWidth: number
    photoHeight: number
    area: DesignPrintArea
    onChange: (area: DesignPrintArea) => void
    disabled?: boolean
}

/**
 * The template photo with the print area on it: drag the rectangle to move it, drag a corner to
 * resize it (mouse, pen or finger), or focus it and use the arrow keys (Alt + arrows resizes).
 */
export function PrintAreaEditor({
    imageUrl,
    photoWidth,
    photoHeight,
    area,
    onChange,
    disabled = false,
}: PrintAreaEditorProps) {
    const boxRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<Drag | null>(null)
    const hintId = useId()

    const startDrag = (event: PointerEvent<HTMLElement>, mode: Drag['mode']) => {
        const box = boxRef.current?.getBoundingClientRect()
        if (disabled || !box || event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = {
            pointerId: event.pointerId,
            mode,
            startX: event.clientX,
            startY: event.clientY,
            start: area,
            width: box.width,
            height: box.height,
        }
    }

    const onPointerMove = (event: PointerEvent<HTMLElement>) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        const dx = (event.clientX - drag.startX) / drag.width
        const dy = (event.clientY - drag.startY) / drag.height
        const next =
            drag.mode === 'move'
                ? moveArea(drag.start, dx, dy)
                : resizeArea(drag.start, drag.mode, dx, dy)
        onChange(roundArea(next))
    }

    const endDrag = (event: PointerEvent<HTMLElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
    }

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const arrow = ARROWS[event.key]
        if (!arrow || disabled) return
        event.preventDefault()
        const step = event.shiftKey ? KEY_STEP_FAST : KEY_STEP
        const [dx, dy] = [arrow[0] * step, arrow[1] * step]
        onChange(roundArea(event.altKey ? growArea(area, dx, dy) : moveArea(area, dx, dy)))
    }

    const dragHandlers = {
        onPointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div
                ref={boxRef}
                className="relative mx-auto select-none"
                style={{
                    aspectRatio: `${photoWidth} / ${photoHeight}`,
                    width: `min(100%, ${(MAX_VIEWPORT_HEIGHT * photoWidth) / photoHeight}dvh)`,
                }}
            >
                <img
                    src={imageUrl}
                    alt="Foto de la plantilla"
                    // Same CORS mode as the store's editor, so both share one cached copy.
                    crossOrigin="anonymous"
                    draggable={false}
                    className="block size-full object-contain"
                />
                {/* Dims what is outside the area. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-[2px] shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]"
                    style={{
                        left: `${area.x * 100}%`,
                        top: `${area.y * 100}%`,
                        width: `${area.width * 100}%`,
                        height: `${area.height * 100}%`,
                    }}
                />
                <div
                    role="group"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={`Área de impresión: empieza en ${Math.round(area.x * 100)} % y ${Math.round(area.y * 100)} %, mide ${Math.round(area.width * 100)} % × ${Math.round(area.height * 100)} % de la foto.`}
                    aria-describedby={hintId}
                    onKeyDown={onKeyDown}
                    onPointerDown={(event) => startDrag(event, 'move')}
                    {...dragHandlers}
                    className={cn(
                        'absolute touch-none rounded-[2px] border-2 border-dashed border-blush-500 bg-blush-400/10 outline-none focus-visible:ring-4 focus-visible:ring-blush-300',
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-move',
                    )}
                    style={{
                        left: `${area.x * 100}%`,
                        top: `${area.y * 100}%`,
                        width: `${area.width * 100}%`,
                        height: `${area.height * 100}%`,
                    }}
                >
                    <span className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-2 text-[10px] font-semibold whitespace-nowrap text-blush-700 shadow-soft">
                        Área de impresión
                    </span>
                    {CORNERS.map(({ corner, className, label }) => (
                        <span
                            key={corner}
                            aria-hidden="true"
                            title={`Esquina ${label}`}
                            onPointerDown={(event) => startDrag(event, corner)}
                            {...dragHandlers}
                            className={cn(
                                'absolute flex size-7 touch-none items-center justify-center',
                                className,
                            )}
                        >
                            <span className="size-3.5 rounded-full border-2 border-white bg-blush-500 shadow-soft" />
                        </span>
                    ))}
                </div>
            </div>
            <p id={hintId} className="sr-only">
                Usa las flechas para mover el área; con Alt (u Opción) y las flechas cambias su
                tamaño. Con Mayúsculas, los pasos son más grandes.
            </p>
        </div>
    )
}
