import { useId, useState } from 'react'

import type { AdminOrder } from '@/@types/order'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui'
import { formatBolivares } from '@/utils/formatBolivares'
import { useRecordPayment } from '@/views/admin/hooks/useAdminOrders'
import { PaymentForm } from '@/views/order/components/PaymentForm'

/**
 * "Registrar pago manualmente": the customer sent the proof by WhatsApp. Same form as the
 * customer's; the order goes to "Pendiente por verificación" and is confirmed as usual.
 */
export function ManualPaymentAction({ order }: { order: AdminOrder }) {
    const recordPayment = useRecordPayment(order.code)
    const [isOpen, setIsOpen] = useState(false)
    const formId = useId()

    const open = () => {
        recordPayment.reset()
        setIsOpen(true)
    }

    return (
        <>
            <Button variant="secondary" size="sm" onClick={open}>
                Registrar pago manualmente
            </Button>
            <ConfirmDialog
                isOpen={isOpen}
                size="lg"
                title="Registrar pago manualmente"
                description={
                    <>
                        Para un comprobante que el cliente envió por WhatsApp. El pedido pasará a
                        «Pendiente por verificación» y luego lo confirmas como siempre. Monto del
                        pedido: {formatBolivares(order.totals.totalBs)} (fijado al crearlo).
                        {order.status === 'EXPIRADO'
                            ? ' El pedido está expirado: se toma otra vez el stock que haya.'
                            : ''}
                    </>
                }
                confirmLabel="Registrar pago"
                cancelLabel="Volver"
                confirmVariant="primary"
                isLoading={recordPayment.isPending}
                onConfirm={() => {
                    const form = document.getElementById(formId)
                    if (form instanceof HTMLFormElement) form.requestSubmit()
                }}
                onClose={() => setIsOpen(false)}
            >
                <PaymentForm
                    formId={formId}
                    createdAt={order.createdAt}
                    totalBs={order.totals.totalBs}
                    referenceHint="Los encuentras al final del número de referencia del comprobante del cliente."
                    onSubmit={async (input) => {
                        await recordPayment.mutateAsync(input)
                        setIsOpen(false)
                    }}
                />
            </ConfirmDialog>
        </>
    )
}
