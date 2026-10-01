import type { DesignPrintArea } from '@/@types/product'

/** Smallest side of the print area, relative to the photo (the API refuses less). */
export const PRINT_AREA_MIN = 0.05
/** Beyond this difference between the area's and the print's proportion, the admin is warned. */
export const ASPECT_TOLERANCE = 0.12

export type AreaCorner = 'nw' | 'ne' | 'sw' | 'se'

interface PhotoSize {
    width: number
    height: number
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

/** Four decimals, like the API stores it. */
export function roundArea(area: DesignPrintArea): DesignPrintArea {
    const round = (value: number) => Math.round(value * 10_000) / 10_000
    const x = round(area.x)
    const y = round(area.y)
    return {
        x,
        y,
        width: Math.min(round(area.width), round(1 - x)),
        height: Math.min(round(area.height), round(1 - y)),
    }
}

/** Moves the area by (dx, dy), stopping at the photo's edges. */
export function moveArea(area: DesignPrintArea, dx: number, dy: number): DesignPrintArea {
    return {
        ...area,
        x: clamp(area.x + dx, 0, 1 - area.width),
        y: clamp(area.y + dy, 0, 1 - area.height),
    }
}

/** Drags one corner by (dx, dy); the opposite corner stays put. */
export function resizeArea(
    area: DesignPrintArea,
    corner: AreaCorner,
    dx: number,
    dy: number,
): DesignPrintArea {
    let left = area.x
    let top = area.y
    let right = area.x + area.width
    let bottom = area.y + area.height
    if (corner === 'nw' || corner === 'sw') left = clamp(left + dx, 0, right - PRINT_AREA_MIN)
    else right = clamp(right + dx, left + PRINT_AREA_MIN, 1)
    if (corner === 'nw' || corner === 'ne') top = clamp(top + dy, 0, bottom - PRINT_AREA_MIN)
    else bottom = clamp(bottom + dy, top + PRINT_AREA_MIN, 1)
    return { x: left, y: top, width: right - left, height: bottom - top }
}

/** Grows or shrinks the area by (dw, dh) from its top-left corner (keyboard resizing). */
export function growArea(area: DesignPrintArea, dw: number, dh: number): DesignPrintArea {
    return resizeArea(area, 'se', dw, dh)
}

/** Height ÷ width of the area on the photo, in pixels. */
export function areaAspect(area: DesignPrintArea, photo: PhotoSize): number {
    return (area.height * photo.height) / (area.width * photo.width)
}

/** True when the area's shape differs noticeably from the print's (height ÷ width in cm). */
export function aspectDiffers(area: DesignPrintArea, photo: PhotoSize, printAspect: number) {
    const ratio = areaAspect(area, photo) / printAspect
    return Math.abs(Math.log(ratio)) > Math.log(1 + ASPECT_TOLERANCE)
}

/**
 * "Ajustar proporción": the area reshaped to the print's proportion around its center, keeping
 * its width unless that would not fit on the photo.
 */
export function fitAreaToAspect(
    area: DesignPrintArea,
    photo: PhotoSize,
    printAspect: number,
): DesignPrintArea {
    const toHeight = (width: number) => (width * photo.width * printAspect) / photo.height
    let width = area.width
    let height = toHeight(width)
    if (height > 1) {
        height = 1
        width = photo.height / (photo.width * printAspect)
    }
    if (height < PRINT_AREA_MIN) {
        height = PRINT_AREA_MIN
        width = Math.min(1, (PRINT_AREA_MIN * photo.height) / (photo.width * printAspect))
    }
    const centerX = area.x + area.width / 2
    const centerY = area.y + area.height / 2
    return roundArea({
        width,
        height,
        x: clamp(centerX - width / 2, 0, 1 - width),
        y: clamp(centerY - height / 2, 0, 1 - height),
    })
}
