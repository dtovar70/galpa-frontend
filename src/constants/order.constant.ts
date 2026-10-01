import type { DeliveryMethod, OrderStatus } from '@/@types/order'

/** Statuses before the goods are handled: the payment steps every order goes through. */
const PAYMENT_STEPS: readonly OrderStatus[] = [
    'PENDIENTE_PAGO',
    'PENDIENTE_VERIFICACION',
    'PAGO_VERIFICADO',
]

/**
 * The happy path the customer's timeline shows, in order. Pickup orders end at the store
 * counter, deliveries leave it; "Esperando mercancía" only appears for on-order items.
 */
export function orderProgress(
    deliveryMethod: DeliveryMethod,
    hasOnOrderItems: boolean,
): readonly OrderStatus[] {
    return [
        ...PAYMENT_STEPS,
        ...(hasOnOrderItems ? (['ESPERANDO_MERCANCIA'] as const) : []),
        'EN_PREPARACION',
        deliveryMethod === 'pickup' ? 'LISTO_PARA_RETIRO' : 'DESPACHADO',
        'ENTREGADO',
    ]
}

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
    delivery: 'Envío / entrega local',
    pickup: 'Retiro en tienda',
}

/** While a proof is being checked the order page refreshes itself this often. */
export const ORDER_POLL_MS = 25_000

/** The admin nav badge of orders waiting for verification refreshes this often. */
export const ADMIN_ORDERS_POLL_MS = 30_000
