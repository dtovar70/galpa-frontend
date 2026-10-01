import { useState } from 'react'
import { ClipboardList, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { ButtonLink, Card, Tooltip } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { orderPath, ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDate'
import { forgetOrder, readRecentOrders, type RecentOrder } from '@/utils/recentOrders'

const LOOKUP_LINK_CLASS =
    'font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-brand-400'

/** Orders placed from this browser (their private links are kept in local storage). */
export function MyOrdersView() {
    const [orders, setOrders] = useState<RecentOrder[]>(() => readRecentOrders())

    const remove = (code: string) => {
        forgetOrder(code)
        setOrders(readRecentOrders())
    }

    return (
        <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    Mis <span className="text-brand-600">pedidos</span>
                </h1>
                <p className="max-w-2xl text-ink-soft">
                    Los pedidos que hiciste desde este dispositivo. Si cambias de navegador o de
                    teléfono, usa el enlace de tu pedido para volver a verlo.
                </p>
                <p className="max-w-2xl text-ink-soft">
                    ¿No ves tu pedido?{' '}
                    <Link to={ROUTES.orderLookup} className={LOOKUP_LINK_CLASS}>
                        Consúltalo con tu código y correo
                    </Link>
                    .
                </p>
            </div>

            {orders.length === 0 ? (
                <EmptyState
                    title="Todavía no hay pedidos aquí"
                    description="Cuando hagas un pedido, lo verás en esta lista para seguirlo cuando quieras."
                    icon={<ClipboardList className="size-6" />}
                    action={
                        <div className="flex flex-wrap justify-center gap-3">
                            <ButtonLink to={ROUTES.catalog}>Explorar catálogo</ButtonLink>
                            <ButtonLink
                                to={ROUTES.orderLookup}
                                variant="secondary"
                                leadingIcon={<Search aria-hidden="true" className="size-4" />}
                            >
                                Consultar un pedido
                            </ButtonLink>
                        </div>
                    }
                />
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                    {orders.map((order) => (
                        <li key={order.code}>
                            <Card padding="sm" className="flex items-center gap-3">
                                <Link
                                    to={orderPath(order.code, order.token)}
                                    className="min-w-0 flex-1 rounded-2xl px-2 py-1 transition hover:bg-brand-50"
                                >
                                    <p className="font-tech text-lg font-bold text-ink">
                                        {order.code}
                                    </p>
                                    <p className="text-sm text-ink-soft">
                                        {formatDateTime(order.createdAt)} ·{' '}
                                        {formatCurrency(order.totalUsd)}
                                    </p>
                                </Link>
                                <Tooltip label="Quitar de la lista" placement="top" align="end">
                                    <button
                                        type="button"
                                        onClick={() => remove(order.code)}
                                        aria-label={`Quitar ${order.code} de la lista`}
                                        className="flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700"
                                    >
                                        <Trash2 aria-hidden="true" className="size-4" />
                                    </button>
                                </Tooltip>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
