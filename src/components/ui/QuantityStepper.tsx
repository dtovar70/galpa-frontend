import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'

import { cn } from '@/utils/cn'

export interface QuantityStepperProps {
    value: number
    onChange: (quantity: number) => void
    min?: number
    max?: number
    label?: string
    disabled?: boolean
    className?: string
}

/** 36px visible; the pseudo-element grows the hit area to 44px for thumbs. */
const stepButtonClass =
    "relative flex size-9 items-center justify-center rounded-full text-ink transition after:absolute after:-inset-1 after:content-[''] hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"

export function QuantityStepper({
    value,
    onChange,
    min = 1,
    max = 99,
    label = 'Cantidad',
    disabled = false,
    className,
}: QuantityStepperProps) {
    const outputId = useId()

    const clamp = (next: number) => Math.min(max, Math.max(min, next))

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded-full border border-line bg-white p-1',
                className,
            )}
        >
            <button
                type="button"
                className={stepButtonClass}
                onClick={() => onChange(clamp(value - 1))}
                disabled={disabled || value <= min}
                aria-label={`Quitar una unidad de ${label.toLowerCase()}`}
                aria-controls={outputId}
            >
                <Minus aria-hidden="true" className="size-4" />
            </button>

            <output
                id={outputId}
                aria-label={label}
                className="min-w-8 text-center text-base font-semibold tabular-nums"
            >
                {value}
            </output>

            <button
                type="button"
                className={stepButtonClass}
                onClick={() => onChange(clamp(value + 1))}
                disabled={disabled || value >= max}
                aria-label={`Agregar una unidad de ${label.toLowerCase()}`}
                aria-controls={outputId}
            >
                <Plus aria-hidden="true" className="size-4" />
            </button>
        </div>
    )
}
