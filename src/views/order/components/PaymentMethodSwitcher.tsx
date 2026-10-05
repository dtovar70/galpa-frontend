import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'

import type { PaymentMethod, PublicOrder } from '@/@types/order'
import { Alert, Button, Select, type SelectOption } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { usePaymentMethods } from '@/utils/hooks/usePaymentMethods'
import { formatOrderAmount } from '@/utils/payment'

export interface PaymentMethodSwitcherProps {
    order: PublicOrder
    /** Methods the store offers now (the order's own one included). */
    methods: readonly PaymentMethod[]
    onChange: (method: PaymentMethod) => Promise<unknown>
}

/** "¿Prefieres pagar de otra forma?": switches the order's method before paying. */
export function PaymentMethodSwitcher({ order, methods, onChange }: PaymentMethodSwitcherProps) {
    const catalog = usePaymentMethods()
    const others = catalog.sort(methods.filter((method) => method !== order.paymentMethod))
    const [isOpen, setIsOpen] = useState(false)
    const [choice, setChoice] = useState<PaymentMethod | ''>('')
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (others.length === 0) return null

    const options: SelectOption[] = others.map((method) => ({
        value: method,
        label: `${catalog.label(method)} · ${formatOrderAmount(method, order.totals)}`,
    }))

    const save = async () => {
        if (!choice) return
        setIsSaving(true)
        setError(null)
        try {
            await onChange(choice)
            setIsOpen(false)
            setChoice('')
        } catch (failure) {
            setError(getErrorMessage(failure, 'No pudimos cambiar el método. Intenta de nuevo.'))
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                leadingIcon={<ArrowLeftRight aria-hidden="true" className="size-4" />}
            >
                ¿Prefieres pagar de otra forma?
            </Button>
        )
    }

    return (
        <div className="space-y-3 rounded-xl border border-line bg-page p-4">
            <Select
                label="Nuevo método de pago"
                placeholder="Elige un método"
                options={options}
                value={choice}
                onChange={(event) =>
                    setChoice(others.find((method) => method === event.target.value) ?? '')
                }
            />
            {error ? <Alert onDismiss={() => setError(null)}>{error}</Alert> : null}
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    onClick={() => void save()}
                    isLoading={isSaving}
                    disabled={!choice}
                >
                    Cambiar método
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    Cancelar
                </Button>
            </div>
        </div>
    )
}
