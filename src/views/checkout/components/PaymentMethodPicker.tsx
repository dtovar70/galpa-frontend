import type { PaymentMethod } from '@/@types/order'
import { PAYMENT_METHOD_ICONS, PAYMENT_METHOD_INFO } from '@/constants/payment.constant'
import { cn } from '@/utils/cn'
import { formatBolivares, usdToBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'

export interface PaymentMethodPickerProps {
    methods: readonly PaymentMethod[]
    value: PaymentMethod | undefined
    onChange: (method: PaymentMethod) => void
    /** Order total in USD. */
    total: number
    /** BCV rate for the bolívar methods; null while unknown. */
    rate: number | null
    error?: string
    disabled?: boolean
}

/** One card per payment method the store offers, with the amount in that method's currency. */
export function PaymentMethodPicker({
    methods,
    value,
    onChange,
    total,
    rate,
    error,
    disabled = false,
}: PaymentMethodPickerProps) {
    const errorId = 'payment-method-error'

    return (
        <fieldset
            className="space-y-3"
            disabled={disabled}
            aria-describedby={error ? errorId : undefined}
        >
            <legend className="mb-1 text-xl font-bold text-ink">Método de pago</legend>
            <p className="text-sm text-ink-soft">
                Pagas después de confirmar el pedido: te mostraremos los datos para hacerlo.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
                {methods.map((method) => {
                    const info = PAYMENT_METHOD_INFO[method]
                    const Icon = PAYMENT_METHOD_ICONS[method]
                    const isSelected = value === method
                    const amount =
                        info.currency === 'BS'
                            ? rate === null
                                ? 'En bolívares a tasa BCV'
                                : `≈ ${formatBolivares(usdToBolivares(total, rate))}`
                            : formatCurrency(total)
                    return (
                        <label
                            key={method}
                            className={cn(
                                'relative flex cursor-pointer gap-3 rounded-xl border bg-white p-4 transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500 has-[input:focus-visible]:ring-offset-2',
                                isSelected
                                    ? 'border-brand-500 ring-1 ring-brand-500'
                                    : 'border-line-strong hover:border-ink/40',
                            )}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={method}
                                checked={isSelected}
                                onChange={() => onChange(method)}
                                className="sr-only"
                            />
                            <span
                                className={cn(
                                    'grid size-10 shrink-0 place-items-center rounded-lg',
                                    isSelected ? 'bg-brand-600 text-white' : 'bg-mist text-ink',
                                )}
                            >
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <span className="min-w-0 space-y-0.5">
                                <span className="block font-semibold text-ink">{info.label}</span>
                                <span className="block text-xs text-ink-soft">
                                    {info.description}
                                </span>
                                <span className="block font-tech text-sm font-bold text-ink">
                                    {amount}
                                </span>
                            </span>
                        </label>
                    )
                })}
            </div>

            {error ? (
                <p id={errorId} role="alert" className="text-sm font-medium text-danger-700">
                    {error}
                </p>
            ) : null}
        </fieldset>
    )
}
