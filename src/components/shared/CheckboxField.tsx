import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'

import { FIELD_HINT_CLASS } from '@/components/ui/field.styles'

export interface CheckboxFieldProps {
    checked: boolean
    onChange: (checked: boolean) => void
    children: ReactNode
    hint?: string
    disabled?: boolean
}

/** A checkbox (native input, custom look) with its label, e.g. an acknowledgement a dialog needs before confirming. */
export function CheckboxField({ checked, onChange, children, hint, disabled }: CheckboxFieldProps) {
    const id = useId()
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3">
            {/*
              Drawn by hand instead of `accent-color`: browsers pick the tick color themselves
              (black on our pink), so the box is styled here and the tick is always white.
            */}
            <span className="relative mt-0.5 flex size-5 shrink-0">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.checked)}
                    aria-describedby={hint ? `${id}-hint` : undefined}
                    className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-ink/25 bg-white transition-colors checked:border-brand-700 checked:bg-brand-700 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Check
                    aria-hidden="true"
                    strokeWidth={3.5}
                    className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                />
            </span>
            <div className="min-w-0 space-y-1">
                <label htmlFor={id} className="text-sm font-semibold text-ink">
                    {children}
                </label>
                {hint ? (
                    <p id={`${id}-hint`} className={FIELD_HINT_CLASS}>
                        {hint}
                    </p>
                ) : null}
            </div>
        </div>
    )
}
