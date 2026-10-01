import { useCallback, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router'

import { isPaymentConfigured } from '@/@types/content'
import type { OrderLineProblem } from '@/@types/order'
import { EmptyState } from '@/components/shared/EmptyState'
import { WhatsAppNotice } from '@/components/shared/WhatsAppNotice'
import { ButtonLink } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { orderPath, ROUTES } from '@/constants/route.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { useCartActions, useCartItems, useCartSubtotal } from '@/store/cartStore'
import { cn } from '@/utils/cn'
import { shippingCost } from '@/utils/content'
import { useExchangeRate } from '@/utils/hooks/useExchangeRate'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { rememberOrder } from '@/utils/recentOrders'
import { CheckoutForm } from '@/views/checkout/components/CheckoutForm'
import { MobileTotalSummary } from '@/views/checkout/components/MobileTotalSummary'
import { OrderSummary } from '@/views/checkout/components/OrderSummary'
import {
    EXCHANGE_RATE_UNAVAILABLE,
    IDEMPOTENCY_KEY_REUSED,
    PAYMENT_METHOD_UNAVAILABLE,
    useCreateOrder,
} from '@/views/checkout/hooks/useCreateOrder'
import { useIdempotencyKey } from '@/views/checkout/hooks/useIdempotencyKey'
import type { CheckoutValues, DeliveryMethod } from '@/views/checkout/schema/checkout.schema'
import { isLineProblemsError, lineProblemsOf } from '@/views/checkout/utils/lineProblems'

const RATE_UNAVAILABLE_TEXT =
    'No pudimos obtener la tasa del BCV. Intenta más tarde o contáctanos por WhatsApp.'

export function CheckoutView() {
    const items = useCartItems()
    const subtotal = useCartSubtotal()
    const { clear, updateQuantity, removeItem, removeDesign } = useCartActions()
    const navigate = useNavigate()
    const content = useSiteContent()
    const rate = useExchangeRate()
    const createOrder = useCreateOrder()
    const idempotency = useIdempotencyKey()

    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery')
    const [problems, setProblems] = useState<OrderLineProblem[]>([])
    const [formError, setFormError] = useState<string | null>(null)
    const [serverBlock, setServerBlock] = useState<'rate' | 'payment' | null>(null)

    const shipping = deliveryMethod === 'pickup' ? 0 : shippingCost(subtotal, content.shipping)
    const total = subtotal + shipping

    const paymentReady = isPaymentConfigured(content.payment) && serverBlock !== 'payment'
    // Unknown (still loading or the request failed) is not a block: the API has the last word.
    const rateMissing = (rate.data !== undefined && !rate.data.available) || serverBlock === 'rate'

    const handleDeliveryChange = useCallback((method: DeliveryMethod) => {
        setDeliveryMethod(method)
    }, [])

    const handleConfirm = async (values: CheckoutValues) => {
        setFormError(null)
        setProblems([])
        const input = {
            ...values,
            items: items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId || undefined,
                quantity: item.quantity,
                personalization: item.personalization || undefined,
                designId: item.design?.id,
            })),
        }
        // Same order body => same key, so a retry after a timeout never creates a second order;
        // fixing a field or the cart is a new attempt (the API would answer 409 to the old key).
        const scope = JSON.stringify(input)
        try {
            const created = await createOrder.mutateAsync({
                idempotencyKey: idempotency.keyFor(scope),
                input,
            })
            idempotency.discard()
            rememberOrder({
                code: created.code,
                token: created.accessToken,
                createdAt: created.order.createdAt,
                totalUsd: created.order.totals.totalUsd,
            })
            await navigate(orderPath(created.code, created.accessToken), {
                state: { justCreated: true },
            })
            // After leaving, so the checkout never flashes its "empty cart" state.
            clear()
        } catch (error) {
            if (isApiError(error, 409) && error.code === IDEMPOTENCY_KEY_REUSED) {
                // The key belongs to a different order body: the next try is a new attempt.
                idempotency.discard()
                setFormError(error.message)
            } else if (isApiError(error, 503) && error.code === EXCHANGE_RATE_UNAVAILABLE) {
                setServerBlock('rate')
            } else if (isApiError(error, 503) && error.code === PAYMENT_METHOD_UNAVAILABLE) {
                setServerBlock('payment')
            } else if (isLineProblemsError(error)) {
                setProblems(lineProblemsOf(error))
                setFormError(error.message)
            } else {
                setFormError(
                    getErrorMessage(error, 'No pudimos crear tu pedido. Intenta de nuevo.'),
                )
            }
            // Field errors are pinned by the form itself.
            throw error
        }
    }

    const fixProblems = () => {
        for (const problem of problems) {
            const item = items[problem.index]
            if (!item) continue
            // A refused design leaves the line without it; the customer can make a new one.
            if (problem.kind === 'design') removeDesign(item.lineId)
            else if (problem.available > 0) updateQuantity(item.lineId, problem.available)
            else removeItem(item.lineId)
        }
        setProblems([])
        setFormError(null)
    }

    return (
        <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
            <h1 className="font-display text-4xl tracking-tight text-ink uppercase sm:text-5xl">
                Finalizar <span className="text-blush-500">compra</span>
            </h1>

            {items.length === 0 ? (
                <EmptyState
                    title="Tu carrito está vacío"
                    description="Agrega al menos un producto para poder completar el pedido."
                    icon={<ShoppingBag className="size-6" />}
                    action={<ButtonLink to={ROUTES.catalog}>Explorar catálogo</ButtonLink>}
                />
            ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="min-w-0 space-y-6">
                        <MobileTotalSummary
                            items={items}
                            subtotal={subtotal}
                            shipping={shipping}
                            total={total}
                        />
                        {!paymentReady ? (
                            <WhatsAppNotice title="Por ahora no podemos recibir pedidos en línea">
                                Estamos terminando de configurar los pagos. Escríbenos por WhatsApp
                                con los productos de tu carrito y te ayudamos a completar tu pedido.
                            </WhatsAppNotice>
                        ) : (
                            <>
                                {rateMissing ? (
                                    <WhatsAppNotice title="Tasa BCV no disponible">
                                        {RATE_UNAVAILABLE_TEXT}
                                    </WhatsAppNotice>
                                ) : null}
                                <CheckoutForm
                                    onConfirm={handleConfirm}
                                    onDeliveryMethodChange={handleDeliveryChange}
                                    disabled={rateMissing}
                                    formError={formError}
                                />
                            </>
                        )}
                    </div>
                    <OrderSummary
                        items={items}
                        subtotal={subtotal}
                        shipping={shipping}
                        total={total}
                        problems={problems}
                        onFixProblems={fixProblems}
                    />
                </div>
            )}
        </div>
    )
}
