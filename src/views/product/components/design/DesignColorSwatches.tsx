import { useId, type KeyboardEvent } from 'react'

import { productNounFor, withArticle, type DesignTemplate } from '@/constants/design.constant'
import { cn } from '@/utils/cn'

type TemplateColor = NonNullable<DesignTemplate['color']>

export interface DesignColorSwatchesProps {
    colors: TemplateColor[]
    selectedId: string
    onChange: (id: string) => void
    /** Names the product in the label: "Color de la taza", "Color de la franela"… */
    category: string
    disabled?: boolean
}

const NEXT_KEYS: Record<string, number> = {
    ArrowRight: 1,
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowUp: -1,
}

/**
 * "Color de la taza / franela…": one round swatch per garment color (a radio group: arrows move the
 * choice). Switching only swaps the photo; the image keeps its place on the print area.
 */
export function DesignColorSwatches({
    colors,
    selectedId,
    onChange,
    category,
    disabled = false,
}: DesignColorSwatchesProps) {
    const labelId = useId()
    const selected = colors.find((color) => color.id === selectedId) ?? colors[0]

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = NEXT_KEYS[event.key]
        if (step === undefined || disabled) return
        event.preventDefault()
        const index = colors.findIndex((color) => color.id === selected?.id)
        const next = colors[(index + step + colors.length) % colors.length]
        if (!next) return
        onChange(next.id)
        const group = event.currentTarget
        requestAnimationFrame(() =>
            group.querySelector<HTMLButtonElement>(`[data-color-id="${next.id}"]`)?.focus(),
        )
    }

    return (
        <div className="space-y-2">
            <p id={labelId} className="text-sm font-semibold text-ink">
                Color de {withArticle(productNounFor(category))}:{' '}
                <span className="font-normal text-ink-soft">{selected?.name}</span>
            </p>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                onKeyDown={onKeyDown}
                className="flex flex-wrap gap-3"
            >
                {colors.map((color) => {
                    const isSelected = color.id === selected?.id
                    return (
                        <button
                            key={color.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={color.name}
                            title={color.name}
                            data-color-id={color.id}
                            tabIndex={isSelected ? 0 : -1}
                            disabled={disabled}
                            onClick={() => onChange(color.id)}
                            className="group flex w-14 flex-col items-center gap-1 rounded-xl focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-9 rounded-full border border-line shadow-soft ring-offset-2 ring-offset-cream transition',
                                    isSelected
                                        ? 'ring-2 ring-blush-500'
                                        : 'group-hover:ring-2 group-hover:ring-blush-200',
                                )}
                                style={{ backgroundColor: color.hex }}
                            />
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'w-full truncate text-center text-[11px] leading-tight',
                                    isSelected ? 'font-semibold text-ink' : 'text-ink-soft',
                                )}
                            >
                                {color.name}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
