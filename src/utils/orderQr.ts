import QRCode from 'qrcode'

/**
 * Scan-friendly settings for every order QR (same as the API's receipt): medium error
 * correction, a 4-module quiet zone and pure black on white.
 */
const QR_OPTIONS = {
    errorCorrectionLevel: 'M',
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
} as const

/** The QR as an SVG data URL, for an `<img>` (crisp at any size, no HTML injection). */
export async function orderQrSvgDataUrl(url: string): Promise<string> {
    const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' })
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** A 1024 px PNG of the QR as a data URL (downloads and printing). */
export function orderQrPngDataUrl(url: string, width = 1024): Promise<string> {
    return QRCode.toDataURL(url, { ...QR_OPTIONS, type: 'image/png', width })
}

/** `pedido-MR-000012.png`. */
export function orderQrFilename(code: string): string {
    return `pedido-${code}.png`
}

/** Saves the QR of `url` as `pedido-<code>.png`. */
export async function downloadOrderQr(url: string, code: string): Promise<void> {
    const link = document.createElement('a')
    link.href = await orderQrPngDataUrl(url)
    link.download = orderQrFilename(code)
    document.body.appendChild(link)
    link.click()
    link.remove()
}
