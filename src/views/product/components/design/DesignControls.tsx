import { useId, type ReactNode } from 'react'
import { Crosshair, ImageUp, Maximize2, Minimize2, RotateCcw, RotateCw } from 'lucide-react'

import type { DesignPlacement } from '@/@types/design'
import { Button } from '@/components/ui'
import { FIELD_LABEL_CLASS } from '@/components/ui/field.styles'
import { MAX_SCALE, MIN_SCALE, normalizePlacement } from '@/utils/designGeometry'

export interface DesignControlsProps {
    placement: DesignPlacement
    onChange: (placement: DesignPlacement) => void
    onCenter: () => void
    /** Image layers only: "Ajustar al área", "Llenar el área", "Cambiar imagen". */
    onFit?: () => void
    onFill?: () => void
    onReplace?: () => void
    disabled?: boolean
}

function RangeField({
    label,
    value,
    display,
    min,
    max,
    step,
    onChange,
    disabled,
}: {
    label: string
    value: number
    display: string
    min: number
    max: number
    step: number
    onChange: (value: number) => void
    disabled?: boolean
}) {
    const id = useId()
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor={id} className={FIELD_LABEL_CLASS}>
                    {label}
                </label>
                <span className="text-sm font-semibold text-ink-soft tabular-nums">{display}</span>
            </div>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                aria-valuetext={display}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-8 w-full cursor-pointer accent-blush-500 disabled:cursor-not-allowed"
            />
        </div>
    )
}

function ToolButton({
    icon,
    children,
    onClick,
    disabled,
}: {
    icon: ReactNode
    children: ReactNode
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <Button
            variant="secondary"
            size="sm"
            leadingIcon={icon}
            onClick={onClick}
            disabled={disabled}
            className="justify-start px-3"
        >
            {children}
        </Button>
    )
}

/**
 * Size and rotation sliders plus the quick placements of the selected layer, for touch and
 * keyboard alike.
 */
export function DesignControls({
    placement,
    onChange,
    onCenter,
    onFit,
    onFill,
    onReplace,
    disabled = false,
}: DesignControlsProps) {
    const set = (change: Partial<DesignPlacement>) =>
        onChange(normalizePlacement({ ...placement, ...change }))
    const percent = Math.round(placement.scale * 100)
    const degrees = Math.round(placement.rotation)

    return (
        <div className="space-y-4">
            <RangeField
                label="Tamaño"
                value={percent}
                display={`${percent} %`}
                min={Math.round(MIN_SCALE * 100)}
                max={Math.round(MAX_SCALE * 100)}
                step={1}
                disabled={disabled}
                onChange={(value) => set({ scale: value / 100 })}
            />
            <div className="space-y-2">
                <RangeField
                    label="Rotación"
                    value={degrees}
                    display={`${degrees}°`}
                    min={-180}
                    max={180}
                    step={1}
                    disabled={disabled}
                    onChange={(value) => set({ rotation: value })}
                />
                <div className="grid grid-cols-2 gap-2">
                    <ToolButton
                        icon={<RotateCcw aria-hidden="true" className="size-4" />}
                        onClick={() => set({ rotation: placement.rotation - 90 })}
                        disabled={disabled}
                    >
                        Girar −90°
                    </ToolButton>
                    <ToolButton
                        icon={<RotateCw aria-hidden="true" className="size-4" />}
                        onClick={() => set({ rotation: placement.rotation + 90 })}
                        disabled={disabled}
                    >
                        Girar +90°
                    </ToolButton>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <ToolButton
                    icon={<Crosshair aria-hidden="true" className="size-4" />}
                    onClick={onCenter}
                    disabled={disabled}
                >
                    Centrar
                </ToolButton>
                {onFit ? (
                    <ToolButton
                        icon={<Minimize2 aria-hidden="true" className="size-4" />}
                        onClick={onFit}
                        disabled={disabled}
                    >
                        Ajustar al área
                    </ToolButton>
                ) : null}
                {onFill ? (
                    <ToolButton
                        icon={<Maximize2 aria-hidden="true" className="size-4" />}
                        onClick={onFill}
                        disabled={disabled}
                    >
                        Llenar el área
                    </ToolButton>
                ) : null}
                {onReplace ? (
                    <ToolButton
                        icon={<ImageUp aria-hidden="true" className="size-4" />}
                        onClick={onReplace}
                        disabled={disabled}
                    >
                        Cambiar imagen
                    </ToolButton>
                ) : null}
            </div>
        </div>
    )
}
