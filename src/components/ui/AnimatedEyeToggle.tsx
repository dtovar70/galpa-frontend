import { useEffect, useId, useRef, useState, type FocusEvent, type RefObject } from 'react'
import {
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type AnimationPlaybackControls,
    type MotionValue,
} from 'motion/react'

import { cn } from '@/utils/cn'

/*
 * Geometry, in a 24×24 viewBox. Everything hangs off one number, `openness`: 0 is a shut eye
 * (both lids on the same downward curve, lashes hanging), 1 is wide open. Hover/focus parts the
 * lids a little, idle "peeks" and blinks are short keyframe runs of the same value.
 */
const LEFT_X = 2.5
const RIGHT_X = 21.5
const CONTROL_LEFT_X = 7.2
const CONTROL_RIGHT_X = 16.8

const OPEN = 1
const OPEN_CURIOUS = 1.06
const CLOSED = 0
const CLOSED_CURIOUS = 0.4

const IRIS_CENTER = { x: 12, y: 11.9 }
/** How far (viewBox units) the iris may wander from the centre while following the pointer. */
const LOOK_RANGE = { x: 2.3, y: 1.3 }
/** Pointer distance (px) at which the eye looks as far as it can. */
const LOOK_FULL_DISTANCE = 140

const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const round = (value: number) => Math.round(value * 100) / 100

interface Lids {
    cornerY: number
    upperY: number
    lowerY: number
}

function lidsAt(openness: number): Lids {
    const t = Math.min(1.15, Math.max(-0.05, openness))
    return {
        // Shut, the whole eye sits a touch higher so the lashes stay inside the box.
        cornerY: lerp(10.2, 12, t),
        // The upper lid lifts ahead of the lower one, so a half-open eye is round, not a slit.
        upperY: lerp(14, 4.4, t < 1 ? 1 - (1 - t) ** 1.6 : t),
        lowerY: lerp(14, 18.9, t),
    }
}

const curve = (cornerY: number, controlY: number) =>
    `M${LEFT_X} ${round(cornerY)}C${CONTROL_LEFT_X} ${round(controlY)} ${CONTROL_RIGHT_X} ${round(controlY)} ${RIGHT_X} ${round(cornerY)}`

function upperLid(openness: number) {
    const { cornerY, upperY } = lidsAt(openness)
    return curve(cornerY, upperY)
}

function lowerLid(openness: number) {
    const { cornerY, lowerY } = lidsAt(openness)
    return curve(cornerY, lowerY)
}

function eyeShape(openness: number) {
    const { cornerY, upperY, lowerY } = lidsAt(openness)
    const c = round(cornerY)
    const u = round(upperY)
    const l = round(lowerY)
    return `M${LEFT_X} ${c}C${CONTROL_LEFT_X} ${u} ${CONTROL_RIGHT_X} ${u} ${RIGHT_X} ${c}C${CONTROL_RIGHT_X} ${l} ${CONTROL_LEFT_X} ${l} ${LEFT_X} ${c}Z`
}

/** A point on a lid and the unit normal there, pointing down the page. */
function lidPoint(openness: number, lid: 'upper' | 'lower', t: number) {
    const { cornerY, upperY, lowerY } = lidsAt(openness)
    const controlY = lid === 'upper' ? upperY : lowerY
    const u = 1 - t
    // Cubic Bézier from the left corner to the right one, both controls at `upperY`.
    const x =
        u * u * u * LEFT_X +
        3 * u * u * t * CONTROL_LEFT_X +
        3 * u * t * t * CONTROL_RIGHT_X +
        t * t * t * RIGHT_X
    const y = (u * u * u + t * t * t) * cornerY + 3 * u * t * controlY
    const dx =
        3 * u * u * (CONTROL_LEFT_X - LEFT_X) +
        6 * u * t * (CONTROL_RIGHT_X - CONTROL_LEFT_X) +
        3 * t * t * (RIGHT_X - CONTROL_RIGHT_X)
    const dy = 3 * u * u * (controlY - cornerY) + 3 * t * t * (cornerY - controlY)
    const length = Math.hypot(dx, dy) || 1
    // Rotate the tangent a quarter turn so it points down the page.
    return { x, y, nx: -dy / length, ny: dx / length }
}

/**
 * Lashes: shut, they hang from the lid line (the lower lid, so a peek opens above them); open,
 * they flick up from the upper lid.
 */
function lashes(openness: number, lid: 'upper' | 'lower', spots: number[], length: number) {
    const direction = lid === 'lower' ? 1 : -1
    return spots
        .map((t) => {
            const { x, y, nx, ny } = lidPoint(openness, lid, t)
            // Splay the outer lashes a little outwards, like real ones.
            const splay = (t - 0.5) * 0.9
            const dx = (nx * direction + splay) * length
            const dy = ny * direction * length
            return `M${round(x)} ${round(y)}l${round(dx)} ${round(dy)}`
        })
        .join('')
}

const SHUT_LASHES = [0.16, 0.38, 0.62, 0.84]
const OPEN_LASHES = [0.22, 0.5, 0.78]

function randomBetween(min: number, max: number) {
    return min + Math.random() * (max - min)
}

/** True while the browser tab is shown; idle animations stop while it is hidden. */
function usePageVisible() {
    const [isVisible, setIsVisible] = useState(() =>
        typeof document === 'undefined' ? true : document.visibilityState === 'visible',
    )
    useEffect(() => {
        const update = () => setIsVisible(document.visibilityState === 'visible')
        document.addEventListener('visibilitychange', update)
        return () => document.removeEventListener('visibilitychange', update)
    }, [])
    return isVisible
}

type PointerListener = (pointer: { x: number; y: number } | null) => void

/**
 * One pointer feed for every open eye on the page: a single pointermove listener and at most
 * one requestAnimationFrame pending, however many eyes are watching. `null` means the pointer
 * left the page (or the window lost focus). Listeners exist only while an eye subscribes.
 */
const pointerFeed = (() => {
    const listeners = new Set<PointerListener>()
    let pointer: { x: number; y: number } | null = null
    let frame = 0

    const flush = () => {
        frame = 0
        listeners.forEach((listener) => listener(pointer))
    }
    const onMove = (event: PointerEvent) => {
        pointer = { x: event.clientX, y: event.clientY }
        if (!frame) frame = requestAnimationFrame(flush)
    }
    const leave = () => {
        pointer = null
        if (frame) cancelAnimationFrame(frame)
        flush()
    }
    const onOut = (event: PointerEvent) => {
        if (!event.relatedTarget) leave()
    }

    return {
        subscribe(listener: PointerListener) {
            listeners.add(listener)
            if (listeners.size === 1) {
                window.addEventListener('pointermove', onMove, { passive: true })
                window.addEventListener('pointerout', onOut)
                window.addEventListener('blur', leave)
            }
            return () => {
                listeners.delete(listener)
                if (listeners.size) return
                window.removeEventListener('pointermove', onMove)
                window.removeEventListener('pointerout', onOut)
                window.removeEventListener('blur', leave)
                if (frame) cancelAnimationFrame(frame)
                frame = 0
                pointer = null
            }
        },
    }
})()

/** While `active`, turns the iris towards the pointer; it recentres when the pointer leaves. */
function usePointerGaze(
    active: boolean,
    target: RefObject<SVGSVGElement | null>,
    lookX: MotionValue<number>,
    lookY: MotionValue<number>,
) {
    useEffect(() => {
        const recentre = () => {
            lookX.set(0)
            lookY.set(0)
        }
        if (!active) {
            recentre()
            return
        }
        const unsubscribe = pointerFeed.subscribe((pointer) => {
            const svg = target.current
            if (!svg || !pointer) return recentre()
            const box = svg.getBoundingClientRect()
            const dx = pointer.x - (box.left + box.width / 2)
            const dy = pointer.y - (box.top + box.height / 2)
            const distance = Math.hypot(dx, dy)
            if (distance < 1) return recentre()
            const reach = Math.min(1, distance / LOOK_FULL_DISTANCE)
            lookX.set((dx / distance) * reach * LOOK_RANGE.x)
            lookY.set((dy / distance) * reach * LOOK_RANGE.y)
        })
        return () => {
            unsubscribe()
            recentre()
        }
    }, [active, target, lookX, lookY])
}

export interface AnimatedEyeToggleProps {
    /** Whether the password is shown (the eye is open). */
    visible: boolean
    onToggle: () => void
    className?: string
}

/**
 * The show/hide password button: a little eye that sleeps while the password is hidden (with
 * the odd peek), parts its lids when hovered or focused, springs open to show the password and
 * follows the pointer while open. With reduced motion it is a plain open/closed swap.
 *
 * It never takes focus on a mouse press, so the caret stays in the password input.
 */
export function AnimatedEyeToggle({ visible, onToggle, className }: AnimatedEyeToggleProps) {
    const clipId = `eye-clip-${useId().replace(/[^\w-]/g, '')}`
    const svgRef = useRef<SVGSVGElement>(null)
    const prefersReducedMotion = useReducedMotion() ?? false
    const pageVisible = usePageVisible()
    const [isHovered, setIsHovered] = useState(false)
    const [isFocusVisible, setIsFocusVisible] = useState(false)
    const isCurious = !prefersReducedMotion && (isHovered || isFocusVisible)

    const openness = useMotionValue(visible ? OPEN : CLOSED)
    const irisScale = useMotionValue(1)
    const lookX = useMotionValue(0)
    const lookY = useMotionValue(0)
    const irisX = useSpring(lookX, { stiffness: 320, damping: 26, mass: 0.6 })
    const irisY = useSpring(lookY, { stiffness: 320, damping: 26, mass: 0.6 })

    const upperD = useTransform(openness, upperLid)
    const lowerD = useTransform(openness, lowerLid)
    const shapeD = useTransform(openness, eyeShape)
    const shutLashesD = useTransform(openness, (o) => lashes(o, 'lower', SHUT_LASHES, 2.5))
    const shutLashesOpacity = useTransform(openness, (o) => clamp01((0.75 - o) / 0.35))
    const openLashesD = useTransform(openness, (o) => lashes(o, 'upper', OPEN_LASHES, 1.9))
    const openLashesOpacity = useTransform(openness, (o) => clamp01((o - 0.7) / 0.3))

    const rest = visible ? (isCurious ? OPEN_CURIOUS : OPEN) : isCurious ? CLOSED_CURIOUS : CLOSED

    // Open/close and hover: settle the lids on their resting value.
    const wasVisible = useRef(visible)
    useEffect(() => {
        const opening = visible && !wasVisible.current
        const closing = !visible && wasVisible.current
        wasVisible.current = visible
        if (prefersReducedMotion) {
            openness.set(visible ? OPEN : CLOSED)
            irisScale.set(1)
            return
        }
        const controls: AnimationPlaybackControls[] = []
        if (opening) {
            // Springy lids, and the iris pops in with a little overshoot.
            controls.push(animate(openness, rest, { type: 'spring', stiffness: 420, damping: 15 }))
            irisScale.set(0.45)
            controls.push(
                animate(irisScale, 1, { type: 'spring', stiffness: 520, damping: 11, delay: 0.04 }),
            )
        } else if (closing) {
            // A quick blink shut.
            controls.push(animate(openness, rest, { duration: 0.13, ease: [0.55, 0, 1, 0.45] }))
        } else {
            controls.push(animate(openness, rest, { type: 'spring', stiffness: 380, damping: 24 }))
            // A hover change right after opening cut the iris pop short: let it finish.
            if (irisScale.get() !== 1) {
                controls.push(
                    animate(irisScale, 1, { type: 'spring', stiffness: 520, damping: 14 }),
                )
            }
        }
        return () => controls.forEach((control) => control.stop())
    }, [visible, rest, prefersReducedMotion, openness, irisScale])

    // Idle life: shut, it peeks or flutters now and then; open, it blinks. Only while the tab
    // is shown, and never while the user is hovering it (that has its own pose).
    useEffect(() => {
        if (prefersReducedMotion || !pageVisible || isCurious) return
        let timer = 0
        let running: AnimationPlaybackControls | null = null
        const schedule = (first: boolean) => {
            const wait = visible
                ? randomBetween(first ? 2200 : 3200, 6500)
                : randomBetween(first ? 1800 : 3000, 5600)
            timer = window.setTimeout(play, wait)
        }
        const play = () => {
            if (visible) {
                running = animate(openness, [OPEN, 0.04, OPEN], {
                    duration: 0.26,
                    times: [0, 0.4, 1],
                    ease: ['easeIn', 'easeOut'],
                })
            } else if (Math.random() < 0.6) {
                // A sleepy peek: the lids crack open, hold, and close again.
                running = animate(openness, [CLOSED, 0.36, 0.3, CLOSED], {
                    duration: 1.3,
                    times: [0, 0.28, 0.72, 1],
                    ease: ['easeOut', 'linear', 'easeIn'],
                })
            } else {
                // A flutter: two quick twitches of the lids.
                running = animate(openness, [CLOSED, 0.18, CLOSED, 0.14, CLOSED], {
                    duration: 0.62,
                    ease: 'easeInOut',
                })
            }
            schedule(false)
        }
        schedule(true)
        return () => {
            window.clearTimeout(timer)
            running?.stop()
        }
    }, [visible, isCurious, pageVisible, prefersReducedMotion, openness])

    usePointerGaze(visible && !prefersReducedMotion && pageVisible, svgRef, lookX, lookY)

    const onFocus = (event: FocusEvent<HTMLButtonElement>) =>
        setIsFocusVisible(event.currentTarget.matches(':focus-visible'))

    return (
        <button
            type="button"
            onClick={onToggle}
            // Keep focus (and the caret) in the input when the eye is clicked.
            onMouseDown={(event) => event.preventDefault()}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onFocus={onFocus}
            onBlur={() => setIsFocusVisible(false)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            className={cn(
                'flex size-8 items-center justify-center rounded-full text-ink transition-colors outline-none hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-400',
                className,
            )}
        >
            <svg
                ref={svgRef}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="size-[22px] overflow-visible"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <defs>
                    <clipPath id={clipId}>
                        <motion.path d={shapeD} />
                    </clipPath>
                </defs>
                <motion.path d={shapeD} fill="white" stroke="none" />
                <g clipPath={`url(#${clipId})`} stroke="none">
                    <motion.g
                        style={{
                            x: irisX,
                            y: irisY,
                            scale: irisScale,
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                        }}
                    >
                        <circle
                            cx={IRIS_CENTER.x}
                            cy={IRIS_CENTER.y}
                            r={4.3}
                            fill="var(--color-brand-400)"
                        />
                        <circle
                            cx={IRIS_CENTER.x}
                            cy={IRIS_CENTER.y}
                            r={4.3}
                            fill="none"
                            stroke="var(--color-brand-600)"
                            strokeWidth={0.7}
                        />
                        <circle
                            cx={IRIS_CENTER.x}
                            cy={IRIS_CENTER.y}
                            r={2}
                            fill="var(--color-ink)"
                        />
                        <circle
                            cx={IRIS_CENTER.x - 1.35}
                            cy={IRIS_CENTER.y - 1.45}
                            r={0.95}
                            fill="white"
                        />
                    </motion.g>
                </g>
                <motion.path d={lowerD} strokeWidth={1.7} />
                <motion.path d={upperD} strokeWidth={1.9} />
                <motion.path
                    d={shutLashesD}
                    strokeWidth={1.5}
                    style={{ opacity: shutLashesOpacity }}
                />
                <motion.path
                    d={openLashesD}
                    strokeWidth={1.4}
                    style={{ opacity: openLashesOpacity }}
                />
            </svg>
        </button>
    )
}
