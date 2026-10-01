/**
 * Client-side downscaling before uploads. Most customers are on mid/low-end Android phones and
 * slow mobile data: a 12 MP camera photo or a full-resolution screenshot is several MB that the
 * server does not need. Every helper here falls back to the original file on any failure.
 */

export interface ImageSize {
    width: number
    height: number
}

/** Reads the pixel size (orientation applied) without keeping a decoded bitmap around. */
function readImageSize(file: Blob): Promise<ImageSize> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const image = new Image()
        image.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ width: image.naturalWidth, height: image.naturalHeight })
        }
        image.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Not an image'))
        }
        image.src = url
    })
}

function scaledSize(size: ImageSize, maxSide: number): ImageSize {
    const scale = Math.min(1, maxSide / Math.max(size.width, size.height))
    return {
        width: Math.max(1, Math.round(size.width * scale)),
        height: Math.max(1, Math.round(size.height * scale)),
    }
}

/**
 * Decodes `file` straight to `target` with `createImageBitmap`'s resize options where the
 * browser supports them (much less memory than a full-size decode), otherwise through an
 * `<img>` drawn scaled onto the canvas.
 */
async function drawScaled(file: Blob, target: ImageSize): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No 2D context')

    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(file, {
                resizeWidth: target.width,
                resizeHeight: target.height,
                resizeQuality: 'high',
                imageOrientation: 'from-image',
            })
            context.drawImage(bitmap, 0, 0, target.width, target.height)
            bitmap.close()
            return canvas
        } catch {
            // Older engines refuse the options bag: fall through to the <img> path.
        }
    }

    const url = URL.createObjectURL(file)
    try {
        const image = new Image()
        image.src = url
        await image.decode()
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, 0, 0, target.width, target.height)
        return canvas
    } finally {
        URL.revokeObjectURL(url)
    }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
            type,
            quality,
        )
    })
}

/** Frees the canvas bitmap right away (some browsers keep it until collected). */
function releaseCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = 0
    canvas.height = 0
}

/** True when some pixel is not fully opaque (checked on a small copy, cheap on any phone). */
async function hasTransparency(file: Blob, size: ImageSize): Promise<boolean> {
    const probe = await drawScaled(file, scaledSize(size, 256))
    try {
        const context = probe.getContext('2d')
        if (!context) return true
        const { data } = context.getImageData(0, 0, probe.width, probe.height)
        for (let index = 3; index < data.length; index += 4) {
            if (data[index]! < 255) return true
        }
        return false
    } finally {
        releaseCanvas(probe)
    }
}

function renamed(name: string, extension: string): string {
    const base = name.replace(/\.[^.]+$/, '') || 'imagen'
    return `${base}.${extension}`
}

export interface CompressOptions {
    /** Long side, in pixels, of the result. */
    maxSide: number
    /** JPEG quality (0–1). */
    quality: number
    /** A file this light and already within `maxSide` is returned as is. */
    skipBelowBytes: number
    /** Keep transparency (re-encode as PNG when the image has any); otherwise JPEG on white. */
    keepTransparency?: boolean
}

/**
 * Downscales `file` to `maxSide` and re-encodes it (JPEG, or PNG when it has transparency and
 * `keepTransparency` is set). Returns the original when it is already small, when the result
 * would not be lighter, or when anything fails (the server still validates the upload).
 */
export async function compressImage(file: File, options: CompressOptions): Promise<File> {
    try {
        const size = await readImageSize(file)
        const needsResize = Math.max(size.width, size.height) > options.maxSide
        if (!needsResize && file.size <= options.skipBelowBytes) return file

        const transparent =
            options.keepTransparency === true &&
            file.type !== 'image/jpeg' &&
            (await hasTransparency(file, size))
        // A transparent image that fits gains little from a PNG re-encode.
        if (transparent && !needsResize) return file

        const canvas = await drawScaled(file, scaledSize(size, options.maxSide))
        let blob: Blob
        try {
            if (!transparent) {
                // JPEG has no alpha: paint the transparent parts white, not black.
                const context = canvas.getContext('2d')
                if (context) {
                    context.globalCompositeOperation = 'destination-over'
                    context.fillStyle = '#ffffff'
                    context.fillRect(0, 0, canvas.width, canvas.height)
                }
            }
            blob = transparent
                ? await canvasToBlob(canvas, 'image/png')
                : await canvasToBlob(canvas, 'image/jpeg', options.quality)
        } finally {
            releaseCanvas(canvas)
        }

        if (!needsResize && blob.size >= file.size) return file
        const type = transparent ? 'image/png' : 'image/jpeg'
        return new File([blob], renamed(file.name, transparent ? 'png' : 'jpg'), {
            type,
            lastModified: file.lastModified,
        })
    } catch {
        return file
    }
}

/** Payment screenshots: 1600 px is plenty to read a bank reference. */
export function compressProof(file: File): Promise<File> {
    return compressImage(file, { maxSide: 1600, quality: 0.85, skipBelowBytes: 400 * 1024 })
}

/** Design images: 4000 px (the arte final's ceiling), transparency kept. */
export function prepareDesignImage(file: File): Promise<File> {
    return compressImage(file, {
        maxSide: 4000,
        quality: 0.9,
        skipBelowBytes: 2 * 1024 * 1024,
        keepTransparency: true,
    })
}

/** True on phones that report 4 GB of RAM or less (Chromium only; unknown elsewhere). */
export function isLowMemoryDevice(): boolean {
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    return typeof memory === 'number' && memory <= 4
}
