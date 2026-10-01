import type { CSSProperties } from 'react'

import type { DesignPlacement, DpiLevel } from '@/@types/design'
import {
    ILLUSTRATION_VIEW,
    LOW_DPI,
    MIN_DPI,
    type ArtworkRect,
    type DesignTemplate,
} from '@/constants/design.constant'

const CM_PER_INCH = 2.54
export const MIN_SCALE = 0.05
export const MAX_SCALE = 8
/** Offsets beyond this would put the image far from the product. */
const MAX_OFFSET = 1.5

export const CENTERED: DesignPlacement = { x: 0, y: 0, scale: 1, rotation: 0 }

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

/** Keeps a placement inside sensible bounds (and the angle in -180…180). */
export function normalizePlacement(placement: DesignPlacement): DesignPlacement {
    let rotation = placement.rotation % 360
    if (rotation > 180) rotation -= 360
    if (rotation <= -180) rotation += 360
    return {
        x: clamp(placement.x, -MAX_OFFSET, MAX_OFFSET),
        y: clamp(placement.y, -MAX_OFFSET, MAX_OFFSET),
        scale: clamp(placement.scale, MIN_SCALE, MAX_SCALE),
        rotation: Math.round(rotation * 10) / 10,
    }
}

interface Frame {
    /** Image height ÷ width. */
    ratio: number
    /** Area height ÷ width. */
    areaAspect: number
    cos: number
    sin: number
}

function frame(imageRatio: number, area: ArtworkRect, rotation: number): Frame {
    const radians = (rotation * Math.PI) / 180
    return {
        ratio: imageRatio,
        areaAspect: area.height / area.width,
        cos: Math.abs(Math.cos(radians)),
        sin: Math.abs(Math.sin(radians)),
    }
}

/**
 * "Ajustar al área": the largest scale at which the whole (rotated) image fits inside the area,
 * centered. Sizes are in area widths: the image is `scale` wide and `scale × ratio` tall.
 */
export function fitPlacement(
    imageRatio: number,
    area: ArtworkRect,
    rotation: number,
): DesignPlacement {
    const { ratio, areaAspect, cos, sin } = frame(imageRatio, area, rotation)
    const scale = Math.min(1 / (cos + ratio * sin), areaAspect / (sin + ratio * cos))
    return normalizePlacement({ x: 0, y: 0, scale, rotation })
}

/** "Llenar el área": the smallest scale at which the (rotated) image covers the whole area. */
export function fillPlacement(
    imageRatio: number,
    area: ArtworkRect,
    rotation: number,
): DesignPlacement {
    const { ratio, areaAspect, cos, sin } = frame(imageRatio, area, rotation)
    // The area, seen from the image's own axes, must fit inside the image.
    const scale = Math.max(cos + areaAspect * sin, (sin + areaAspect * cos) / ratio)
    return normalizePlacement({ x: 0, y: 0, scale, rotation })
}

/** Effective print resolution: the image's pixels over the width it covers on the product. */
export function effectiveDpi(
    pixelWidth: number,
    placement: DesignPlacement,
    template: DesignTemplate,
): number {
    const inches = (placement.scale * template.widthCm) / CM_PER_INCH
    return inches > 0 ? Math.round(pixelWidth / inches) : 0
}

export function dpiLevelOf(dpi: number): DpiLevel {
    if (dpi < MIN_DPI) return 'veryLow'
    if (dpi < LOW_DPI) return 'low'
    return 'ok'
}

/**
 * CSS for a layer inside the area box (percentages of the area). `width` is the layer's width
 * in area widths: the placement's scale for an image, the measured box for a text.
 */
export function layerStyle(placement: DesignPlacement, width = placement.scale): CSSProperties {
    return {
        left: `${50 + placement.x * 100}%`,
        top: `${50 + placement.y * 100}%`,
        width: `${width * 100}%`,
        maxWidth: 'none',
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
    }
}

/** A layer's box on the area: its placement, width (area widths) and height ÷ width. */
export interface LayerBox {
    placement: DesignPlacement
    width: number
    ratio: number
}

/**
 * Whether a point (pixels, relative to the area's top-left corner) falls on the layer's
 * (rotated) box, for an area `areaWidth` × `areaHeight` pixels.
 */
export function layerContains(
    box: LayerBox,
    point: { x: number; y: number },
    areaWidth: number,
    areaHeight: number,
): boolean {
    const centerX = areaWidth / 2 + box.placement.x * areaWidth
    const centerY = areaHeight / 2 + box.placement.y * areaHeight
    const width = box.width * areaWidth
    const height = width * box.ratio
    const radians = (-box.placement.rotation * Math.PI) / 180
    const dx = point.x - centerX
    const dy = point.y - centerY
    const localX = dx * Math.cos(radians) - dy * Math.sin(radians)
    const localY = dx * Math.sin(radians) + dy * Math.cos(radians)
    // A little slack so thin texts stay easy to tap.
    const slack = Math.min(12, areaWidth * 0.02)
    return Math.abs(localX) <= width / 2 + slack && Math.abs(localY) <= height / 2 + slack
}

/** The area as percentages of the view box (240 × 200 for the illustration, else the photo). */
export function areaStyle(
    area: ArtworkRect,
    view: { width: number; height: number } = ILLUSTRATION_VIEW,
): CSSProperties {
    return {
        left: `${(area.x / view.width) * 100}%`,
        top: `${(area.y / view.height) * 100}%`,
        width: `${(area.width / view.width) * 100}%`,
        height: `${(area.height / view.height) * 100}%`,
    }
}
