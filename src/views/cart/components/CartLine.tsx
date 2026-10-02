import { Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import type { CartItem } from '@/@types/cart'
import { CartLineStockNotice } from '@/components/shared/CartLineStockNotice'
import { OnOrderNote } from '@/components/shared/OnOrderNote'
import { ProductMedia } from '@/components/shared/ProductMedia'
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
            <div className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-1.5">
                <ProductMedia
                    category={item.category}
                    image={item.imageUrl ? { url: item.imageUrl } : undefined}
                    fallbackAlt={item.name}
                    size="lg"
                />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-bold tracking-[0.12em] text-brand-700 uppercase">
                    {item.brand}
                    {item.model ? (
                        <span className="font-medium tracking-normal text-ink-muted normal-case tabular-nums">
                            {' '}
                            · {item.model}
                        </span>
                    ) : null}
                </p>
                <h2 className="text-lg font-semibold text-ink">
                    <Link to={productPath(item.slug)} className="rounded-sm hover:text-brand-700">
                        {item.name}
                    </Link>
                </h2>
                {item.variantLabel ? (
                    <p className="text-sm text-ink-soft">{item.variantLabel}</p>
                ) : null}
                <p className="text-sm text-ink-soft tabular-nums">
                    {formatCurrency(item.unitPrice)} c/u
                </p>
                {item.stockMode === 'ON_ORDER' ? (
                    <OnOrderNote leadTimeDays={item.leadTimeDays} />
                ) : null}
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

                <p className="w-28 text-right text-lg font-bold text-ink tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity)}
                </p>

                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Quitar ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''} del carrito`}
                    onClick={() => removeItem(item.lineId)}
                    className="size-11 px-0 text-ink-soft"
                >
                    <Trash2 aria-hidden="true" className="size-4" />
                </Button>
            </div>
        </li>
    )
}
