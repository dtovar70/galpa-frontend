import { Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import type { CartItem } from '@/@types/cart'
import { CartLineStockNotice } from '@/components/shared/CartLineStockNotice'
import { CartPersonalization } from '@/components/shared/CartPersonalization'
import { CartLineMedia } from '@/components/shared/CartLineMedia'
import { DesignBadge, GarmentColorNote } from '@/components/shared/DesignBadge'
import { Button, QuantityStepper } from '@/components/ui'
import { productPath } from '@/constants/route.constant'
import { MAX_LINE_QUANTITY, useCartActions } from '@/store/cartStore'
import type { LineStock } from '@/utils/cartAvailability'
import { formatCurrency } from '@/utils/formatCurrency'

export interface CartLineProps {
    item: CartItem
    /** Live cap and stock problem of the line; unknown (no cap but the line limit) when absent. */
    stock?: LineStock
}

export function CartLine({ item, stock }: CartLineProps) {
    const { updateQuantity, removeItem } = useCartActions()
    const max = stock?.max ?? MAX_LINE_QUANTITY

    return (
        <li className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-3xl bg-blush-50 p-2">
                <CartLineMedia item={item} size="lg" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                <h2 className="font-display text-lg text-ink">
                    <Link to={productPath(item.slug)} className="rounded-sm hover:text-blush-700">
                        {item.name}
                    </Link>
                </h2>
                <p className="text-sm text-ink-soft">{item.variantLabel}</p>
                {item.design ? <DesignBadge /> : null}
                {item.design?.color ? <GarmentColorNote color={item.design.color} /> : null}
                <p className="text-sm text-ink-soft">{formatCurrency(item.unitPrice)} c/u</p>
                <CartPersonalization item={item} />
                {stock?.issue ? (
                    <CartLineStockNotice
                        issue={stock.issue}
                        onAdjust={(quantity) => updateQuantity(item.lineId, quantity)}
                        className="pt-1"
                    />
                ) : null}
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
                <QuantityStepper
                    value={item.quantity}
                    max={Math.max(max, 1)}
                    disabled={max === 0 && item.quantity <= 1}
                    onChange={(quantity) => updateQuantity(item.lineId, quantity, max)}
                />

                <p className="w-24 text-right font-display text-lg text-ink">
                    {formatCurrency(item.unitPrice * item.quantity)}
                </p>

                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Quitar ${item.name}${item.personalization ? ` (${item.personalization})` : ''} del carrito`}
                    onClick={() => removeItem(item.lineId)}
                    className="size-11 px-0 text-ink-soft"
                >
                    <Trash2 aria-hidden="true" className="size-4" />
                </Button>
            </div>
        </li>
    )
}
