import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/utils/cn'
import { composePrintArea, type RenderLayer } from '@/utils/designImage'
import { usePrefersReducedMotion } from '@/utils/hooks/useMediaQuery'
import { drawMug, MUG_FRONT_ROTATION, MUG_SCENE_ASPECT, mugLayout } from '@/utils/mug3d'

export interface MugPreview3DProps {
    /** The design's layers, bottom to top (the same drawing as the arte final). */
    layers: readonly RenderLayer[]
    /** Physical size of the print area. */
    print: { widthCm: number; heightCm: number }
    /** The mug's color (`#RRGGBB`). */
    bodyColor: string
    /** Bump to recompose the print with the same layers (e.g. once a font has loaded). */
    redrawKey?: number
    className?: string
}

/** Device pixels of the canvas, at most (enough detail, cheap to redraw on a phone). */
const MAX_CANVAS_WIDTH = 900
/** Width of the print texture: enough for the visible half without costing much to compose. */
const TEXTURE_WIDTH = 1024
/** Layer changes are composed again after this pause (a slider drag sends many). */
const TEXTURE_DEBOUNCE_MS = 100
/** Until the first interaction the mug turns slowly by itself (radians per second). */
const AUTO_SPEED = 0.45
/** How fast a flick slows down (per second), and when it stops (radians per second). */
const FRICTION = 3.2
const MIN_SPEED = 0.05
/** The buttons turn by an eighth of a turn. */
const BUTTON_STEP = Math.PI / 4
const TURN = 2 * Math.PI

interface Motion {
    rotation: number
    /** Radians per second, after a flick. */
    velocity: number
    /** Where a button asked to go (eased towards), or null. */
    target: number | null
    autoRotate: boolean
    dragging: boolean
    lastX: number
    lastMove: number
    lastFrame: number
}

/**
 * "Ver en 3D": the design wrapped around a rotating mug, drawn on a canvas by `drawMug`. Drag
 * sideways to turn it (with inertia), or use the buttons. It only draws when something changes
 * (a frame loop runs only while it turns), and honours "reduce motion" (no auto-rotation, no
 * inertia, the buttons jump instead of easing).
 */
export function MugPreview3D({
    layers,
    print,
    bodyColor,
    redrawKey = 0,
    className,
}: MugPreview3DProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textureRef = useRef<HTMLCanvasElement | null>(null)
    const frameRef = useRef(0)
    const reducedMotion = usePrefersReducedMotion()
    const motionRef = useRef<Motion>({
        // Starts (and auto-rotates from) the "Frente" view, the handle showing on the right.
        rotation: MUG_FRONT_ROTATION,
        velocity: 0,
        target: null,
        autoRotate: true,
        dragging: false,
        lastX: 0,
        lastMove: 0,
        lastFrame: 0,
    })
    // What the frame loop draws with, kept current without restarting it.
    const sceneRef = useRef({ bodyColor, print, reducedMotion })
    const { widthCm, heightCm } = print

    const draw = () => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context || canvas.width === 0) return
        const scene = sceneRef.current
        drawMug(context, textureRef.current, {
            rotation: motionRef.current.rotation,
            bodyColor: scene.bodyColor,
            print: scene.print,
        })
    }

    /** One step of the motion; keeps the loop going while the mug still turns. */
    const tick = (now: number) => {
        frameRef.current = 0
        const motion = motionRef.current
        const { reducedMotion: still } = sceneRef.current
        const dt = motion.lastFrame ? Math.min(0.05, (now - motion.lastFrame) / 1000) : 0
        motion.lastFrame = now
        let moving = false
        if (!motion.dragging) {
            if (motion.target !== null) {
                const gap = motion.target - motion.rotation
                if (still || Math.abs(gap) < 0.002) {
                    motion.rotation = motion.target
                    motion.target = null
                } else {
                    motion.rotation += gap * (1 - Math.exp(-dt * 10))
                    moving = true
                }
            } else if (motion.velocity !== 0 && !still) {
                motion.rotation += motion.velocity * dt
                motion.velocity *= Math.exp(-dt * FRICTION)
                if (Math.abs(motion.velocity) < MIN_SPEED) motion.velocity = 0
                else moving = true
            } else if (motion.autoRotate && !still) {
                motion.rotation += AUTO_SPEED * dt
                moving = true
            }
        }
        draw()
        if (moving) frameRef.current = requestAnimationFrame(tick)
        else motion.lastFrame = 0
    }

    const requestDraw = () => {
        if (!frameRef.current) frameRef.current = requestAnimationFrame(tick)
    }

    // Keeps the scene current and redraws on a new color, size or motion preference.
    useEffect(() => {
        sceneRef.current = { bodyColor, print: { widthCm, heightCm }, reducedMotion }
        requestDraw()
        // `requestDraw` only touches refs; the deps are what the scene is made of.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bodyColor, widthCm, heightCm, reducedMotion])

    // The print texture: composed right away the first time, then after a short pause.
    const composedRef = useRef(false)
    useEffect(() => {
        const compose = () => {
            const width = TEXTURE_WIDTH
            const height = Math.max(1, Math.round((width * heightCm) / widthCm))
            textureRef.current = composePrintArea(
                layers,
                { width, height },
                textureRef.current ?? undefined,
            )
            requestDraw()
        }
        if (!composedRef.current) {
            composedRef.current = true
            compose()
            return
        }
        const timer = window.setTimeout(compose, TEXTURE_DEBOUNCE_MS)
        return () => window.clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layers, widthCm, heightCm, redrawKey])

    // The canvas follows its box: device pixels up to `MAX_CANVAS_WIDTH`.
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const resize = () => {
            const cssWidth = canvas.getBoundingClientRect().width
            if (cssWidth <= 0) return
            const width = Math.min(
                MAX_CANVAS_WIDTH,
                Math.round(cssWidth * (window.devicePixelRatio || 1)),
            )
            const height = Math.round(width / MUG_SCENE_ASPECT)
            if (canvas.width === width && canvas.height === height) return
            canvas.width = width
            canvas.height = height
            draw()
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        return () => observer.disconnect()
    }, [])

    // Starts the loop (auto-rotation) on mount and stops it on unmount. Clearing the id matters:
    // React's dev double-mount runs this cleanup once, and a stale id would make `requestDraw`
    // believe a frame is pending forever (the mug would freeze, drags included).
    useEffect(() => {
        requestDraw()
        return () => {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = 0
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /** Radians per CSS pixel of drag: the front of the body follows the finger. */
    const radiansPerPixel = () => {
        const canvas = canvasRef.current
        if (!canvas) return 0
        const rect = canvas.getBoundingClientRect()
        const { radius } = mugLayout(rect.width, rect.height)
        return radius > 0 ? 1 / radius : 0
    }

    const stopAuto = () => {
        const motion = motionRef.current
        motion.autoRotate = false
        motion.velocity = 0
    }

    const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
        if (!event.isPrimary) return
        event.currentTarget.setPointerCapture(event.pointerId)
        stopAuto()
        const motion = motionRef.current
        motion.dragging = true
        motion.target = null
        motion.lastX = event.clientX
        motion.lastMove = event.timeStamp
    }

    const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
        const motion = motionRef.current
        if (!motion.dragging || !event.isPrimary) return
        const delta = (event.clientX - motion.lastX) * radiansPerPixel()
        const dt = Math.max(1, event.timeStamp - motion.lastMove) / 1000
        motion.rotation += delta
        // A smoothed speed, so the flick keeps the last moves' pace.
        motion.velocity = motion.velocity * 0.4 + (delta / dt) * 0.6
        motion.lastX = event.clientX
        motion.lastMove = event.timeStamp
        requestDraw()
    }

    const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
        const motion = motionRef.current
        if (!motion.dragging || !event.isPrimary) return
        motion.dragging = false
        // A finger that stopped before lifting does not flick.
        if (reducedMotion || event.timeStamp - motion.lastMove > 80) motion.velocity = 0
        requestDraw()
    }

    const turnBy = (step: number) => {
        stopAuto()
        const motion = motionRef.current
        motion.target = (motion.target ?? motion.rotation) + step
        requestDraw()
    }

    const showFront = () => {
        stopAuto()
        const motion = motionRef.current
        // The "Frente" view nearest by full turns, so it never spins around the long way.
        motion.target =
            Math.round((motion.rotation - MUG_FRONT_ROTATION) / TURN) * TURN + MUG_FRONT_ROTATION
        requestDraw()
    }

    const box: CSSProperties = {
        aspectRatio: String(MUG_SCENE_ASPECT),
        width: `min(100%, calc(var(--stage-max-h, 60dvh) * ${MUG_SCENE_ASPECT}))`,
    }
    const buttonClass =
        'flex h-9 items-center justify-center gap-1 rounded-full bg-white px-3 text-sm font-semibold text-ink shadow-soft transition hover:bg-blush-50 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none'

    return (
        <div className={cn('space-y-2', className)}>
            <canvas
                ref={canvasRef}
                role="img"
                aria-label="Vista 3D de tu taza; arrastra para girarla"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={box}
                className="mx-auto block cursor-grab touch-none select-none active:cursor-grabbing"
            />
            <div className="flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() => turnBy(-BUTTON_STEP)}
                    aria-label="Girar la taza a la izquierda"
                    className={buttonClass}
                >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                <button type="button" onClick={showFront} className={buttonClass}>
                    Frente
                </button>
                <button
                    type="button"
                    onClick={() => turnBy(BUTTON_STEP)}
                    aria-label="Girar la taza a la derecha"
                    className={buttonClass}
                >
                    <ChevronRight aria-hidden="true" className="size-4" />
                </button>
            </div>
        </div>
    )
}
