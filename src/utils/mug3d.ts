import { mixHex, toColorInputValue } from '@/utils/color'

/**
 * A procedural 3D mug drawn with Canvas 2D (no WebGL, no 3D library): the "Ver en 3D" preview
 * of a mug design. The print area (a flat transparent canvas, see `composePrintArea`) is wrapped
 * around the body as thin vertical slices.
 *
 * Model: a vertical cylinder of radius `R` and height `H`, seen from the front by an
 * orthographic camera slightly above the rim. A point of the body is named by its angle `α`
 * around the axis, measured from the center of the print (the front, `α = 0`); the handle sits
 * opposite, at `α = π`. Turning the mug by `rotation` shows it at the screen angle
 * `θ = α + rotation`, where `θ = 0` faces the viewer and only `θ ∈ [-π/2, π/2]` is visible.
 *
 * Projection: the point at screen angle `θ` and height `y` (from the rim) lands on
 *     x = cx + R·sin θ                 (orthographic: the visible half spans 2R)
 *     y = top + y + Ry·cos θ           (the camera's tilt: nearer points look lower)
 * where `Ry = R·TILT` is the vertical radius of the rim's ellipse. Inverting the first line,
 * the screen column `x` shows the angle `θ = asin((x − cx) / R)`, i.e. the body point
 * `α = θ − rotation`, i.e. the print column
 *     u = 0.5 + α / span               (u ∈ [0, 1] across the print; outside it, bare body)
 * where `span = printWidth / R` is the angle the print covers (20 cm on an 8.2 cm mug:
 * 20 / 4.1 ≈ 4.88 rad ≈ 280°, about 78 % of the turn, centered on the front). A column `dx`
 * pixels wide therefore takes `du = dx / (R·cos θ·span)` of the print: wide slices of the print
 * get squeezed into narrow columns near the silhouette, which is what makes it look round.
 *
 * Lighting does not depend on the rotation (the light is fixed relative to the camera), so the
 * shading is a single horizontal gradient over the body (dark edges, a specular band) instead of
 * a per-column computation.
 */

/** An 11 oz sublimation mug, in cm. */
export const MUG = { diameterCm: 8.2, heightCm: 9.5 } as const

const RADIUS_CM = MUG.diameterCm / 2
/** How far the handle sticks out of the body, and its thickness (cm). */
const HANDLE_REACH_CM = 2.9
const HANDLE_THICKNESS_CM = 0.85
/** Where the handle meets the body, as fractions of the height from the rim. */
const HANDLE_TOP = 0.18
const HANDLE_BOTTOM = 0.8
/** Vertical radius of the rim ellipse ÷ radius: how much the camera looks down on the mug. */
const TILT = 0.2
/** Wall thickness at the rim (cm): the lip around the opening. */
const RIM_CM = 0.28
/** Room under the body for the ground shadow (cm). */
const SHADOW_ROOM_CM = 0.9
const MARGIN_CM = 0.4

/** The handle may stick out on either side, so the scene is as wide as both. */
const SCENE_WIDTH_CM = 2 * (RADIUS_CM + HANDLE_REACH_CM + HANDLE_THICKNESS_CM / 2 + MARGIN_CM)
const SCENE_HEIGHT_CM = MUG.heightCm + 2 * RADIUS_CM * TILT + SHADOW_ROOM_CM + 2 * MARGIN_CM

/** Width ÷ height of the canvas the mug is drawn on. */
export const MUG_SCENE_ASPECT = SCENE_WIDTH_CM / SCENE_HEIGHT_CM

/**
 * The "Frente" view: the mug turned about 35° so the handle shows on the right (at a straight
 * front view it hides behind the body and the mug looks like a can), with the design's center
 * a little left of the middle, still mostly in view. The handle's screen angle is `π + rotation`,
 * on the right while `sin(π + rotation) > 0`, i.e. for a negative rotation.
 */
export const MUG_FRONT_ROTATION = -(35 * Math.PI) / 180

export interface MugOptions {
    /** Radians; 0 shows the front (the print's center), π the handle. Positive turns right. */
    rotation: number
    /** The mug's color (`#RRGGBB`); anything else draws a white mug. */
    bodyColor: string
    /** Physical size of the print area (the print is centered vertically on the body). */
    print: { widthCm: number; heightCm: number }
}

/** Where the mug sits on a canvas of `width × height` pixels. */
export interface MugLayout {
    /** Pixels per cm. */
    unit: number
    /** Axis of the body. */
    cx: number
    /** Center of the rim's ellipse, and of the bottom's. */
    top: number
    bottom: number
    /** Radius, and vertical radius of the rim/bottom ellipses. */
    radius: number
    radiusY: number
}

export function mugLayout(width: number, height: number): MugLayout {
    const unit = Math.min(width / SCENE_WIDTH_CM, height / SCENE_HEIGHT_CM)
    const radius = RADIUS_CM * unit
    const radiusY = radius * TILT
    const bodyHeight = MUG.heightCm * unit
    const sceneHeight = bodyHeight + 2 * radiusY + SHADOW_ROOM_CM * unit
    // Whole pixels for the axis: the texture columns then fall on whole pixels (no seams).
    const cx = Math.round(width / 2)
    const top = (height - sceneHeight) / 2 + radiusY
    return { unit, cx, top, bottom: top + bodyHeight, radius, radiusY }
}

/** Angle in (−π, π]. */
function wrapAngle(angle: number): number {
    const turn = 2 * Math.PI
    const wrapped = (((angle + Math.PI) % turn) + turn) % turn
    return wrapped - Math.PI
}

/**
 * Draws the whole scene (shadow, handle, body with the print, rim) on `context`'s canvas.
 * Pure: everything comes from the arguments. `texture` is the print area (transparent where
 * there is no design), or null for a bare mug.
 */
export function drawMug(
    context: CanvasRenderingContext2D,
    texture: HTMLCanvasElement | null,
    options: MugOptions,
): void {
    const { width, height } = context.canvas
    context.clearRect(0, 0, width, height)
    const layout = mugLayout(width, height)
    const color = toColorInputValue(options.bodyColor)
    // The handle's screen angle: on the far side (cos < 0) the body hides it, so it goes first.
    const handleAngle = Math.PI + options.rotation
    const handleInFront = Math.cos(handleAngle) >= 0

    drawShadow(context, layout)
    if (!handleInFront) drawHandle(context, layout, handleAngle, color)
    drawBody(context, layout, texture, options, color)
    drawRim(context, layout, color)
    if (handleInFront) drawHandle(context, layout, handleAngle, color)
}

function drawShadow(context: CanvasRenderingContext2D, layout: MugLayout): void {
    const { cx, bottom, radius, radiusY } = layout
    context.save()
    context.translate(cx, bottom + radiusY * 0.45)
    // A radial gradient squashed into an ellipse on the ground.
    context.scale(1, (radiusY * 1.6) / radius)
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius * 1.3)
    gradient.addColorStop(0, 'rgba(45, 25, 35, 0.26)')
    gradient.addColorStop(0.55, 'rgba(45, 25, 35, 0.12)')
    gradient.addColorStop(1, 'rgba(45, 25, 35, 0)')
    context.fillStyle = gradient
    context.fillRect(-radius * 1.3, -radius * 1.3, radius * 2.6, radius * 2.6)
    context.restore()
}

/** The silhouette: both sides, the front half of the bottom and the front half of the rim. */
function bodyPath(context: CanvasRenderingContext2D, layout: MugLayout): void {
    const { cx, top, bottom, radius, radiusY } = layout
    context.beginPath()
    context.moveTo(cx - radius, top)
    context.lineTo(cx - radius, bottom)
    // Canvas angles grow clockwise on screen; the lower (nearer) half is [0, π].
    context.ellipse(cx, bottom, radius, radiusY, 0, Math.PI, 0, true)
    context.lineTo(cx + radius, top)
    context.ellipse(cx, top, radius, radiusY, 0, 0, Math.PI, false)
    context.closePath()
}

function drawBody(
    context: CanvasRenderingContext2D,
    layout: MugLayout,
    texture: HTMLCanvasElement | null,
    options: MugOptions,
    color: string,
): void {
    const { cx, top, bottom, radius, radiusY, unit } = layout
    context.save()
    bodyPath(context, layout)
    context.fillStyle = color
    context.fill()
    context.clip()

    if (texture && texture.width > 0 && texture.height > 0) {
        drawWrappedTexture(context, layout, texture, options)
    }

    // Shading, fixed to the camera: darker towards the silhouette (the surface turns away from
    // the light), a specular band on the left where the light is, a soft one on the right.
    const left = cx - radius
    const shade = context.createLinearGradient(left, 0, cx + radius, 0)
    shade.addColorStop(0, 'rgba(20, 10, 15, 0.45)')
    shade.addColorStop(0.12, 'rgba(20, 10, 15, 0.2)')
    shade.addColorStop(0.32, 'rgba(20, 10, 15, 0.03)')
    shade.addColorStop(0.55, 'rgba(20, 10, 15, 0)')
    shade.addColorStop(0.8, 'rgba(20, 10, 15, 0.12)')
    shade.addColorStop(1, 'rgba(20, 10, 15, 0.5)')
    context.fillStyle = shade
    context.fillRect(left, top - radiusY, radius * 2, bottom - top + 2 * radiusY)

    const shine = context.createLinearGradient(left, 0, cx + radius, 0)
    shine.addColorStop(0.2, 'rgba(255, 255, 255, 0)')
    shine.addColorStop(0.28, 'rgba(255, 255, 255, 0.5)')
    shine.addColorStop(0.36, 'rgba(255, 255, 255, 0)')
    shine.addColorStop(0.82, 'rgba(255, 255, 255, 0)')
    shine.addColorStop(0.87, 'rgba(255, 255, 255, 0.14)')
    shine.addColorStop(0.92, 'rgba(255, 255, 255, 0)')
    context.fillStyle = shine
    context.fillRect(left, top - radiusY, radius * 2, bottom - top + 2 * radiusY)

    // A little darker towards the base (the ground's bounce light is weaker than the sky's).
    const base = context.createLinearGradient(0, bottom - 1.2 * unit, 0, bottom + radiusY)
    base.addColorStop(0, 'rgba(20, 10, 15, 0)')
    base.addColorStop(1, 'rgba(20, 10, 15, 0.16)')
    context.fillStyle = base
    context.fillRect(left, bottom - 1.2 * unit, radius * 2, 1.2 * unit + radiusY)
    context.restore()

    // A hairline along the silhouette keeps a white mug readable on a light background.
    context.save()
    bodyPath(context, layout)
    context.strokeStyle = 'rgba(20, 10, 15, 0.14)'
    context.lineWidth = Math.max(1, unit * 0.03)
    context.stroke()
    context.restore()
}

/**
 * The print wrapped around the visible half: one `drawImage` per screen column (1–2 px), from
 * the print column under it (see the projection at the top of this file).
 */
function drawWrappedTexture(
    context: CanvasRenderingContext2D,
    layout: MugLayout,
    texture: HTMLCanvasElement,
    options: MugOptions,
): void {
    const { cx, top, radius, radiusY, unit } = layout
    const span = Math.min(2 * Math.PI, options.print.widthCm / RADIUS_CM)
    const printHeight = Math.min(options.print.heightCm, MUG.heightCm) * unit
    // Centered vertically on the body (8.5 cm on 9.5 cm: half a centimeter above and below).
    const printTop = top + (MUG.heightCm * unit - printHeight) / 2
    // A few hundred columns (the canvas is capped at ~900 px wide): plenty for a smooth curve,
    // cheap enough for 60 fps on a phone. Whole-pixel columns need no overlap, so semi-
    // transparent parts of the print never show seams.
    const step = radius > 300 ? 2 : 1
    const textureWidth = texture.width
    const textureHeight = texture.height
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'medium'

    for (let x0 = -Math.floor(radius); x0 < radius; x0 += step) {
        const x1 = Math.min(radius, x0 + step)
        const theta0 = Math.asin(Math.max(-1, x0 / radius))
        const theta1 = Math.asin(Math.min(1, x1 / radius))
        // The body angle at the column's left edge; the right edge continues from it (no
        // re-wrap, so a column never jumps across the back seam).
        const alpha0 = wrapAngle(theta0 - options.rotation)
        const alpha1 = alpha0 + (theta1 - theta0)
        let u0 = 0.5 + alpha0 / span
        let u1 = 0.5 + alpha1 / span
        if (u1 <= 0 || u0 >= 1 || u1 <= u0) continue
        // A column across the print's edge: keep the part inside (linear within one column).
        let left = x0
        let right = x1
        if (u0 < 0) {
            left += ((right - left) * -u0) / (u1 - u0)
            u0 = 0
        }
        if (u1 > 1) {
            right -= ((right - left) * (u1 - 1)) / (u1 - u0)
            u1 = 1
        }
        const sourceX = u0 * textureWidth
        const sourceWidth = Math.max(0.01, (u1 - u0) * textureWidth)
        // The tilt: the column's middle angle sets how far down it is.
        const dy = printTop + radiusY * Math.cos((theta0 + theta1) / 2)
        context.drawImage(
            texture,
            Math.min(sourceX, textureWidth - sourceWidth),
            0,
            sourceWidth,
            textureHeight,
            cx + left,
            dy,
            right - left,
            printHeight,
        )
    }
}

/** The opening: the lip, and the inside wall in shadow. */
function drawRim(context: CanvasRenderingContext2D, layout: MugLayout, color: string): void {
    const { cx, top, radius, radiusY, unit } = layout
    context.save()
    context.beginPath()
    context.ellipse(cx, top, radius, radiusY, 0, 0, 2 * Math.PI)
    context.fillStyle = mixHex(color, '#FFFFFF', 0.25)
    context.fill()
    context.strokeStyle = 'rgba(20, 10, 15, 0.16)'
    context.lineWidth = Math.max(1, unit * 0.03)
    context.stroke()

    const inner = 1 - RIM_CM / RADIUS_CM
    context.beginPath()
    context.ellipse(cx, top, radius * inner, radiusY * inner, 0, 0, 2 * Math.PI)
    // The far inside wall faces the light, the near one is in its own shadow.
    const wall = context.createLinearGradient(0, top - radiusY, 0, top + radiusY)
    wall.addColorStop(0, mixHex(color, '#1A0F14', 0.12))
    wall.addColorStop(1, mixHex(color, '#1A0F14', 0.42))
    context.fillStyle = wall
    context.fill()
    context.restore()
}

/** Sample points of the handle's C, in (distance from the axis, height from the rim) cm. */
const HANDLE_CURVE: readonly (readonly [number, number])[] = (() => {
    // A cubic Bézier from the upper joint to the lower one, bulging out; at t = 0.5 it reaches
    // R + 0.75·k·reach, so k = 4/3 makes the farthest point exactly `HANDLE_REACH_CM` out.
    const start = [RADIUS_CM - 0.15, HANDLE_TOP * MUG.heightCm] as const
    const end = [RADIUS_CM - 0.15, HANDLE_BOTTOM * MUG.heightCm] as const
    const out = RADIUS_CM + (4 / 3) * HANDLE_REACH_CM
    const c1 = [out, start[1] - 0.6] as const
    const c2 = [out, end[1] + 0.3] as const
    const points: [number, number][] = []
    const samples = 28
    for (let index = 0; index <= samples; index += 1) {
        const t = index / samples
        const a = (1 - t) ** 3
        const b = 3 * (1 - t) ** 2 * t
        const c = 3 * (1 - t) * t ** 2
        const d = t ** 3
        points.push([
            a * start[0] + b * c1[0] + c * c2[0] + d * end[0],
            a * start[1] + b * c1[1] + c * c2[1] + d * end[1],
        ])
    }
    return points
})()

/**
 * The handle lies in the vertical plane through the axis at the screen angle `angle`: its
 * point at distance `ρ` from the axis and height `y` projects (like the body) to
 * `x = cx + ρ·sin(angle)`, `y = top + y + Ry·(ρ / R)·cos(angle)`. Seen from the side it is a
 * full C; turned towards (or away from) the camera it narrows to a bar.
 */
function drawHandle(
    context: CanvasRenderingContext2D,
    layout: MugLayout,
    angle: number,
    color: string,
): void {
    const { cx, top, unit, radiusY } = layout
    const sin = Math.sin(angle)
    const cos = Math.cos(angle)
    const behind = cos < 0
    context.save()
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    HANDLE_CURVE.forEach(([rho, y], index) => {
        const x = cx + rho * unit * sin
        const screenY = top + y * unit + radiusY * (rho / RADIUS_CM) * cos
        if (index === 0) context.moveTo(x, screenY)
        else context.lineTo(x, screenY)
    })
    const thickness = HANDLE_THICKNESS_CM * unit
    // Outline in shadow, the body color inside, and a thin highlight towards the light.
    context.strokeStyle = mixHex(color, '#1A0F14', behind ? 0.42 : 0.3)
    context.lineWidth = thickness
    context.stroke()
    context.strokeStyle = behind ? mixHex(color, '#1A0F14', 0.18) : color
    context.lineWidth = thickness * 0.68
    context.stroke()
    context.translate(-thickness * 0.14, -thickness * 0.08)
    context.strokeStyle = behind ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.4)'
    context.lineWidth = thickness * 0.2
    context.stroke()
    context.restore()
}
