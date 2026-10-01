import type { DesignPlacement, DesignTextStyle } from '@/@types/design'
import {
    ARTWORK_MAX_BYTES,
    ARTWORK_STEPS,
    artworkSize,
    DESIGN_IMAGE_TYPES,
    DESIGN_PREVIEW_MAX_BYTES,
    DESIGN_PREVIEW_MAX_PIXELS,
    DESIGN_PREVIEW_WIDTH,
    MAX_DESIGN_IMAGE_BYTES,
    type ArtworkRect,
} from '@/constants/design.constant'
import { toColorInputValue } from '@/utils/color'
import { drawTextLayer } from '@/utils/designText'
import { isLowMemoryDevice } from '@/utils/imageResize'
import { drawMug, MUG_FRONT_ROTATION, MUG_SCENE_ASPECT } from '@/utils/mug3d'

/** Where the arte final ladder starts on low-memory phones (`navigator.deviceMemory` <= 4). */
const LOW_MEMORY_ARTWORK_MAX_SIDE = 3000

export interface LoadedDesignImage {
    element: HTMLImageElement
    /** Object URL of the file; revoke it with `releaseDesignImage`. */
    url: string
    width: number
    height: number
}

/** Spanish reason to refuse a file before decoding it; null when it may be an image. */
export function designFileProblem(
    file: File,
    options: { ignoreSize?: boolean } = {},
): string | null {
    if (!(DESIGN_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        return 'Tu imagen debe ser JPG, PNG o WEBP.'
    }
    if (!options.ignoreSize && file.size > MAX_DESIGN_IMAGE_BYTES) {
        return 'Tu imagen puede pesar como máximo 10 MB.'
    }
    return null
}

/** Decodes the file in the browser; rejects with a Spanish message when it is not an image. */
export async function loadDesignImage(file: File): Promise<LoadedDesignImage> {
    const problem = designFileProblem(file)
    if (problem) throw new Error(problem)
    const url = URL.createObjectURL(file)
    const element = new Image()
    element.decoding = 'async'
    element.src = url
    try {
        await element.decode()
    } catch {
        URL.revokeObjectURL(url)
        throw new Error('No pudimos abrir esta imagen. Prueba con otro archivo JPG, PNG o WEBP.')
    }
    if (!element.naturalWidth || !element.naturalHeight) {
        URL.revokeObjectURL(url)
        throw new Error('No pudimos abrir esta imagen. Prueba con otro archivo JPG, PNG o WEBP.')
    }
    return { element, url, width: element.naturalWidth, height: element.naturalHeight }
}

export function releaseDesignImage(image: LoadedDesignImage | null): void {
    if (image) URL.revokeObjectURL(image.url)
}

async function svgToImage(svg: SVGSVGElement, width: number, height: number) {
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))
    clone.removeAttribute('class')
    const markup = new XMLSerializer().serializeToString(clone)
    const image = new Image()
    // A data URL (not a blob URL) keeps the canvas exportable in Safari.
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
    await image.decode()
    return image
}

/**
 * Loads the template photo for the canvas. `crossOrigin="anonymous"` is required: without it a
 * cross-origin image taints the canvas and `toBlob` throws. Cloudinary's public delivery
 * (`res.cloudinary.com`) answers with `Access-Control-Allow-Origin: *`, and the API's local
 * `/uploads` goes through its CORS middleware, so the load succeeds and the canvas stays
 * exportable. The stage loads the same URL the same way, so the browser cache agrees.
 */
export async function loadTemplatePhoto(url: string): Promise<HTMLImageElement> {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.src = url
    await image.decode()
    return image
}

/**
 * Fallback when the CORS image load fails or still taints the canvas (typically a copy cached
 * earlier without CORS headers, e.g. by an extension or a proxy): fetch the bytes afresh in
 * `cors` mode, bypassing the cache, and draw them from a same-origin object URL, which never
 * taints. Resolves with the image and a `release` to revoke the URL once drawn.
 */
async function loadTemplatePhotoAsBlob(
    url: string,
): Promise<{ image: HTMLImageElement; release: () => void }> {
    const response = await fetch(url, { mode: 'cors', cache: 'no-store', credentials: 'omit' })
    if (!response.ok) throw new Error(`Template photo answered ${response.status}`)
    const objectUrl = URL.createObjectURL(await response.blob())
    const image = new Image()
    image.src = objectUrl
    try {
        await image.decode()
    } catch (error) {
        URL.revokeObjectURL(objectUrl)
        throw error
    }
    return { image, release: () => URL.revokeObjectURL(objectUrl) }
}

/**
 * How the template photo is loaded for the canvas: `cors` (the normal way, see
 * `loadTemplatePhoto`) or `blob` (the fallback, see `loadTemplatePhotoAsBlob`).
 */
type PhotoLoad = 'cors' | 'blob'

/**
 * Draws the template photo over the whole canvas: with CORS first (a failed CORS load, e.g. a
 * missing `Access-Control-Allow-Origin`, falls back to the blob right away), or straight from
 * the blob. If neither loads, the plain background stays (the preview still shows the
 * customer's image in its area). If the CORS copy taints the canvas anyway, `toBlob` throws a
 * SecurityError and `renderDesignPreview` draws again with `load = 'blob'`.
 */
async function drawTemplatePhoto(
    context: CanvasRenderingContext2D,
    url: string,
    load: PhotoLoad,
    width: number,
    height: number,
): Promise<void> {
    context.imageSmoothingQuality = 'high'
    const photo = load === 'cors' ? await loadTemplatePhoto(url).catch(() => null) : null
    if (photo) {
        context.drawImage(photo, 0, 0, width, height)
        return
    }
    const fetched = await loadTemplatePhotoAsBlob(url).catch(() => null)
    if (!fetched) return
    context.drawImage(fetched.image, 0, 0, width, height)
    fetched.release()
}

/** A layer as drawn on a canvas (bottom to top). */
export type RenderLayer =
    | { kind: 'image'; element: HTMLImageElement; ratio: number; placement: DesignPlacement }
    | { kind: 'text'; style: DesignTextStyle; placement: DesignPlacement }

/**
 * Draws the layers clipped to `rect` (the print area in canvas pixels): the same geometry as
 * the stage, the preview and the arte final.
 */
export function drawLayers(
    context: CanvasRenderingContext2D,
    layers: readonly RenderLayer[],
    rect: { x: number; y: number; width: number; height: number },
): void {
    context.save()
    context.beginPath()
    context.rect(rect.x, rect.y, rect.width, rect.height)
    context.clip()
    context.imageSmoothingQuality = 'high'
    for (const layer of layers) {
        const { placement } = layer
        context.save()
        context.translate(
            rect.x + rect.width / 2 + placement.x * rect.width,
            rect.y + rect.height / 2 + placement.y * rect.height,
        )
        context.rotate((placement.rotation * Math.PI) / 180)
        if (layer.kind === 'image') {
            const drawnWidth = placement.scale * rect.width
            const drawnHeight = drawnWidth * layer.ratio
            context.drawImage(
                layer.element,
                -drawnWidth / 2,
                -drawnHeight / 2,
                drawnWidth,
                drawnHeight,
            )
        } else {
            drawTextLayer(context, layer.style, placement.scale, rect.width)
        }
        context.restore()
    }
    context.restore()
}

/**
 * The print area alone, every layer composited on a transparent canvas of `size` (the same
 * drawing as the arte final, at any resolution): the 3D mug preview wraps it around the body.
 * Reuses `target` when given (resized), so a live preview does not allocate a canvas per frame.
 */
export function composePrintArea(
    layers: readonly RenderLayer[],
    size: { width: number; height: number },
    target?: HTMLCanvasElement,
): HTMLCanvasElement {
    const canvas = target ?? document.createElement('canvas')
    // Assigning the size also clears the canvas, even when it does not change.
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (context) drawLayers(context, layers, { x: 0, y: 0, ...size })
    return canvas
}

function canvasToPng(canvas: HTMLCanvasElement, message: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error(message))
        }, 'image/png')
    })
}

const ARTWORK_ERROR = 'No pudimos preparar el archivo de impresión de tu diseño.'

async function drawArtwork(
    layers: readonly RenderLayer[],
    size: { width: number; height: number },
): Promise<Blob> {
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error(ARTWORK_ERROR)
    drawLayers(context, layers, { x: 0, y: 0, ...size })
    const blob = await canvasToPng(canvas, ARTWORK_ERROR)
    // Frees the (large) bitmap right away on browsers that keep it until collected.
    canvas.width = 0
    canvas.height = 0
    return blob
}

/**
 * The "arte final": a transparent PNG of the print area only, every layer composited, at 200
 * DPI of the physical print size (at most 4000 px on the long side). A PNG over 9.5 MB (the
 * storage takes 10 MB) is rendered again at a lower resolution (see `ARTWORK_STEPS`), down to
 * 100 DPI; past that the customer is asked for fewer or lighter images.
 */
export async function renderDesignArtwork(
    layers: readonly RenderLayer[],
    print: { widthCm: number; heightCm: number },
): Promise<Blob> {
    let previous = ''
    // Phones with little RAM skip the 4000 px rungs: a 4000 px canvas is ~64 MB on its own.
    const steps = isLowMemoryDevice()
        ? ARTWORK_STEPS.filter((step) => step.maxSide <= LOW_MEMORY_ARTWORK_MAX_SIDE)
        : ARTWORK_STEPS
    for (const step of steps) {
        const size = artworkSize(print, step.dpi, step.maxSide)
        const key = `${size.width}x${size.height}`
        // A step that gives the same size (a small area) would weigh the same.
        if (key === previous) continue
        previous = key
        const blob = await drawArtwork(layers, size)
        if (blob.size <= ARTWORK_MAX_BYTES) return blob
    }
    throw new Error(
        'Tu diseño quedó demasiado pesado para imprimir. Prueba con menos imágenes o con imágenes más livianas.',
    )
}

/** What the image is placed on: the illustration's SVG or the template photo. */
export type PreviewBackdrop =
    { kind: 'svg'; svg: SVGSVGElement | null } | { kind: 'photo'; url: string }

export interface PreviewOptions {
    backdrop: PreviewBackdrop | null
    /** The view box the area is measured in (240 × 200, or the photo's pixels). */
    view: { width: number; height: number }
    layers: readonly RenderLayer[]
    area: ArtworkRect
    background: string
}

/** Up to `DESIGN_PREVIEW_WIDTH` wide and `DESIGN_PREVIEW_MAX_PIXELS` in all, in the view's shape. */
export function previewSize(
    view: { width: number; height: number },
    shrink = 1,
): { width: number; height: number } {
    const aspect = view.width / view.height
    const width = Math.max(
        1,
        Math.floor(
            Math.min(DESIGN_PREVIEW_WIDTH, Math.sqrt(DESIGN_PREVIEW_MAX_PIXELS * aspect)) * shrink,
        ),
    )
    return { width, height: Math.max(1, Math.round(width / aspect)) }
}

/**
 * The backdrop with every layer placed and clipped to the print area, as a PNG (the same
 * geometry as the editor). A template photo that taints the canvas (served or cached without
 * CORS) is drawn again from a fetched blob; if the backdrop still cannot be drawn or exported
 * (a browser that taints canvases with SVG, a photo without CORS at all), the preview shows the
 * image in its area on the plain background. A preview over the API's 2 MB is drawn smaller.
 */
export async function renderDesignPreview(options: PreviewOptions): Promise<Blob> {
    const attempts: [PreviewOptions, PhotoLoad][] = [[options, 'cors']]
    if (options.backdrop?.kind === 'photo') attempts.push([options, 'blob'])
    if (options.backdrop) attempts.push([{ ...options, backdrop: null }, 'cors'])

    let lastError: unknown
    for (const [drawn, load] of attempts) {
        try {
            const blob = await drawPreview(drawn, load)
            return blob.size > DESIGN_PREVIEW_MAX_BYTES ? await drawPreview(drawn, load, 0.7) : blob
        } catch (error) {
            lastError = error
        }
    }
    throw lastError
}

async function drawPreview(options: PreviewOptions, load: PhotoLoad, shrink = 1): Promise<Blob> {
    const { width, height } = previewSize(options.view, shrink)
    const unit = width / options.view.width
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No pudimos preparar la vista previa de tu diseño.')

    context.fillStyle = options.background
    context.fillRect(0, 0, width, height)
    const { backdrop } = options
    if (backdrop?.kind === 'svg' && backdrop.svg) {
        try {
            context.drawImage(await svgToImage(backdrop.svg, width, height), 0, 0, width, height)
        } catch {
            // Keep going: the image on the plain background is still a useful preview.
        }
    } else if (backdrop?.kind === 'photo') {
        await drawTemplatePhoto(context, backdrop.url, load, width, height)
    }

    const { area } = options
    drawLayers(context, options.layers, {
        x: area.x * unit,
        y: area.y * unit,
        width: area.width * unit,
        height: area.height * unit,
    })
    return canvasToPng(canvas, 'No pudimos preparar la vista previa de tu diseño.')
}

/** Width of the print texture wrapped around the mug of the 3D snapshot. */
const MUG_SNAPSHOT_TEXTURE_WIDTH = 1024
const PREVIEW_ERROR = 'No pudimos preparar la vista previa de tu diseño.'

export interface MugPreviewOptions {
    layers: readonly RenderLayer[]
    /** Physical size of the print (the whole wrap). */
    print: { widthCm: number; heightCm: number }
    /** The mug's color (`#RRGGBB`). */
    bodyColor: string
    /** Behind the mug. */
    background: string
}

/** The 3D mug at the "Frente" view (handle on the right), as a PNG `DESIGN_PREVIEW_WIDTH` wide. */
async function drawMugSnapshot(options: MugPreviewOptions, shrink = 1): Promise<Blob> {
    const width = Math.max(1, Math.round(DESIGN_PREVIEW_WIDTH * shrink))
    const height = Math.max(1, Math.round(width / MUG_SCENE_ASPECT))
    const { widthCm, heightCm } = options.print
    const texture = composePrintArea(options.layers, {
        width: MUG_SNAPSHOT_TEXTURE_WIDTH,
        height: Math.max(1, Math.round((MUG_SNAPSHOT_TEXTURE_WIDTH * heightCm) / widthCm)),
    })
    // `drawMug` clears its canvas: the mug goes on its own, then onto the background.
    const mug = document.createElement('canvas')
    mug.width = width
    mug.height = height
    const mugContext = mug.getContext('2d')
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!mugContext || !context) throw new Error(PREVIEW_ERROR)
    drawMug(mugContext, texture, {
        rotation: MUG_FRONT_ROTATION,
        bodyColor: options.bodyColor,
        print: options.print,
    })
    context.fillStyle = options.background
    context.fillRect(0, 0, width, height)
    context.drawImage(mug, 0, 0)
    return canvasToPng(canvas, PREVIEW_ERROR)
}

/**
 * The preview of a mug design: a snapshot of the 3D mug (see `utils/mug3d.ts`) at the "Frente"
 * view, drawn smaller when over the API's 2 MB. If the snapshot cannot be drawn or exported, the
 * flat wrap instead: the whole print on the mug's color. Same contract as `renderDesignPreview`
 * (one PNG).
 */
export async function renderMugPreview(options: MugPreviewOptions): Promise<Blob> {
    try {
        const blob = await drawMugSnapshot(options)
        return blob.size > DESIGN_PREVIEW_MAX_BYTES ? await drawMugSnapshot(options, 0.7) : blob
    } catch {
        const { widthCm, heightCm } = options.print
        const view = { width: widthCm, height: heightCm }
        return renderDesignPreview({
            backdrop: null,
            view,
            layers: options.layers,
            area: { x: 0, y: 0, ...view },
            background: toColorInputValue(options.bodyColor),
        })
    }
}
