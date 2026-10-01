import type { CreatedDesign, DesignPlacement, DesignTextStyle } from '@/@types/design'
import { apiConfig } from '@/configs/api.config'
import { ApiError, type ApiFieldError } from '@/services/errors'

/** A layer as `POST /designs` takes it; `z` orders them (bottom = 0). */
export type DesignUploadLayer =
    | { type: 'image'; z: number; placement: DesignPlacement; assetIndex: number }
    | ({ type: 'text'; z: number; placement: DesignPlacement } & DesignTextStyle)

export interface DesignUploadInput {
    productId: string
    variantId?: string
    /** The garment color (template photo) chosen in the editor, when the template has colors. */
    templateColorId?: string
    layers: DesignUploadLayer[]
    /** The original of each image layer, in `assetIndex` order. */
    originals: File[]
    /** The print-ready PNG of the print area. */
    artwork: Blob
    preview: Blob
}

const NETWORK_ERROR_MESSAGE = 'No pudimos subir tu diseño. Revisa tu conexión e intenta de nuevo.'

function toApiError(xhr: XMLHttpRequest): ApiError {
    let payload: Record<string, unknown> = {}
    try {
        payload = JSON.parse(xhr.responseText) as Record<string, unknown>
    } catch {
        // Not JSON (e.g. a proxy error page): keep the fallback message.
    }
    const message =
        typeof payload.message === 'string'
            ? payload.message
            : xhr.status === 429
              ? 'Subiste muchos diseños seguidos. Espera un rato e intenta de nuevo.'
              : NETWORK_ERROR_MESSAGE
    const details = Array.isArray(payload.details) ? (payload.details as ApiFieldError[]) : []
    return new ApiError(xhr.status, message, details, payload)
}

/**
 * "Diseña con tu imagen". The upload goes through XMLHttpRequest (not `fetch`) to report
 * progress: up to 5 originals of 10 MB and the arte final on a phone connection.
 */
export const DesignService = {
    upload: (
        input: DesignUploadInput,
        onProgress?: (fraction: number) => void,
        signal?: AbortSignal,
    ): Promise<CreatedDesign> =>
        new Promise((resolve, reject) => {
            const form = new FormData()
            form.append('productId', input.productId)
            if (input.variantId) form.append('variantId', input.variantId)
            if (input.templateColorId) form.append('templateColorId', input.templateColorId)
            form.append('layers', JSON.stringify(input.layers))
            for (const original of input.originals) {
                form.append('originals', original, original.name)
            }
            form.append('artwork', input.artwork, 'arte-final.png')
            form.append('preview', input.preview, 'vista-previa.png')

            const xhr = new XMLHttpRequest()
            xhr.open('POST', `${apiConfig.baseUrl}/designs`)
            xhr.withCredentials = true
            xhr.setRequestHeader('Accept', 'application/json')
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) onProgress?.(event.loaded / event.total)
            }
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText) as CreatedDesign)
                    } catch {
                        reject(new ApiError(xhr.status, NETWORK_ERROR_MESSAGE))
                    }
                    return
                }
                reject(toApiError(xhr))
            }
            xhr.onerror = () => reject(new ApiError(0, NETWORK_ERROR_MESSAGE))
            xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
            signal?.addEventListener('abort', () => xhr.abort(), { once: true })
            xhr.send(form)
        }),

    /** Absolute URL of an API path (the preview paths are stored without the base URL). */
    url: (path: string) => `${apiConfig.baseUrl}${path}`,
} as const
