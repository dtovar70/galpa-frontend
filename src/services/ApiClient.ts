import { apiConfig } from '@/configs/api.config'
import { ApiError, type ApiFieldError } from '@/services/errors'

type QueryValue = string | number | boolean | undefined | null | readonly (string | number)[]

export type QueryParams = Record<string, QueryValue>

export interface RequestOptions {
    query?: QueryParams
    /** Plain objects are sent as JSON; `FormData` is sent as multipart as-is. */
    body?: unknown
    signal?: AbortSignal
    /** Extra request headers (e.g. `Idempotency-Key`). */
    headers?: Record<string, string>
    /**
     * Gives up after this many ms with a friendly "slow connection" error. Defaults to
     * `DEFAULT_TIMEOUT_MS`, or `UPLOAD_TIMEOUT_MS` for multipart bodies.
     */
    timeoutMs?: number
}

const NETWORK_ERROR_MESSAGE =
    'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'

/** `ApiError.code` of a request that gave up waiting (status 0, like a network error). */
export const REQUEST_TIMEOUT = 'REQUEST_TIMEOUT'

export const TIMEOUT_ERROR_MESSAGE = 'La conexión está lenta. Revisa tu señal e inténtalo de nuevo.'

/** Most customers are on slow mobile data: generous, but never an endless spinner. */
const DEFAULT_TIMEOUT_MS = 20_000
/** Multipart bodies (payment proofs, images) need much longer on a weak signal. */
const UPLOAD_TIMEOUT_MS = 120_000

/**
 * A signal that aborts when the caller's `signal` does or after `timeoutMs`. A timeout aborts
 * with a `TimeoutError` reason, so it can be told apart from a caller abort.
 */
function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
    const timeout =
        typeof AbortSignal.timeout === 'function'
            ? AbortSignal.timeout(timeoutMs)
            : manualTimeout(timeoutMs)
    if (!signal) return timeout
    if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout])

    // Older browsers: forward whichever fires first.
    const controller = new AbortController()
    const forward = (source: AbortSignal) => () => controller.abort(source.reason)
    if (signal.aborted) controller.abort(signal.reason)
    signal.addEventListener('abort', forward(signal), { once: true })
    timeout.addEventListener('abort', forward(timeout), { once: true })
    return controller.signal
}

function manualTimeout(timeoutMs: number): AbortSignal {
    const controller = new AbortController()
    setTimeout(
        () => controller.abort(new DOMException('The request timed out.', 'TimeoutError')),
        timeoutMs,
    )
    return controller.signal
}

/** Maps a failed `fetch` (or body read) to an `ApiError`; caller aborts are rethrown as-is. */
function toNetworkError(
    error: unknown,
    callerSignal: AbortSignal | undefined,
    requestSignal: AbortSignal,
): unknown {
    // The caller cancelled (e.g. React Query dropped the query): not an error to show.
    if (callerSignal?.aborted) return error
    // Our own timeout fired (older engines report it as a plain `AbortError`).
    if (requestSignal.aborted) {
        return new ApiError(0, TIMEOUT_ERROR_MESSAGE, [], { code: REQUEST_TIMEOUT })
    }
    return new ApiError(0, NETWORK_ERROR_MESSAGE)
}

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
    401: 'Debes iniciar sesión para continuar.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'No encontramos lo que buscabas.',
    429: 'Demasiadas solicitudes. Espera un minuto e intenta de nuevo.',
}

function buildUrl(path: string, query?: QueryParams): string {
    // The base may be relative (`/api` behind the dev tunnel proxy): resolve it against the page.
    const url = new URL(`${apiConfig.baseUrl}${path}`, window.location.origin)
    if (!query) return url.toString()

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue
        if (Array.isArray(value)) {
            if (value.length) url.searchParams.set(key, value.join(','))
            continue
        }
        url.searchParams.set(key, String(value))
    }
    return url.toString()
}

interface ErrorPayload {
    message?: unknown
    details?: unknown
    [key: string]: unknown
}

async function toApiError(response: Response): Promise<ApiError> {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null
    // Nest returns `message` as a string, or as a string[] for some built-in exceptions.
    const rawMessage = payload?.message
    const message =
        typeof rawMessage === 'string'
            ? rawMessage
            : Array.isArray(rawMessage) && typeof rawMessage[0] === 'string'
              ? rawMessage[0]
              : (STATUS_FALLBACK_MESSAGES[response.status] ??
                'Ocurrió un error inesperado. Intenta de nuevo.')
    const details = Array.isArray(payload?.details) ? (payload.details as ApiFieldError[]) : []
    return new ApiError(response.status, message, details, payload ?? {})
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const { query, body, signal, timeoutMs } = options
    const isFormData = body instanceof FormData
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
    if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
    const requestSignal = withTimeout(
        signal,
        timeoutMs ?? (isFormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS),
    )

    let response: Response
    let text: string
    try {
        response = await fetch(buildUrl(path, query), {
            method,
            headers,
            credentials: 'include',
            signal: requestSignal,
            body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
        })
        if (!response.ok) throw await toApiError(response)
        if (response.status === 204) return undefined as T
        text = await response.text()
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw toNetworkError(error, signal, requestSignal)
    }

    return (text ? JSON.parse(text) : undefined) as T
}

/** GET of a binary file (e.g. a PDF). Errors are parsed like any other call. */
async function requestBlob(
    path: string,
    options: Omit<RequestOptions, 'body'> = {},
): Promise<Blob> {
    const requestSignal = withTimeout(options.signal, options.timeoutMs ?? UPLOAD_TIMEOUT_MS)
    try {
        const response = await fetch(buildUrl(path, options.query), {
            credentials: 'include',
            headers: options.headers,
            signal: requestSignal,
        })
        if (!response.ok) throw await toApiError(response)
        return await response.blob()
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw toNetworkError(error, options.signal, requestSignal)
    }
}

/** Thin typed wrapper over `fetch`: JSON in/out, cookies included, errors as `ApiError`. */
export const apiClient = {
    get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('GET', path, options),
    getBlob: (path: string, options?: Omit<RequestOptions, 'body'>) => requestBlob(path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>('POST', path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>('PUT', path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>('PATCH', path, { ...options, body }),
    delete: <T = void>(path: string, options?: RequestOptions) =>
        request<T>('DELETE', path, options),
} as const
