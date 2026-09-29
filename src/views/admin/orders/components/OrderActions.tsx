import { useState } from 'react'

import type {
    AdminOrder,
    AllowedTransition,
    OrderStatus,
    RefundStatus,
    StockConflictLine,
} from '@/@types/order'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Alert, Button, Textarea, type ButtonProps } from '@/components/ui'
import { getErrorMessage, isApiError } from '@/services/errors'
import { formatBolivares } from '@/utils/formatBolivares'
import { useTransitionOrder } from '@/views/admin/hooks/useAdminOrders'
import { CheckboxField } from '@/views/admin/orders/components/CheckboxField'
import { ManualPaymentAction } from '@/views/admin/orders/components/ManualPaymentAction'
import { MarkRefundAction } from '@/views/admin/orders/components/MarkRefundAction'
import { RefundChoice } from '@/views/admin/orders/components/RefundChoice'
import { describeStockLine } from '@/views/admin/orders/utils/stockConflict'

const STOCK_INSUFFICIENT = 'STOCK_INSUFFICIENT'

interface ActionCopy {
    /** Omitted when the button is simply the target status's name (from the status catalog). */
    button?: string
    variant: NonNullable<ButtonProps['variant']>
    title: string
    confirm: string
    /** Label of the note field; the field only shows for actions that take a note. */
    noteLabel?: string
    noteHint?: string
}

const ACTIONS: Partial<Record<OrderStatus, ActionCopy>> = {
    PENDIENTE_PAGO: {
        button: 'Reactivar pedido',
        variant: 'secondary',
        title: '¿Reactivar este pedido?',
        confirm: 'Reactivar pedido',
        noteLabel: 'Nota interna',
        noteHint: 'Opcional. Queda en el historial, por ejemplo: el cliente pidió más tiempo.',
    },
    PAGO_VERIFICADO: {
        button: 'Confirmar pago recibido',
        variant: 'primary',
        title: '¿Confirmar el pago?',
        confirm: 'Sí, lo recibí',
    },
    PAGO_RECHAZADO: {
        button: 'Rechazar pago',
        variant: 'secondary',
        title: '¿Rechazar este pago?',
        confirm: 'Rechazar pago',
        noteLabel: 'Motivo del rechazo',
        noteHint: 'El cliente lo verá y podrá enviar el comprobante otra vez.',
    },
    EN_PRODUCCION: {
        button: 'Marcar en producción',
        variant: 'primary',
        title: '¿Pasar a producción?',
        confirm: 'Marcar en producción',
    },
    LISTO_PARA_ENTREGA: {
        variant: 'primary',
        title: '¿El pedido está listo?',
        confirm: 'Marcar como listo',
    },
    ENVIADO: {
        variant: 'primary',
        title: '¿Marcar como enviado?',
        confirm: 'Marcar como enviado',
        noteLabel: 'Agencia y número de guía',
        noteHint: 'Opcional. El cliente lo verá en su pedido, por ejemplo: MRW, guía 123456.',
    },
    ENTREGADO: {
        variant: 'primary',
        title: '¿Marcar como entregado?',
        confirm: 'Marcar como entregado',
    },
    CANCELADO: {
        button: 'Cancelar pedido',
        variant: 'danger',
        title: '¿Cancelar este pedido?',
        confirm: 'Cancelar pedido',
        noteLabel: 'Motivo de la cancelación',
        noteHint: 'El cliente lo verá en su pedido.',
    },
}

function description(order: AdminOrder, action: AllowedTransition) {
    const payment = order.payments.find((candidate) => candidate.status === 'PENDIENTE')
    switch (action.to) {
        case 'PENDIENTE_PAGO':
            return 'Las unidades se toman otra vez del inventario y el cliente tendrá un plazo nuevo para pagar. El monto en Bs sigue siendo el del pedido.'
        case 'PAGO_VERIFICADO':
            return payment
                ? `Confirma que en el banco entró ${formatBolivares(payment.amountBs)} con la referencia ${payment.reference}${payment.amountMismatch ? ` (se esperaban ${formatBolivares(payment.expectedBs)})` : ''}. El cliente verá su pago como confirmado.`
                : 'El cliente verá su pago como confirmado.'
        case 'PAGO_RECHAZADO':
            return 'El pedido vuelve a esperar un comprobante válido.'
        case 'CANCELADO':
            return action.restoresStock
                ? 'Las unidades vuelven al inventario. No se puede deshacer.'
                : 'El pedido ya salió del taller, así que el inventario no cambia. No se puede deshacer.'
        default:
            return `El pedido pasará a «${action.label}» y el cliente lo verá en su página.`
    }
}

function StockLines({ lines }: { lines: readonly StockConflictLine[] }) {
    return (
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {lines.map((line) => (
                <li key={`${line.productId ?? ''}-${line.variantId ?? ''}-${line.productName}`}>
                    {describeStockLine(line)}
                </li>
            ))}
        </ul>
    )
}

function isStockLine(value: unknown): value is StockConflictLine {
    if (typeof value !== 'object' || value === null) return false
    const line = value as Record<string, unknown>
    return typeof line.productName === 'string' && typeof line.requested === 'number'
}

/**
 * One button per allowed transition (each asks for confirmation, and a note or an answer when
 * needed), plus "Registrar pago manualmente" and "Marcar reembolso realizado" when they apply.
 */
export function OrderActions({ order }: { order: AdminOrder }) {
    const transition = useTransitionOrder(order.code)
    const [pending, setPending] = useState<AllowedTransition | null>(null)
    const [note, setNote] = useState('')
    const [acknowledged, setAcknowledged] = useState(false)
    const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null)
    const [refundReference, setRefundReference] = useState('')

    const actions = order.allowedTransitions.filter(
        (action) => !action.requiresPayment && ACTIONS[action.to],
    )
    const canRecordPayment = order.allowedTransitions.some((action) => action.requiresPayment)
    const refundPending = order.refund?.status === 'PENDIENTE'
    if (actions.length === 0 && !canRecordPayment && !refundPending) return null

    const copy = pending ? ACTIONS[pending.to] : undefined
    const openConflict =
        order.stockConflict && !order.stockConflict.resolvedAt ? order.stockConflict : null
    const needsAcknowledgement = pending?.to === 'PAGO_VERIFICADO' && openConflict !== null
    const asksRefund =
        pending?.to === 'CANCELADO' &&
        order.payments.some(
            (payment) => payment.status === 'PENDIENTE' || payment.status === 'VERIFICADO',
        )
    // A reactivation refused for lack of stock can be forced once the admin acknowledges it.
    const missingStock =
        pending?.reactivates &&
        isApiError(transition.error, 409) &&
        transition.error.code === STOCK_INSUFFICIENT &&
        Array.isArray(transition.error.payload.lines)
            ? transition.error.payload.lines.filter(isStockLine)
            : null

    const noteMissing = Boolean(pending?.requiresReason) && note.trim() === ''
    const blocked =
        noteMissing ||
        (needsAcknowledgement && !acknowledged) ||
        (asksRefund && refundStatus === null) ||
        (missingStock !== null && !acknowledged)

    const open = (action: AllowedTransition) => {
        transition.reset()
        setNote('')
        setAcknowledged(false)
        setRefundStatus(null)
        setRefundReference('')
        setPending(action)
    }

    const confirm = () => {
        if (!pending || blocked) return
        transition.mutate(
            {
                to: pending.to,
                note: note.trim() || undefined,
                acknowledgeStockConflict: needsAcknowledgement ? true : undefined,
                forceStock: missingStock ? true : undefined,
                refundStatus: asksRefund ? (refundStatus ?? undefined) : undefined,
                refundReference:
                    asksRefund && refundStatus === 'REEMBOLSADO'
                        ? refundReference.trim()
                        : undefined,
            },
            { onSuccess: () => setPending(null) },
        )
    }

    const error =
        transition.isError && !missingStock ? getErrorMessage(transition.error) : undefined

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                    const actionCopy = ACTIONS[action.to]
                    if (!actionCopy) return null
                    return (
                        <Button
                            key={action.to}
                            variant={actionCopy.variant}
                            size="sm"
                            onClick={() => open(action)}
                        >
                            {actionCopy.button ?? action.label}
                        </Button>
                    )
                })}
                {canRecordPayment ? <ManualPaymentAction order={order} /> : null}
                {refundPending ? <MarkRefundAction order={order} /> : null}
            </div>

            <ConfirmDialog
                isOpen={pending !== null}
                title={copy?.title ?? ''}
                description={pending ? description(order, pending) : undefined}
                confirmLabel={missingStock ? 'Reactivar de todas formas' : copy?.confirm}
                cancelLabel="Volver"
                confirmVariant={
                    copy?.variant === 'danger' || pending?.to === 'PAGO_RECHAZADO'
                        ? 'danger'
                        : 'primary'
                }
                confirmDisabled={blocked}
                isLoading={transition.isPending}
                error={error}
                onConfirm={confirm}
                onClose={() => setPending(null)}
            >
                {needsAcknowledgement && openConflict ? (
                    <div className="space-y-3">
                        <Alert>
                            <span className="font-semibold">Stock insuficiente:</span>
                            <StockLines lines={openConflict.lines} />
                            <span className="mt-1 block font-normal">
                                Al confirmar se descuenta lo que haya disponible (nunca por debajo
                                de 0) y lo que falte queda anotado en el historial.
                            </span>
                        </Alert>
                        <CheckboxField checked={acknowledged} onChange={setAcknowledged}>
                            Entiendo que falta stock
                        </CheckboxField>
                    </div>
                ) : null}

                {missingStock ? (
                    <div className="space-y-3">
                        <Alert>
                            <span className="font-semibold">
                                No hay stock suficiente para reactivar el pedido:
                            </span>
                            <StockLines lines={missingStock} />
                        </Alert>
                        <CheckboxField
                            checked={acknowledged}
                            onChange={setAcknowledged}
                            hint="Se toma lo que haya y el pedido queda marcado con stock insuficiente."
                        >
                            Reactivar de todas formas (entiendo que falta stock)
                        </CheckboxField>
                    </div>
                ) : null}

                {asksRefund ? (
                    <RefundChoice
                        value={refundStatus}
                        onChange={setRefundStatus}
                        reference={refundReference}
                        onReferenceChange={setRefundReference}
                    />
                ) : null}

                {copy?.noteLabel ? (
                    <Textarea
                        label={copy.noteLabel}
                        optional={!pending?.requiresReason}
                        rows={3}
                        maxLength={500}
                        hint={copy.noteHint}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                ) : null}
            </ConfirmDialog>
        </>
    )
}
