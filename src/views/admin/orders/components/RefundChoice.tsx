import type { RefundStatus } from '@/@types/order'
import { Input } from '@/components/ui'
import { FIELD_LABEL_CLASS } from '@/components/ui/field.styles'
import { cn } from '@/utils/cn'

const OPTIONS: { value: RefundStatus; label: string; hint: string }[] = [
    { value: 'NO_APLICA', label: 'No', hint: 'No hay dinero que devolver.' },
    {
        value: 'PENDIENTE',
        label: 'Sí, está pendiente',
        hint: 'Quedará marcado hasta que registres el reembolso.',
    },
    {
        value: 'REEMBOLSADO',
        label: 'Sí, ya se lo devolví',
        hint: 'Anota la referencia si la tienes.',
    },
]

export interface RefundChoiceProps {
    value: RefundStatus | null
    onChange: (value: RefundStatus) => void
    reference: string
    onReferenceChange: (value: string) => void
}

/** "¿Hay que devolver dinero al cliente?" when cancelling an order with a payment. */
export function RefundChoice({ value, onChange, reference, onReferenceChange }: RefundChoiceProps) {
    return (
        <fieldset className="space-y-2">
            <legend className={cn(FIELD_LABEL_CLASS, 'mb-2')}>
                ¿Hay que devolver dinero al cliente?
            </legend>
            {OPTIONS.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-white px-4 py-3 transition',
                        value === option.value
                            ? 'border-brand-400'
                            : 'border-line hover:border-brand-200',
                    )}
                >
                    <input
                        type="radio"
                        name="refundStatus"
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        className="mt-0.5 size-4 shrink-0 accent-brand-500"
                    />
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{option.label}</span>
                        <span className="block text-xs text-ink-soft">{option.hint}</span>
                    </span>
                </label>
            ))}
            {value === 'REEMBOLSADO' ? (
                <Input
                    label="Referencia del reembolso"
                    optional
                    maxLength={60}
                    inputMode="numeric"
                    autoComplete="off"
                    value={reference}
                    onChange={(event) => onReferenceChange(event.target.value)}
                />
            ) : null}
        </fieldset>
    )
}
