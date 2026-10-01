import { useEffect, useState } from 'react'

import type { CartDesign, DraftLayer } from '@/@types/design'
import type { DesignEditorResult } from '@/views/product/components/design/DesignEditor'

/** A design uploaded from the product page, not in the cart yet. */
export interface DesignDraft {
    slug: string
    /** The version it was made on (its color); null for a product without variants. */
    variantId: string | null
    /**
     * Its layers, bottom to top, with the image files (kept in memory only: after a reload
     * there is no draft, and the cart keeps just the uploaded design).
     */
    layers: DraftLayer[]
    design: CartDesign
    /** Object URL of the rendered mockup (revoked when the draft goes away). */
    previewUrl: string
    /** The lowest DPI among its images; null with only text. */
    dpi: number | null
    /** The garment color (template) it was made on, so "Editar diseño" reopens on it. */
    colorId: string | null
}

/**
 * The product page's design, tied to the product slug so a related product opened from here
 * starts without one. Once added to the cart the page lets it go (a design is used by one line).
 */
export function useDesignDraft(slug: string) {
    const [draft, setDraft] = useState<DesignDraft | null>(null)
    const previewUrl = draft?.previewUrl

    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        },
        [previewUrl],
    )

    return {
        draft: draft?.slug === slug ? draft : null,
        save: (variantId: string | null, result: DesignEditorResult) =>
            setDraft({
                slug,
                variantId,
                layers: result.layers,
                design: result.design,
                previewUrl: URL.createObjectURL(result.previewBlob),
                dpi: result.dpi,
                colorId: result.colorId,
            }),
        clear: () => setDraft(null),
    }
}
