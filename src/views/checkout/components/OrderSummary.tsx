import type { CartItem } from '@/@types/cart'
import type { OrderLineProblem } from '@/@types/order'
import { BsApproximation } from '@/components/shared/BsApproximation'
import { CartLineMedia } from '@/components/shared/CartLineMedia'
import { DesignBadge, GarmentColorNote } from '@/components/shared/DesignBadge'
import { Button, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/formatCurrency'

export interface OrderSummaryProps {
    items: CartItem[]
    subtotal: number
    shipping: number
    total: number
    /** Problems the API reported for some lines (by cart index). */
    problems?: OrderLineProblem[]
    /** Clamps quantities to the stock left and drops lines that can no longer be bought. */
    onFixProblems?: () => void
}

export function OrderSummary({
    items,
    subtotal,
    shipping,
    total,
    problems = [],
    onFixProblems,
}: OrderSummaryProps) {
    const problemAt = (index: number) => problems.find((problem) => problem.index === index)

    return (
        <Card tone="cream" padding="lg" className="h-fit space-y-5 lg:sticky lg:top-28">
            <h2 className="font-display text-xl text-ink">Tu pedido</h2>

            <ul className="space-y-4">
                {items.map((item, index) => {
                    const problem = problemAt(index)
                    return (
                        <li key={item.lineId} className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5">
                                    <CartLineMedia item={item} size="sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-display text-sm text-ink">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-ink-soft">
                                        {item.variantLabel} · {item.quantity} u.
                                    </p>
                                    {item.design ? <DesignBadge className="mt-1" /> : null}
                                    {item.design?.color ? (
                                        <GarmentColorNote
                                            color={item.design.color}
                                            className="mt-0.5"
                                        />
                                    ) : null}
                                    {item.personalization ? (
                                        <p className="text-xs break-words text-ink">
                                            <span className="text-ink-soft">Personalización:</span>{' '}
                                            “{item.personalization}”
                                        </p>
                                    ) : null}
                                </div>
                                <span className="shrink-0 text-sm font-semibold text-ink">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                </span>
                            </div>
                            {problem ? (
                                <p role="alert" className="text-sm font-medium text-blush-700">
                                    {problem.message}
                                </p>
                            ) : null}
                        </li>
                    )
                })}
            </ul>

            {problems.length > 0 && onFixProblems ? (
                <Button variant="secondary" size="sm" fullWidth onClick={onFixProblems}>
                    Ajustar mi carrito
                </Button>
            ) : null}

            <dl className="space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between">
                    <dt className="text-ink-soft">Subtotal</dt>
                    <dd className="font-semibold text-ink">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-ink-soft">Envío</dt>
                    <dd className="font-semibold text-ink">
                        {shipping === 0 ? 'Gratis' : formatCurrency(shipping)}
                    </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                    <dt className="font-display text-base text-ink">Total</dt>
                    <dd className="font-display text-2xl text-ink">{formatCurrency(total)}</dd>
                </div>
            </dl>
            <BsApproximation usd={total} />
        </Card>
    )
}
