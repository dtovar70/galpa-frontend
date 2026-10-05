import type { PaymentMethod } from '@/@types/order'
import { PaymentMethodIconGlyph } from '@/components/shared/PaymentMethodIconGlyph'
import { isBolivarMethod } from '@/constants/payment.constant'
import { cn } from '@/utils/cn'
import { formatBolivares, usdToBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { usePaymentMethods } from '@/utils/hooks/usePaymentMethods'

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
    // Names, help texts and icons come from the payment methods catalog.
    const catalog = usePaymentMethods()

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
                    const info = catalog.method(method)
                    const isSelected = value === method
                    const amount = isBolivarMethod(method)
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
                                <PaymentMethodIconGlyph name={info?.icon} className="size-5" />
                            </span>
                            <span className="min-w-0 space-y-0.5">
                                <span className="block font-semibold text-ink">
                                    {catalog.label(method)}
                                </span>
                                {info?.description ? (
                                    <span className="block text-xs text-ink-soft">
                                        {info.description}
                                    </span>
                                ) : null}
                                <span className="block text-sm font-bold text-ink tabular-nums">
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
