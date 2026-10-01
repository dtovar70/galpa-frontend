import { useCallback, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { OrderLineProblem } from '@/@types/order'
import { EmptyState } from '@/components/shared/EmptyState'
import { OnOrderCartNotice } from '@/components/shared/OnOrderCartNotice'
import { WhatsAppNotice } from '@/components/shared/WhatsAppNotice'
import { ButtonLink } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { orderPath, ROUTES } from '@/constants/route.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { isBolivarMethod } from '@/constants/payment.constant'
import {
    useCartActions,
    useCartHasOnOrderItems,
    useCartItems,
    useCartSubtotal,
} from '@/store/cartStore'
import { cn } from '@/utils/cn'
import { shippingCost } from '@/utils/content'
import { useExchangeRate } from '@/utils/hooks/useExchangeRate'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { checkoutPaymentMethods, configuredPaymentMethods } from '@/utils/payment'
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
    'No pudimos obtener la tasa del BCV, así que por ahora no podemos calcular el monto en bolívares. Intenta más tarde o contáctanos por WhatsApp.'

export function CheckoutView() {
    const items = useCartItems()
    const subtotal = useCartSubtotal()
    const { clear, updateQuantity, removeItem } = useCartActions()
    const hasOnOrderItems = useCartHasOnOrderItems()
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

    // Unknown (still loading or the request failed) is not a block: the API has the last word.
    const rateMissing = (rate.data !== undefined && !rate.data.available) || serverBlock === 'rate'
    const rateValue = rate.data?.available ? rate.data.rate : null
    const configured = serverBlock === 'payment' ? [] : configuredPaymentMethods(content.payment)
    // Without a rate the bolívar methods are hidden; the dollar ones still work.
    const paymentMethods =
        serverBlock === 'payment' ? [] : checkoutPaymentMethods(content.payment, !rateMissing)
    const onlyRateMissing = paymentMethods.length === 0 && configured.some(isBolivarMethod)

    const handleDeliveryChange = useCallback((method: DeliveryMethod) => {
        setDeliveryMethod(method)
    }, [])

    const handleConfirm = async (values: CheckoutValues) => {
        setFormError(null)
        setProblems([])
        const input = {
            ...values,
            customerIdNumber: values.customerIdNumber || undefined,
            items: items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId || undefined,
                quantity: item.quantity,
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
            if (problem.available > 0) updateQuantity(item.lineId, problem.available)
            else removeItem(item.lineId)
        }
        setProblems([])
        setFormError(null)
    }

    return (
        <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Finalizar <span className="text-brand-600">compra</span>
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
                        {hasOnOrderItems ? <OnOrderCartNotice /> : null}
                        {paymentMethods.length === 0 ? (
                            onlyRateMissing ? (
                                <WhatsAppNotice title="Tasa BCV no disponible">
                                    {RATE_UNAVAILABLE_TEXT}
                                </WhatsAppNotice>
                            ) : (
                                <WhatsAppNotice title="Por ahora no podemos recibir pedidos en línea">
                                    Estamos terminando de configurar los métodos de pago. Escríbenos
                                    por WhatsApp con los productos de tu carrito y te ayudamos a
                                    completar tu pedido.
                                </WhatsAppNotice>
                            )
                        ) : (
                            <CheckoutForm
                                onConfirm={handleConfirm}
                                onDeliveryMethodChange={handleDeliveryChange}
                                paymentMethods={paymentMethods}
                                total={total}
                                rate={rateValue}
                                formError={formError}
                            />
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
