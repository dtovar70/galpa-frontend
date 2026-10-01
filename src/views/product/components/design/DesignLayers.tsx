import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Copy, ImagePlus, Trash2, Type } from 'lucide-react'

import { Button } from '@/components/ui'
import { FIELD_HINT_CLASS } from '@/components/ui/field.styles'
import { MAX_IMAGE_LAYERS, MAX_TEXT_LAYERS, designFont } from '@/constants/design.constant'
import { cn } from '@/utils/cn'
import { layerLabel, type EditorLayer } from '@/views/product/components/design/editorLayers'

export interface DesignLayersProps {
    /** Bottom to top (listed top first, like the stage stacks them). */
    layers: EditorLayer[]
    selectedId: string | null
    onSelect: (id: string) => void
    /** `+1` brings the layer one step forward (up), `-1` sends it back. */
    onMove: (id: string, step: 1 | -1) => void
    onDuplicate: (id: string) => void
    onDelete: (id: string) => void
    onAddImage: () => void
    onAddText: () => void
    disabled?: boolean
}

function IconButton({
    label,
    onClick,
    disabled,
    className,
    children,
}: {
    label: string
    onClick: () => void
    disabled?: boolean
    className?: string
    children: ReactNode
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-blush-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35',
                className,
            )}
        >
            {children}
        </button>
    )
}

function Thumbnail({ layer }: { layer: EditorLayer }) {
    if (layer.type === 'image') {
        return (
            <img
                src={layer.image.url}
                alt=""
                className="size-11 shrink-0 rounded-lg border border-line bg-white object-contain"
            />
        )
    }
    const font = designFont(layer.font)
    return (
        <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-[repeating-conic-gradient(#f0e4ec_0_25%,#fff_0_50%)] bg-[length:12px_12px] text-xl"
            style={{
                fontFamily: `"${font.family}", ${font.fallback}`,
                fontWeight: font.weight,
                color: layer.color,
                WebkitTextStroke:
                    layer.outline === 'none'
                        ? undefined
                        : `1px ${layer.outline === 'white' ? '#fff' : '#000'}`,
            }}
        >
            Aa
        </span>
    )
}

/**
 * "Capas": the design's images and texts, the top one first. Tap one to select it (the stage
 * and the controls then act on it); move it up or down, duplicate or delete it.
 */
export function DesignLayers({
    layers,
    selectedId,
    onSelect,
    onMove,
    onDuplicate,
    onDelete,
    onAddImage,
    onAddText,
    disabled = false,
}: DesignLayersProps) {
    const images = layers.filter((layer) => layer.type === 'image').length
    const texts = layers.length - images
    const canAddImage = images < MAX_IMAGE_LAYERS
    const canAddText = texts < MAX_TEXT_LAYERS

    return (
        <section aria-labelledby="design-layers-title" className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
                <h3 id="design-layers-title" className="text-sm font-semibold text-ink">
                    Capas
                </h3>
                <span className={FIELD_HINT_CLASS}>
                    {images}/{MAX_IMAGE_LAYERS} imágenes · {texts}/{MAX_TEXT_LAYERS} textos
                </span>
            </div>
            {layers.length ? (
                <ul className="space-y-1.5">
                    {[...layers].reverse().map((layer) => {
                        const index = layers.indexOf(layer)
                        const label = layerLabel(layers, layer)
                        const isSelected = layer.id === selectedId
                        return (
                            <li
                                key={layer.id}
                                className={cn(
                                    'flex items-center gap-1 rounded-2xl border-2 bg-white p-1.5 transition',
                                    isSelected ? 'border-blush-400' : 'border-line',
                                )}
                            >
                                <button
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => onSelect(layer.id)}
                                    disabled={disabled}
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none"
                                >
                                    <Thumbnail layer={layer} />
                                    <span
                                        className={cn(
                                            'min-w-0 truncate text-sm',
                                            isSelected ? 'font-semibold text-ink' : 'text-ink-soft',
                                        )}
                                    >
                                        {label}
                                    </span>
                                </button>
                                <IconButton
                                    label={`Subir ${label}`}
                                    onClick={() => onMove(layer.id, 1)}
                                    disabled={disabled || index === layers.length - 1}
                                >
                                    <ArrowUp aria-hidden="true" className="size-4" />
                                </IconButton>
                                <IconButton
                                    label={`Bajar ${label}`}
                                    onClick={() => onMove(layer.id, -1)}
                                    disabled={disabled || index === 0}
                                >
                                    <ArrowDown aria-hidden="true" className="size-4" />
                                </IconButton>
                                <IconButton
                                    label={`Duplicar ${label}`}
                                    onClick={() => onDuplicate(layer.id)}
                                    disabled={
                                        disabled ||
                                        (layer.type === 'image' ? !canAddImage : !canAddText)
                                    }
                                >
                                    <Copy aria-hidden="true" className="size-4" />
                                </IconButton>
                                <IconButton
                                    label={`Eliminar ${label}`}
                                    onClick={() => onDelete(layer.id)}
                                    disabled={disabled}
                                    className="hover:text-blush-700"
                                >
                                    <Trash2 aria-hidden="true" className="size-4" />
                                </IconButton>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<ImagePlus aria-hidden="true" className="size-4" />}
                    onClick={onAddImage}
                    disabled={disabled || !canAddImage}
                >
                    Agregar imagen
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Type aria-hidden="true" className="size-4" />}
                    onClick={onAddText}
                    disabled={disabled || !canAddText}
                >
                    Agregar texto
                </Button>
            </div>
        </section>
    )
}
