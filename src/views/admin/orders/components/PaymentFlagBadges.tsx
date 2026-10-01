import { AlarmClock, AlertTriangle, Copy } from 'lucide-react'

import type { OrderPayment } from '@/@types/order'
import { Badge } from '@/components/ui'
import { cn } from '@/utils/cn'
import { formatPaymentDifference, paymentDifference } from '@/utils/payment'

export interface PaymentFlagBadgesProps {
    payment: Pick<
        OrderPayment,
        | 'method'
        | 'duplicateReference'
        | 'amountBs'
        | 'amountUsd'
        | 'expectedBs'
        | 'expectedUsd'
        | 'late'
    >
    /** `contents` lets the badges join a surrounding wrapping list instead of their own. */
    className?: string
}

/** Warnings about a payment proof: late, reference already used elsewhere, amount off. */
export function PaymentFlagBadges({ payment, className }: PaymentFlagBadgesProps) {
    const difference = paymentDifference(payment)
    const amountOff = difference !== null && difference !== 0
    if (!payment.late && !payment.duplicateReference && !amountOff) return null

    return (
        <span className={cn('flex flex-wrap gap-1.5', className)}>
            {payment.late ? (
                <Badge tone="info" size="sm" title="La fecha de pago es posterior al plazo">
                    <AlarmClock aria-hidden="true" className="size-3" />
                    Pago fuera de plazo
                </Badge>
            ) : null}
            {payment.duplicateReference ? (
                <Badge tone="danger" size="sm" title="La misma referencia aparece en otro pedido">
                    <Copy aria-hidden="true" className="size-3" />
                    Ref. duplicada
                </Badge>
            ) : null}
            {amountOff ? (
                <Badge tone="warning" size="sm" title="El monto pagado no coincide con el total">
                    <AlertTriangle aria-hidden="true" className="size-3" />
                    Monto {formatPaymentDifference(payment.method, difference)}
                </Badge>
            ) : null}
        </span>
    )
}
