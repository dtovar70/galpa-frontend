import { useEffect, useState } from 'react'

import { orderQrSvgDataUrl } from '@/utils/orderQr'

/** The QR image (SVG data URL) of `url`; null while it is generated or without a URL. */
export function useOrderQr(url: string | null): string | null {
    const [qr, setQr] = useState<{ url: string; src: string } | null>(null)

    useEffect(() => {
        if (!url) return
        let active = true
        void orderQrSvgDataUrl(url).then((src) => {
            if (active) setQr({ url, src })
        })
        return () => {
            active = false
        }
    }, [url])

    return qr && qr.url === url ? qr.src : null
}
