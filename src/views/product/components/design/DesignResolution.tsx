import { TriangleAlert } from 'lucide-react'

import type { DpiLevel } from '@/@types/design'
import { Alert } from '@/components/ui'

const LOW_TEXT =
    'Tu imagen tiene poca resolución para este tamaño; puede verse borrosa al imprimir.'

/** The estimated print resolution: fine, a warning, or a strong warning (never blocking). */
export function DesignResolution({ dpi, level }: { dpi: number; level: DpiLevel }) {
    if (level === 'ok') {
        return (
            <p role="status" className="text-sm text-ink-soft">
                Resolución estimada: <span className="font-semibold text-ink">{dpi} DPI</span> ·
                buena calidad para imprimir.
            </p>
        )
    }
    if (level === 'low') {
        return (
            <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border-2 border-butter-400/80 bg-butter-200/50 px-4 py-3 text-sm font-medium text-ink"
            >
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink" />
                <p>
                    {LOW_TEXT} <span className="whitespace-nowrap">({dpi} DPI)</span>
                </p>
            </div>
        )
    }
    return (
        <Alert tone="error">
            {LOW_TEXT} <span className="whitespace-nowrap">({dpi} DPI)</span> Te recomendamos
            achicarla o usar una imagen más grande.
        </Alert>
    )
}
