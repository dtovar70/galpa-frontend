import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
} from 'react'

import type { DesignPlacement } from '@/@types/design'
import { normalizePlacement } from '@/utils/designGeometry'

interface Point {
    x: number
    y: number
}

/** Arrow keys move 1% of the area (5% with Shift); +/- scale 5%; [ and ] rotate 5°. */
const KEY_STEP = 0.01
const KEY_STEP_LARGE = 0.05
const KEY_SCALE = 1.05
const KEY_ROTATION = 5
/** Mouse wheel / trackpad zoom sensitivity (per wheel delta pixel). */
const WHEEL_ZOOM = 0.0015

export interface DesignGestureHandlers {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void
    onPointerMove: (event: PointerEvent<HTMLElement>) => void
    onPointerUp: (event: PointerEvent<HTMLElement>) => void
    onPointerCancel: (event: PointerEvent<HTMLElement>) => void
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

function distance(a: Point, b: Point): number {
    return Math.hypot(b.x - a.x, b.y - a.y)
}

function angle(a: Point, b: Point): number {
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

/**
 * Drag to move (mouse or one finger), pinch to scale and twist to rotate (two fingers), wheel to
 * zoom and the keyboard for everything. Each move is applied to the latest placement and handed
 * to `onChange` at most once per animation frame, so React renders at the display's pace.
 *
 * `areaRef` is the print area box: movements are measured in its width and height. The
 * placement is the selected layer's.
 */
export function useDesignGestures(
    stageRef: RefObject<HTMLElement | null>,
    areaRef: RefObject<HTMLElement | null>,
    placement: DesignPlacement,
    onChange: (placement: DesignPlacement) => void,
    enabled: boolean,
): DesignGestureHandlers {
    const latest = useRef(placement)
    const onChangeRef = useRef(onChange)
    const frame = useRef<number | null>(null)
    const pointers = useRef(new Map<number, Point>())
    const areaSize = useRef({ width: 1, height: 1 })

    // Layout effects: tapping another layer selects it, and the very next move must already
    // act on that layer.
    useLayoutEffect(() => {
        latest.current = placement
    }, [placement])

    useLayoutEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    useEffect(
        () => () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)
            // A stale id would block every later frame (see MugPreview3D's loop).
            frame.current = null
        },
        [],
    )

    const commit = useCallback((next: DesignPlacement) => {
        latest.current = normalizePlacement(next)
        if (frame.current !== null) return
        frame.current = requestAnimationFrame(() => {
            frame.current = null
            onChangeRef.current(latest.current)
        })
    }, [])

    const measureArea = useCallback(() => {
        const rect = areaRef.current?.getBoundingClientRect()
        if (rect && rect.width > 0 && rect.height > 0) {
            areaSize.current = { width: rect.width, height: rect.height }
        }
    }, [areaRef])

    // Wheel zoom needs a non-passive listener to keep the page from scrolling.
    useEffect(() => {
        const stage = stageRef.current
        if (!stage || !enabled) return
        const onWheel = (event: WheelEvent) => {
            event.preventDefault()
            const current = latest.current
            commit({ ...current, scale: current.scale * Math.exp(-event.deltaY * WHEEL_ZOOM) })
        }
        stage.addEventListener('wheel', onWheel, { passive: false })
        return () => stage.removeEventListener('wheel', onWheel)
    }, [stageRef, enabled, commit])

    const release = useCallback((event: PointerEvent<HTMLElement>) => {
        pointers.current.delete(event.pointerId)
        // Hands the last move over now: the next tap may select another layer.
        if (frame.current !== null) {
            cancelAnimationFrame(frame.current)
            frame.current = null
            onChangeRef.current(latest.current)
        }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }, [])

    return {
        onPointerDown: (event) => {
            if (!enabled || (event.pointerType === 'mouse' && event.button !== 0)) return
            // Keeps the moves coming even when the finger leaves the stage.
            event.currentTarget.setPointerCapture(event.pointerId)
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
            measureArea()
        },
        onPointerMove: (event) => {
            const previous = pointers.current.get(event.pointerId)
            if (!enabled || !previous) return
            event.preventDefault()
            const current = { x: event.clientX, y: event.clientY }
            const ids = [...pointers.current.keys()]
            const { width, height } = areaSize.current
            const placementNow = latest.current

            if (ids.length === 1) {
                commit({
                    ...placementNow,
                    x: placementNow.x + (current.x - previous.x) / width,
                    y: placementNow.y + (current.y - previous.y) / height,
                })
            } else if (ids.slice(0, 2).includes(event.pointerId)) {
                // Two fingers: this one moved from `previous` to `current`, the other stayed.
                const otherId = ids.slice(0, 2).find((id) => id !== event.pointerId)!
                const other = pointers.current.get(otherId)!
                const before = distance(previous, other)
                const after = distance(current, other)
                const midBefore = { x: (previous.x + other.x) / 2, y: (previous.y + other.y) / 2 }
                const midAfter = { x: (current.x + other.x) / 2, y: (current.y + other.y) / 2 }
                commit({
                    x: placementNow.x + (midAfter.x - midBefore.x) / width,
                    y: placementNow.y + (midAfter.y - midBefore.y) / height,
                    scale: before > 0 ? placementNow.scale * (after / before) : placementNow.scale,
                    rotation:
                        placementNow.rotation + angle(other, current) - angle(other, previous),
                })
            }
            pointers.current.set(event.pointerId, current)
        },
        onPointerUp: release,
        onPointerCancel: release,
        onKeyDown: (event) => {
            if (!enabled) return
            const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP
            const current = latest.current
            const moves: Record<string, Partial<DesignPlacement>> = {
                ArrowLeft: { x: current.x - step },
                ArrowRight: { x: current.x + step },
                ArrowUp: { y: current.y - step },
                ArrowDown: { y: current.y + step },
                '+': { scale: current.scale * KEY_SCALE },
                '=': { scale: current.scale * KEY_SCALE },
                '-': { scale: current.scale / KEY_SCALE },
                '[': { rotation: current.rotation - KEY_ROTATION },
                ']': { rotation: current.rotation + KEY_ROTATION },
            }
            const change = moves[event.key]
            if (!change) return
            event.preventDefault()
            commit({ ...current, ...change })
        },
    }
}
