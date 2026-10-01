import { useEffect } from 'react'
import { Download, Printer } from 'lucide-react'

import type { DesignFontId } from '@/@types/design'
import type { AdminDesignLayer, AdminOrderItemDesign } from '@/@types/order'
import { DesignBadge, GarmentColorNote } from '@/components/shared/DesignBadge'
import { ProofViewer } from '@/components/shared/ProofViewer'
import { Badge, buttonVariants } from '@/components/ui'
import { designFont, TEXT_OUTLINE_OPTIONS } from '@/constants/design.constant'
import { AdminOrderService } from '@/services/AdminOrderService'
import { cn } from '@/utils/cn'
import { preloadDesignFonts } from '@/utils/designText'

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / 1024 / 1024).toLocaleString('es-VE', { maximumFractionDigits: 1 })} MB`
}

function signedPercent(value: number): string {
    const percent = Math.round(value * 100)
    return `${percent > 0 ? '+' : ''}${percent} %`
}

function formatCm(value: number): string {
    return value.toLocaleString('es-VE', { maximumFractionDigits: 1 })
}

const DPI_BADGE = {
    ok: { tone: 'mint', label: 'Buena resolución' },
    low: { tone: 'butter', label: 'Poca resolución' },
    veryLow: { tone: 'blush', label: 'Resolución muy baja' },
} as const

const ALIGN_LABEL = { left: 'izquierda', center: 'centrado', right: 'derecha' } as const

/** "ancho 80 % del área · desplazada +10 % horizontal, −5 % vertical · rotación 15°". */
function placementText(layer: AdminDesignLayer): string {
    const { placement } = layer
    const size =
        layer.type === 'image'
            ? `ancho ${Math.round(placement.scale * 100)} % del área`
            : `tamaño ${Math.round(placement.scale * 100)} %`
    return `${size} · desplazada ${signedPercent(placement.x)} horizontal, ${signedPercent(placement.y)} vertical · rotación ${Math.round(placement.rotation)}°`
}

function ImageLayerRow({ layer }: { layer: Extract<AdminDesignLayer, { type: 'image' }> }) {
    const dpi = DPI_BADGE[layer.dpiLevel]
    return (
        <li className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-2">
            <img
                src={AdminOrderService.designUrl(layer.viewPath)}
                alt={`Imagen ${layer.number}`}
                loading="lazy"
                className="size-14 shrink-0 rounded-lg border border-line bg-[repeating-conic-gradient(#f0e4ec_0_25%,#fff_0_50%)] bg-[length:12px_12px] object-contain"
            />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-ink">Imagen {layer.number}</span>
                    <Badge tone={dpi.tone} size="sm">
                        {layer.dpi} DPI
                    </Badge>
                </div>
                <p>
                    {layer.width} × {layer.height} px · {layer.format.toUpperCase()} ·{' '}
                    {formatBytes(layer.bytes)}
                </p>
                <p>{placementText(layer)}</p>
                <a
                    href={AdminOrderService.designUrl(layer.downloadPath)}
                    download={layer.downloadName}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 px-2')}
                >
                    <Download aria-hidden="true" className="size-4" />
                    Descargar original
                </a>
            </div>
        </li>
    )
}

function TextLayerRow({ layer }: { layer: Extract<AdminDesignLayer, { type: 'text' }> }) {
    const font = designFont(layer.font as DesignFontId)
    const outline = TEXT_OUTLINE_OPTIONS.find((option) => option.value === layer.outline)
    return (
        <li className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-2">
            <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-line bg-[repeating-conic-gradient(#f0e4ec_0_25%,#fff_0_50%)] bg-[length:12px_12px] text-2xl"
                style={{
                    fontFamily: `"${font.family}", ${font.fallback}`,
                    fontWeight: font.weight,
                    color: layer.color,
                }}
            >
                Aa
            </span>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold break-words whitespace-pre-line text-ink">
                    Texto: «{layer.content}»
                </p>
                <p className="flex flex-wrap items-center gap-x-1.5">
                    <span>Fuente {layer.fontLabel}</span>·
                    <span className="inline-flex items-center gap-1">
                        <span
                            aria-hidden="true"
                            className="inline-block size-3 rounded-full border border-line"
                            style={{ backgroundColor: layer.color }}
                        />
                        {layer.color}
                    </span>
                    · <span>borde {outline?.label.toLowerCase() ?? layer.outline}</span>·
                    <span>{ALIGN_LABEL[layer.align]}</span>
                </p>
                <p>{placementText(layer)}</p>
            </div>
        </li>
    )
}

/**
 * The customer's own design for one line: the mockup preview (opens in the viewer), the "arte
 * final" ready to print, and every layer (each image with its original and resolution, each text
 * with its font and color).
 */
export function OrderItemDesign({
    design,
    productName,
    line,
}: {
    design: AdminOrderItemDesign
    productName: string
    line: number
}) {
    const dpi = design.dpiLevel ? DPI_BADGE[design.dpiLevel] : null
    const hasText = design.layers.some((layer) => layer.type === 'text')
    // The text samples show each layer's font.
    useEffect(() => {
        if (hasText) preloadDesignFonts()
    }, [hasText])

    return (
        <div className="mt-2 space-y-3 rounded-xl border border-lilac-200 bg-lilac-200/20 p-3 text-xs text-ink-soft">
            <div className="flex flex-wrap items-start gap-3">
                <ProofViewer
                    src={AdminOrderService.designUrl(design.previewPath)}
                    title={`Diseño propio · línea ${line} · ${productName}`}
                    thumbLabel="Ver diseño"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <DesignBadge />
                        {dpi && design.dpiEstimate !== null ? (
                            <Badge tone={dpi.tone} size="sm">
                                {dpi.label} · {design.dpiEstimate} DPI
                            </Badge>
                        ) : null}
                    </div>
                    {design.color ? <GarmentColorNote color={design.color} /> : null}
                    {design.printSize ? (
                        <p>
                            Área de impresión {formatCm(design.printSize.widthCm)} ×{' '}
                            {formatCm(design.printSize.heightCm)} cm
                        </p>
                    ) : null}
                    {design.artwork ? (
                        <>
                            <a
                                href={AdminOrderService.designUrl(design.artwork.path)}
                                download={design.artwork.downloadName}
                                className={cn(
                                    buttonVariants({ variant: 'primary', size: 'sm' }),
                                    'mt-1',
                                )}
                            >
                                <Printer aria-hidden="true" className="size-4" />
                                Descargar arte final
                            </a>
                            <p>
                                Arte final
                                {design.artwork.dpi ? ` · ${design.artwork.dpi} DPI` : ''} · PNG
                                transparente · {design.artwork.width} × {design.artwork.height} px ·{' '}
                                {formatBytes(design.artwork.bytes)}
                            </p>
                        </>
                    ) : (
                        <p>Este diseño es anterior al arte final: imprime desde el original.</p>
                    )}
                </div>
            </div>
            {design.layers.length ? (
                <div className="space-y-1.5">
                    <p className="font-semibold text-ink">
                        Capas <span className="font-normal">(de abajo hacia arriba)</span>
                    </p>
                    <ol className="space-y-1.5">
                        {design.layers.map((layer) =>
                            layer.type === 'image' ? (
                                <ImageLayerRow key={layer.index} layer={layer} />
                            ) : (
                                <TextLayerRow key={layer.index} layer={layer} />
                            ),
                        )}
                    </ol>
                </div>
            ) : null}
        </div>
    )
}
