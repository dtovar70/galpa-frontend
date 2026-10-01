import { ShoppingBag } from 'lucide-react'

import { ClearCartButton } from '@/components/shared/ClearCartButton'
import { OnOrderCartNotice } from '@/components/shared/OnOrderCartNotice'
import { EmptyState } from '@/components/shared/EmptyState'
import { BsApproximation } from '@/components/shared/BsApproximation'
import { FreeShippingProgress } from '@/components/shared/FreeShippingProgress'
import { Button, ButtonLink, Card } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { useCartHasOnOrderItems, useCartItems, useCartSubtotal } from '@/store/cartStore'
import { CART_STOCK_BLOCKED_MESSAGE } from '@/utils/cartAvailability'
import { cn } from '@/utils/cn'
import { shippingCost } from '@/utils/content'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCartAvailability } from '@/utils/hooks/useCartAvailability'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { CartLine } from '@/views/cart/components/CartLine'

export function CartView() {
    const items = useCartItems()
    const subtotal = useCartSubtotal()
    const content = useSiteContent()
    const availability = useCartAvailability(items)
    const hasOnOrderItems = useCartHasOnOrderItems()
    const shipping = shippingCost(subtotal, content.shipping)
    const total = subtotal + shipping

    return (
        <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Tu <span className="text-brand-600">carrito</span>
            </h1>

            {items.length === 0 ? (
                <EmptyState
                    title="Todavía no hay nada aquí"
                    description="Cuando encuentres el equipo ideal para tu espacio, aparecerá en esta lista."
                    icon={<ShoppingBag className="size-6" />}
                    action={<ButtonLink to={ROUTES.catalog}>Explorar catálogo</ButtonLink>}
                />
            ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="space-y-3">
                        {items.length > 1 ? (
                            <div className="flex items-center justify-between gap-3 px-1">
                                <span className="text-sm text-ink-soft">
                                    {items.length} productos en tu carrito
                                </span>
                                <ClearCartButton itemCount={items.length} />
                            </div>
                        ) : null}

                        <Card padding="none" className="px-6">
                            <ul className="divide-y divide-line">
                                {items.map((item) => (
                                    <CartLine
                                        key={item.lineId}
                                        item={item}
                                        stock={availability.lines.get(item.lineId)}
                                    />
                                ))}
                            </ul>
                        </Card>
                    </div>

                    <Card
                        tone="white"
                        padding="lg"
                        className="h-fit space-y-5 lg:sticky lg:top-28"
                        aria-label="Resumen del pedido"
                    >
                        <h2 className="text-xl text-ink">Resumen</h2>

                        <FreeShippingProgress subtotal={subtotal} />

                        <dl className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-ink-soft">Subtotal</dt>
                                <dd className="font-tech font-semibold text-ink">
                                    {formatCurrency(subtotal)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-ink-soft">Envío</dt>
                                <dd className="font-tech font-semibold text-ink">
                                    {shipping === 0 ? 'Gratis' : formatCurrency(shipping)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between border-t border-line pt-3">
                                <dt className="text-base font-bold text-ink">Total</dt>
                                <dd className="font-tech text-2xl font-bold text-ink">
                                    {formatCurrency(total)}
                                </dd>
                            </div>
                        </dl>
                        <BsApproximation usd={total} />
                        {hasOnOrderItems ? <OnOrderCartNotice /> : null}

                        <div className="grid gap-2">
                            {availability.hasIssues ? (
                                <>
                                    <p
                                        role="status"
                                        className="text-sm font-semibold text-danger-700"
                                    >
                                        {CART_STOCK_BLOCKED_MESSAGE}
                                    </p>
                                    <Button fullWidth disabled>
                                        Ir al checkout
                                    </Button>
                                </>
                            ) : (
                                <ButtonLink to={ROUTES.checkout} fullWidth>
                                    Ir al checkout
                                </ButtonLink>
                            )}
                            <ButtonLink to={ROUTES.catalog} variant="secondary" fullWidth>
                                Seguir comprando
                            </ButtonLink>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
