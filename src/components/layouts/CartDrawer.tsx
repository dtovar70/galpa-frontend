import { ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { CartLineStockNotice } from '@/components/shared/CartLineStockNotice'
import { ClearCartButton } from '@/components/shared/ClearCartButton'
import { FreeShippingProgress } from '@/components/shared/FreeShippingProgress'
import { OnOrderNote } from '@/components/shared/OnOrderNote'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { Button, ButtonLink, Drawer, QuantityStepper } from '@/components/ui'
import { MAX_LINE_QUANTITY, useCartActions, useCartItems, useCartSubtotal } from '@/store/cartStore'
import { productPath, ROUTES } from '@/constants/route.constant'
import { useCartDrawer } from '@/store/uiStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { CART_STOCK_BLOCKED_MESSAGE } from '@/utils/cartAvailability'
import { useCartAvailability } from '@/utils/hooks/useCartAvailability'

export function CartDrawer() {
    const { isOpen, close } = useCartDrawer()
    const items = useCartItems()
    const subtotal = useCartSubtotal()
    const { updateQuantity, removeItem } = useCartActions()
    const availability = useCartAvailability(items, isOpen)

    return (
        <Drawer
            isOpen={isOpen}
            onClose={close}
            title="Tu carrito"
            footer={
                items.length > 0 ? (
                    <div className="space-y-4">
                        <FreeShippingProgress subtotal={subtotal} />
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-ink-soft">Subtotal</span>
                            <span className="font-tech text-xl font-bold text-ink">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                        <div className="grid gap-2">
                            {availability.hasIssues ? (
                                <>
                                    <p
                                        role="status"
                                        className="text-xs font-semibold text-danger-700"
                                    >
                                        {CART_STOCK_BLOCKED_MESSAGE}
                                    </p>
                                    <Button fullWidth disabled>
                                        Ir al checkout
                                    </Button>
                                </>
                            ) : (
                                <ButtonLink to={ROUTES.checkout} onClick={close} fullWidth>
                                    Ir al checkout
                                </ButtonLink>
                            )}
                            <ButtonLink
                                to={ROUTES.cart}
                                onClick={close}
                                variant="secondary"
                                fullWidth
                            >
                                Ver el carrito
                            </ButtonLink>
                        </div>
                    </div>
                ) : null
            }
        >
            {items.length === 0 ? (
                <div className="flex min-h-full flex-col items-center justify-center gap-4 py-8 text-center">
                    <span
                        aria-hidden="true"
                        className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
                    >
                        <ShoppingBag className="size-7" />
                    </span>
                    <p className="text-lg font-bold">Tu carrito está vacío</p>
                    <p className="max-w-xs text-sm text-ink-soft">
                        Explora nuestros aires acondicionados, repuestos y accesorios.
                    </p>
                    <ButtonLink to={ROUTES.catalog} onClick={close}>
                        Explorar catálogo
                    </ButtonLink>
                </div>
            ) : (
                <>
                    {items.length > 1 ? (
                        <div className="flex items-center justify-between gap-3 pb-2">
                            <span className="text-sm text-ink-soft">{items.length} productos</span>
                            <ClearCartButton itemCount={items.length} />
                        </div>
                    ) : null}

                    <ul className="divide-y divide-line">
                        {items.map((item) => {
                            const stock = availability.lines.get(item.lineId)
                            const max = stock?.max ?? MAX_LINE_QUANTITY
                            return (
                                <li key={item.lineId} className="flex gap-3 py-4">
                                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-1">
                                        <ProductMedia
                                            category={item.category}
                                            image={
                                                item.imageUrl ? { url: item.imageUrl } : undefined
                                            }
                                            fallbackAlt={item.name}
                                            size="sm"
                                        />
                                    </div>

                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <Link
                                            to={productPath(item.slug)}
                                            onClick={close}
                                            className="text-sm leading-snug font-semibold text-ink"
                                        >
                                            {item.name}
                                        </Link>
                                        <p className="text-xs text-ink-soft">
                                            {item.brand} · {item.variantLabel}
                                        </p>
                                        {item.stockMode === 'ON_ORDER' ? (
                                            <OnOrderNote leadTimeDays={item.leadTimeDays} />
                                        ) : null}

                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <QuantityStepper
                                                value={item.quantity}
                                                max={Math.max(max, 1)}
                                                disabled={max === 0 && item.quantity <= 1}
                                                onChange={(quantity) =>
                                                    updateQuantity(item.lineId, quantity, max)
                                                }
                                            />
                                            <span className="font-tech text-sm font-semibold text-ink">
                                                {formatCurrency(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                        {stock?.issue ? (
                                            <CartLineStockNotice
                                                issue={stock.issue}
                                                onAdjust={(quantity) =>
                                                    updateQuantity(item.lineId, quantity)
                                                }
                                            />
                                        ) : null}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label={`Quitar ${item.name} (${item.variantLabel}) del carrito`}
                                        onClick={() => removeItem(item.lineId)}
                                        className="size-11 shrink-0 self-start px-0 text-ink-soft"
                                    >
                                        <Trash2 aria-hidden="true" className="size-4" />
                                    </Button>
                                </li>
                            )
                        })}
                    </ul>
                </>
            )}
        </Drawer>
    )
}
