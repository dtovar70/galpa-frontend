import type { DesignFontId, DesignTextStyle } from '@/@types/design'
import {
    DESIGN_FONTS_STYLESHEET,
    MAX_TEXT_LENGTH,
    MAX_TEXT_LINES,
    designFont,
} from '@/constants/design.constant'

/**
 * Text layers, drawn the same way everywhere: on the stage (a canvas per layer), in the mockup
 * preview and in the arte final. Everything is measured in multiples of the font size, so a
 * layer keeps its shape at any resolution.
 */

/** Font size of a text layer at scale 1, as a fraction of the print area width (as the API). */
export const TEXT_FONT_RATIO = 0.2
const LINE_HEIGHT = 1.2
/** Room around the glyphs (script fonts overhang their advance width). */
const PADDING = 0.18
const OUTLINE_WIDTH = 0.14
/** Font size the layer box is measured at (the shape does not depend on it). */
const MEASURE_PX = 100

const OUTLINE_COLOR = { white: '#FFFFFF', black: '#000000' } as const

/** `ctx.font` for a design font at `px`. */
export function textFont(id: DesignFontId, px: number): string {
    const font = designFont(id)
    return `${font.weight} ${px}px "${font.family}", ${font.fallback}`
}

/** The layer's lines (trimmed, empty outer lines dropped). */
export function textLines(content: string): string[] {
    const lines = content
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.trim())
    while (lines.length > 1 && lines.at(-1) === '') lines.pop()
    while (lines.length > 1 && lines[0] === '') lines.shift()
    return lines
}

/** Spanish reason the text cannot be saved; null when it is fine. */
export function textProblem(content: string): string | null {
    const lines = textLines(content)
    const text = lines.join('\n')
    if (!text.trim()) return 'Escribe tu texto.'
    if (lines.length > MAX_TEXT_LINES) return `Usa ${MAX_TEXT_LINES} líneas como máximo.`
    if ([...text].length > MAX_TEXT_LENGTH) return `Usa ${MAX_TEXT_LENGTH} caracteres como máximo.`
    return null
}

/** The text as it is saved: trimmed lines. */
export function normalizedText(content: string): string {
    return textLines(content).join('\n')
}

export interface TextBlock {
    lines: string[]
    fontPx: number
    /** Box size in pixels (padding included). */
    width: number
    height: number
}

let measureContext: CanvasRenderingContext2D | null = null

function measurer(): CanvasRenderingContext2D | null {
    if (!measureContext) measureContext = document.createElement('canvas').getContext('2d')
    return measureContext
}

/** Lays the text out at `fontPx`: its lines and the size of its box. */
export function layoutText(
    context: CanvasRenderingContext2D,
    style: DesignTextStyle,
    fontPx: number,
): TextBlock {
    const lines = textLines(style.content)
    context.font = textFont(style.font, fontPx)
    const widest = Math.max(1, ...lines.map((line) => context.measureText(line).width))
    const padding = fontPx * (PADDING + (style.outline === 'none' ? 0 : OUTLINE_WIDTH / 2))
    return {
        lines,
        fontPx,
        width: widest + padding * 2,
        height: lines.length * fontPx * LINE_HEIGHT + padding * 2,
    }
}

/** Draws a laid-out block with its top-left corner at (0, 0) of the current transform. */
export function drawTextBlock(
    context: CanvasRenderingContext2D,
    style: DesignTextStyle,
    block: TextBlock,
): void {
    const { fontPx, lines, width } = block
    const padding = (block.height - lines.length * fontPx * LINE_HEIGHT) / 2
    context.save()
    context.font = textFont(style.font, fontPx)
    context.textAlign = style.align
    context.textBaseline = 'middle'
    context.lineJoin = 'round'
    context.miterLimit = 2
    const x =
        style.align === 'left' ? padding : style.align === 'right' ? width - padding : width / 2
    lines.forEach((line, index) => {
        const y = padding + fontPx * LINE_HEIGHT * (index + 0.5)
        if (style.outline !== 'none') {
            context.strokeStyle = OUTLINE_COLOR[style.outline]
            context.lineWidth = fontPx * OUTLINE_WIDTH
            context.strokeText(line, x, y)
        }
        context.fillStyle = style.color
        context.fillText(line, x, y)
    })
    context.restore()
}

/**
 * The layer's box in print-area units: its width (area widths) and height ÷ width. Its size
 * follows `scale` like an image's width does.
 */
export function textBox(style: DesignTextStyle, scale: number): { width: number; ratio: number } {
    const context = measurer()
    if (!context) return { width: scale, ratio: 0.3 }
    const block = layoutText(context, style, MEASURE_PX)
    return {
        width: (block.width / MEASURE_PX) * TEXT_FONT_RATIO * scale,
        ratio: block.height / block.width,
    }
}

/**
 * Draws a text layer centered at the current origin (already translated and rotated), for an
 * area `areaWidth` pixels wide.
 */
export function drawTextLayer(
    context: CanvasRenderingContext2D,
    style: DesignTextStyle,
    scale: number,
    areaWidth: number,
): void {
    const block = layoutText(context, style, scale * TEXT_FONT_RATIO * areaWidth)
    context.save()
    context.translate(-block.width / 2, -block.height / 2)
    drawTextBlock(context, style, block)
    context.restore()
}

// Fonts

let stylesheet: Promise<void> | null = null

/** Adds the Google Fonts stylesheet of the design fonts once (only the editor needs them). */
function loadStylesheet(): Promise<void> {
    if (!stylesheet) {
        stylesheet = new Promise<void>((resolve) => {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = DESIGN_FONTS_STYLESHEET
            link.onload = () => resolve()
            // Offline or blocked: the texts fall back to a generic font.
            link.onerror = () => resolve()
            document.head.append(link)
        })
    }
    return stylesheet
}

const SAMPLE = 'AaÁáÑñ¿?¡!0123'

/**
 * Resolves once the font can be drawn on a canvas (a canvas never waits for a web font: drawing
 * before it loads would use the fallback). Never rejects.
 */
export async function ensureDesignFont(id: DesignFontId): Promise<void> {
    if (typeof document === 'undefined' || !('fonts' in document)) return
    await loadStylesheet()
    try {
        await document.fonts.load(textFont(id, 40), SAMPLE)
    } catch {
        // The fallback font is drawn instead.
    }
}

export function ensureDesignFonts(ids: Iterable<DesignFontId>): Promise<void> {
    return Promise.all([...new Set(ids)].map(ensureDesignFont)).then(() => undefined)
}

/** Starts loading the stylesheet early (the font picker shows each font in itself). */
export function preloadDesignFonts(): void {
    if (typeof document !== 'undefined') void loadStylesheet()
}
