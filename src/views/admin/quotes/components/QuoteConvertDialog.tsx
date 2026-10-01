import { useState } from 'react'
import { useNavigate } from 'react-router'

import { PAYMENT_METHODS, type DeliveryMethod, type PaymentMethod } from '@/@types/order'
import type { Quote } from '@/@types/quote'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Input, Select, type SelectOption } from '@/components/ui'
import { DELIVERY_METHOD_LABELS } from '@/constants/order.constant'
import { paymentMethodLabel } from '@/constants/payment.constant'
import { adminOrderPath } from '@/constants/route.constant'
import { getErrorMessage } from '@/services/errors'
import { useConvertQuote } from '@/views/admin/hooks/useAdminQuotes'

const DELIVERY_METHODS: readonly DeliveryMethod[] = ['delivery', 'pickup']

const DELIVERY_OPTIONS: SelectOption[] = DELIVERY_METHODS.map((method) => ({
    value: method,
    label: DELIVERY_METHOD_LABELS[method],
}))

const PAYMENT_OPTIONS: SelectOption[] = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: paymentMethodLabel(method),
}))

export interface QuoteConvertDialogProps {
    quote: Quote
    isOpen: boolean
    onClose: () => void
}

/**
 * "Convertir en pedido": creates a pending-payment order with the quote's lines, then opens it.
 * Delivery orders need an address.
 */
export function QuoteConvertDialog({ quote, isOpen, onClose }: QuoteConvertDialogProps) {
    const convert = useConvertQuote(quote.code)
    const navigate = useNavigate()
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAGO_MOVIL')
    const [city, setCity] = useState('')
    const [address, setAddress] = useState('')
    const needsAddress = deliveryMethod === 'delivery'
    const isMissingAddress = needsAddress && (city.trim().length < 2 || address.trim().length < 6)
    const freeLines = quote.items.filter((item) => item.productId === null).length

    const close = () => {
        convert.reset()
        onClose()
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            size="lg"
            title={`Convertir ${quote.code} en pedido`}
            description={
                <>
                    Se crea un pedido «Pendiente de pago» con las líneas de la cotización y el
                    cliente recibe el enlace para pagarlo.
                    {freeLines > 0
                        ? ` Las ${freeLines === 1 ? 'línea libre se agrega' : `${freeLines} líneas libres se agregan`} como servicio, sin stock.`
                        : ''}
                </>
            }
            confirmLabel="Crear pedido"
            confirmVariant="primary"
            confirmDisabled={isMissingAddress}
            isLoading={convert.isPending}
            error={convert.isError ? getErrorMessage(convert.error) : undefined}
            onConfirm={() =>
                convert.mutate(
                    {
                        deliveryMethod,
                        paymentMethod,
                        city: city.trim() || undefined,
                        address: address.trim() || undefined,
                    },
                    {
                        onSuccess: (result) => {
                            close()
                            void navigate(adminOrderPath(result.orderCode))
                        },
                    },
                )
            }
            onClose={close}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <Select
                    label="Entrega"
                    options={DELIVERY_OPTIONS}
                    value={deliveryMethod}
                    onChange={(event) =>
                        setDeliveryMethod(
                            DELIVERY_METHODS.find((method) => method === event.target.value) ??
                                'delivery',
                        )
                    }
                />
                <Select
                    label="Método de pago"
                    options={PAYMENT_OPTIONS}
                    value={paymentMethod}
                    onChange={(event) =>
                        setPaymentMethod(
                            PAYMENT_METHODS.find((method) => method === event.target.value) ??
                                'PAGO_MOVIL',
                        )
                    }
                />
                <Input
                    label="Ciudad"
                    optional={!needsAddress}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                />
                <Input
                    label="Dirección"
                    optional={!needsAddress}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                />
            </div>
        </ConfirmDialog>
    )
}
