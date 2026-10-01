import { useId, useState, type ReactNode } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Check } from 'lucide-react'

import type { DesignTextStyle, TextAlign, TextOutline } from '@/@types/design'
import { Textarea } from '@/components/ui'
import { FIELD_HINT_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field.styles'
import {
    DESIGN_FONTS,
    MAX_TEXT_LENGTH,
    TEXT_ALIGN_OPTIONS,
    TEXT_COLORS,
    TEXT_OUTLINE_OPTIONS,
} from '@/constants/design.constant'
import { cn } from '@/utils/cn'
import { isDarkHex } from '@/utils/color'
import { textProblem } from '@/utils/designText'

export interface DesignTextControlsProps {
    value: DesignTextStyle
    onChange: (change: Partial<DesignTextStyle>) => void
    disabled?: boolean
}

const HEX = /^#[0-9a-f]{6}$/i
const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight } as const

/** A row of mutually exclusive buttons (radio group). */
function Segmented<T extends string>({
    label,
    options,
    value,
    onChange,
    disabled,
    icon,
}: {
    label: string
    options: readonly { value: T; label: string }[]
    value: T
    onChange: (value: T) => void
    disabled?: boolean
    icon?: (value: T) => ReactNode
}) {
    const labelId = useId()
    return (
        <div className="space-y-1.5">
            <p id={labelId} className={FIELD_LABEL_CLASS}>
                {label}
            </p>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-blush-50 p-1"
            >
                {options.map((option) => {
                    const checked = option.value === value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            disabled={disabled}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                'flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-sm transition focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none disabled:opacity-50',
                                checked
                                    ? 'bg-white font-semibold text-ink shadow-soft'
                                    : 'text-ink-soft hover:text-ink',
                            )}
                        >
                            {icon?.(option.value)}
                            <span className={cn(icon && 'sr-only sm:not-sr-only')}>
                                {option.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/** The selected text layer: what it says, its font, color, outline and alignment. */
export function DesignTextControls({ value, onChange, disabled = false }: DesignTextControlsProps) {
    const fontLabelId = useId()
    const colorLabelId = useId()
    const customId = useId()
    const problem = textProblem(value.content)
    const isPreset = TEXT_COLORS.some((color) => color.hex === value.color.toUpperCase())
    const [hexDraft, setHexDraft] = useState(value.color.toUpperCase())
    const [lastColor, setLastColor] = useState(value.color)
    // Follows the color when it changes from elsewhere (a swatch, another layer).
    if (lastColor !== value.color) {
        setLastColor(value.color)
        setHexDraft(value.color.toUpperCase())
    }

    return (
        <div className="space-y-4">
            <Textarea
                label="Tu texto"
                value={value.content}
                maxLength={MAX_TEXT_LENGTH}
                rows={2}
                showCount
                disabled={disabled}
                error={problem ?? undefined}
                hint="Hasta 2 líneas y 60 caracteres."
                onChange={(event) => onChange({ content: event.target.value })}
            />

            <div className="space-y-1.5">
                <p id={fontLabelId} className={FIELD_LABEL_CLASS}>
                    Fuente
                </p>
                <div
                    role="radiogroup"
                    aria-labelledby={fontLabelId}
                    className="grid grid-cols-2 gap-1.5"
                >
                    {DESIGN_FONTS.map((font) => {
                        const checked = font.id === value.font
                        return (
                            <button
                                key={font.id}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                aria-label={font.label}
                                disabled={disabled}
                                onClick={() => onChange({ font: font.id })}
                                className={cn(
                                    'truncate rounded-xl border-2 bg-white px-2 py-1.5 text-lg leading-tight transition focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none disabled:opacity-50',
                                    checked
                                        ? 'border-blush-400 text-ink'
                                        : 'border-line text-ink-soft hover:border-blush-200',
                                )}
                                style={{
                                    fontFamily: `"${font.family}", ${font.fallback}`,
                                    fontWeight: font.weight,
                                }}
                            >
                                {font.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-1.5">
                <p id={colorLabelId} className={FIELD_LABEL_CLASS}>
                    Color del texto
                </p>
                <div
                    role="radiogroup"
                    aria-labelledby={colorLabelId}
                    className="flex flex-wrap gap-2"
                >
                    {TEXT_COLORS.map((color) => {
                        const checked = color.hex === value.color.toUpperCase()
                        return (
                            <button
                                key={color.hex}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                aria-label={color.name}
                                title={color.name}
                                disabled={disabled}
                                onClick={() => onChange({ color: color.hex })}
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-full border border-line shadow-soft ring-offset-2 ring-offset-cream transition focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none disabled:opacity-50',
                                    checked
                                        ? 'ring-2 ring-blush-500'
                                        : 'hover:ring-2 hover:ring-blush-200',
                                )}
                                style={{ backgroundColor: color.hex }}
                            >
                                {checked ? (
                                    <Check
                                        aria-hidden="true"
                                        className={cn(
                                            'size-4',
                                            isDarkHex(color.hex) ? 'text-white' : 'text-ink',
                                        )}
                                    />
                                ) : null}
                            </button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor={customId} className={FIELD_HINT_CLASS}>
                        Otro color
                    </label>
                    <input
                        type="color"
                        aria-label="Elegir otro color"
                        value={HEX.test(value.color) ? value.color.toLowerCase() : '#000000'}
                        disabled={disabled}
                        onChange={(event) => onChange({ color: event.target.value.toUpperCase() })}
                        className={cn(
                            'size-8 cursor-pointer rounded-full border border-line bg-white p-0.5',
                            !isPreset && 'ring-2 ring-blush-500 ring-offset-2 ring-offset-cream',
                        )}
                    />
                    <input
                        id={customId}
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={7}
                        value={hexDraft}
                        disabled={disabled}
                        onChange={(event) => {
                            const next = event.target.value.trim().toUpperCase()
                            const withHash = next.startsWith('#') ? next : `#${next}`
                            setHexDraft(withHash)
                            if (HEX.test(withHash)) onChange({ color: withHash })
                        }}
                        className="h-9 w-24 rounded-full border-2 border-line bg-white px-3 font-mono text-sm text-ink uppercase focus-visible:border-blush-300 focus-visible:outline-none"
                    />
                </div>
            </div>

            <Segmented<TextOutline>
                label="Borde"
                options={TEXT_OUTLINE_OPTIONS}
                value={value.outline}
                onChange={(outline) => onChange({ outline })}
                disabled={disabled}
            />
            <Segmented<TextAlign>
                label="Alineación"
                options={TEXT_ALIGN_OPTIONS}
                value={value.align}
                onChange={(align) => onChange({ align })}
                disabled={disabled}
                icon={(align) => {
                    const Icon = ALIGN_ICONS[align]
                    return <Icon aria-hidden="true" className="size-4" />
                }}
            />
        </div>
    )
}
