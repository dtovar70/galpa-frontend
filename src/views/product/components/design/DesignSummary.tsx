import { PenLine, Rotate3d, Trash2 } from 'lucide-react'

import type { DpiLevel, GarmentColor } from '@/@types/design'
import { DesignBadge, GarmentColorNote } from '@/components/shared/DesignBadge'
import { Button } from '@/components/ui'

export interface DesignSummaryProps {
    /** Local URL of the rendered mockup. */
    previewUrl: string
    /** "2 imágenes · 1 texto". */
    summary: string
    /** The lowest DPI among its images; null with only text. */
    dpi: number | null
    dpiLevel: DpiLevel
    /** The garment color it was made on, when the template has colors. */
    color: GarmentColor | null
    /** Label of the version it was made for, when it is not the selected one. */
    otherVariantLabel?: string
    onEdit: () => void
    onRemove: () => void
    /** Mugs: opens the design on the rotating 3D mug; absent hides "Ver en 3D". */
    onView3d?: () => void
}

const DPI_NOTE: Record<Exclude<DpiLevel, 'ok'>, string> = {
    low: 'Poca resolución: puede verse borrosa al imprimir.',
    veryLow: 'Muy poca resolución: se verá borrosa al imprimir.',
}

/** The design ready to go into the cart, next to "Agregar al carrito". */
export function DesignSummary({
    previewUrl,
    summary,
    dpi,
    dpiLevel,
    color,
    otherVariantLabel,
    onEdit,
    onRemove,
    onView3d,
}: DesignSummaryProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-lilac-200 bg-white p-3">
            <img
                src={previewUrl}
                alt="Vista previa de tu diseño"
                className="aspect-[6/5] w-24 shrink-0 rounded-xl bg-blush-50 object-contain"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
                <DesignBadge />
                {color ? <GarmentColorNote color={color} /> : null}
                {otherVariantLabel ? (
                    <p role="alert" className="text-xs font-semibold text-blush-700">
                        Lo hiciste para «{otherVariantLabel}». Edítalo para usarlo en esta versión.
                    </p>
                ) : dpiLevel === 'ok' || dpi === null ? (
                    <p className="text-xs text-ink-soft">
                        {summary} · listo para agregar{dpi === null ? '' : ` · ${dpi} DPI`}
                    </p>
                ) : (
                    <p className="text-xs font-semibold text-blush-700">
                        {summary} · {DPI_NOTE[dpiLevel]} ({dpi} DPI)
                    </p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<PenLine aria-hidden="true" className="size-4" />}
                        onClick={onEdit}
                        className="h-8 px-2"
                    >
                        Editar diseño
                    </Button>
                    {onView3d ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            leadingIcon={<Rotate3d aria-hidden="true" className="size-4" />}
                            onClick={onView3d}
                            className="h-8 px-2"
                        >
                            Ver en 3D
                        </Button>
                    ) : null}
                    <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<Trash2 aria-hidden="true" className="size-4" />}
                        onClick={onRemove}
                        className="h-8 px-2 text-blush-700"
                    >
                        Quitar diseño
                    </Button>
                </div>
            </div>
        </div>
    )
}
