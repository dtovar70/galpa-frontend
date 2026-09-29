import { useEffect, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useLocation, useParams, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { CopyButton } from '@/components/shared/CopyButton'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import { ReceiptDownloadButton } from '@/components/shared/ReceiptDownloadButton'
import { WhatsAppInlineLink } from '@/components/shared/WhatsAppInlineLink'
import { WhatsAppNotice } from '@/components/shared/WhatsAppNotice'
import { Alert, Button, ButtonLink, Card, Skeleton } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { orderPath, ROUTES } from '@/constants/route.constant'
import { isApiError } from '@/services/errors'
import { OrderService } from '@/services/OrderService'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/formatDate'
import { useCountdown } from '@/utils/hooks/useCountdown'
import { useOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'
import { rememberOrder } from '@/utils/recentOrders'
import { OrderItemsCard } from '@/views/order/components/OrderItemsCard'
import { OrderTimeline } from '@/views/order/components/OrderTimeline'
import { PagoMovilCard } from '@/views/order/components/PagoMovilCard'
import { PaymentDeadline } from '@/views/order/components/PaymentDeadline'
import { PaymentForm } from '@/views/order/components/PaymentForm'
import { OrderQrCard } from '@/views/order/components/OrderQrCard'
import { PaymentHistory } from '@/views/order/components/PaymentHistory'
import { StatusMessage } from '@/views/order/components/StatusMessage'
import { useOrder, useSubmitPayment } from '@/views/order/hooks/useOrder'

const pageClass = 'space-y-8 py-10 lg:py-14'

function StepTitle({ number, children }: { number: number; children: string }) {
    return (
        <h2 className="flex items-center gap-3 font-display text-xl text-ink">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blush-400 text-base text-white">
                {number}
            </span>
            {children}
        </h2>
    )
}

function OrderSkeleton() {
    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton shape="block" className="h-28" />
                <Skeleton shape="block" className="h-72" />
            </div>
            <Skeleton shape="block" className="h-96" />
        </div>
    )
}

/**
 * The customer's private order page (`/pedido/MR-000123?t=<token>`): how to pay, the proof
 * upload and, afterwards, where the order stands. Works without an account.
 */
export function OrderView() {
    const { code = '' } = useParams()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('t') ?? ''
    const location = useLocation()
    const [showCreated, setShowCreated] = useState(
        () => (location.state as { justCreated?: boolean } | null)?.justCreated === true,
    )
    const { data: order, isPending, isError, error, refetch } = useOrder(code, token)
    const submitPayment = useSubmitPayment(code, token)
    // Status names and messages come from the catalog: wait for it rather than flash codes.
    const statusCatalog = useOrderStatusCatalog()
    const remaining = useCountdown(order?.paymentDueAt)
    const link = `${window.location.origin}${orderPath(code, token)}`

    // Visiting the link also remembers it in "Mis pedidos" on this device.
    useEffect(() => {
        if (!order) return
        rememberOrder({
            code: order.code,
            token,
            createdAt: order.createdAt,
            totalUsd: order.totals.totalUsd,
        })
    }, [order, token])

    if (!token || (isError && isApiError(error, 404))) {
        return (
            <div className={cn(CONTAINER, pageClass)}>
                <h1 className="sr-only">Pedido no encontrado</h1>
                <EmptyState
                    title="No encontramos este pedido"
                    description="Revisa que el enlace esté completo: incluye el código del pedido y la clave que va después de “?t=”."
                    icon={<PackageSearch className="size-6" />}
                    action={<ButtonLink to={ROUTES.myOrders}>Ver mis pedidos</ButtonLink>}
                />
            </div>
        )
    }

    if (isPending || statusCatalog.isLoading) {
        return (
            <div className={cn(CONTAINER, pageClass)}>
                <h1 className="sr-only">Cargando pedido</h1>
                <OrderSkeleton />
            </div>
        )
    }

    if (isError) {
        return (
            <div className={cn(CONTAINER, pageClass)}>
                <h1 className="sr-only">Pedido no disponible</h1>
                <EmptyState
                    title="No pudimos cargar tu pedido"
                    description="Revisa tu conexión e inténtalo de nuevo."
                    icon={<PackageSearch className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            </div>
        )
    }

    const needsPayment = order.canSubmitPayment
    // Past the deadline a proof is still welcome (the owner checks it by hand).
    const late =
        needsPayment &&
        (order.status === 'EXPIRADO' || (order.status === 'PENDIENTE_PAGO' && remaining === 0))
    const rejection = order.status === 'PAGO_RECHAZADO' ? order.payments[0]?.rejectionReason : null
    const paymentForm = (
        <Card padding="md">
            <PaymentForm
                createdAt={order.createdAt}
                totalBs={order.totals.totalBs}
                onSubmit={async (input) => {
                    await submitPayment.mutateAsync(input)
                    // The form is replaced by a shorter page: bring the customer back up to the
                    // new status. `html` scrolls smoothly unless the user prefers reduced motion.
                    window.scrollTo({ top: 0 })
                }}
            />
        </Card>
    )

    return (
        <div className={cn(CONTAINER, pageClass)}>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <p className="text-sm font-semibold text-ink-soft">Pedido</p>
                    <h1 className="font-display text-4xl tracking-tight break-words text-ink uppercase sm:text-5xl">
                        {order.code}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                        <OrderStatusBadge status={order.status} />
                        <span>Creado el {formatDateTime(order.createdAt)}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                    {order.receiptAvailable ? (
                        <ReceiptDownloadButton
                            code={order.code}
                            load={() => OrderService.getReceipt(order.code, token)}
                            variant="primary"
                        />
                    ) : null}
                    <CopyButton value={link} label="Copiar el enlace del pedido">
                        Copiar enlace
                    </CopyButton>
                </div>
            </header>

            {showCreated ? (
                <Alert
                    tone="success"
                    onDismiss={() => setShowCreated(false)}
                    autoDismissMs={NOTICE_DISMISS_MS * 3}
                >
                    ¡Pedido creado! Guarda este enlace (o usa “Copiar enlace”): es la única forma de
                    volver a tu pedido. También lo verás en “Mis pedidos” en este dispositivo.
                </Alert>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-8">
                    <StatusMessage order={order} late={late} />

                    {rejection ? (
                        <Alert>
                            <span className="font-semibold">Motivo del rechazo:</span> {rejection}
                        </Alert>
                    ) : null}

                    {needsPayment && !late && order.pagoMovil ? (
                        <>
                            <section className="space-y-4" aria-label="Paso 1">
                                <StepTitle number={1}>Paga desde tu banco</StepTitle>
                                <p className="text-sm text-ink-soft">
                                    Haz un Pago Móvil por el monto exacto con estos datos. Usa los
                                    botones para copiarlos.
                                </p>
                                {order.status === 'PENDIENTE_PAGO' ? (
                                    <div className="space-y-2">
                                        <PaymentDeadline dueAt={order.paymentDueAt} />
                                        <p className="text-sm text-ink-soft">
                                            Si ya pagaste, sube tu comprobante aunque se haya
                                            vencido el plazo; lo revisaremos.
                                        </p>
                                    </div>
                                ) : null}
                                <PagoMovilCard order={order} pagoMovil={order.pagoMovil} />
                            </section>
                            <section className="space-y-4" aria-label="Paso 2">
                                <StepTitle number={2}>Sube el comprobante</StepTitle>
                                <p className="text-sm text-ink-soft">
                                    Cuéntanos los datos del pago para que lo ubiquemos en el banco.
                                </p>
                                {paymentForm}
                            </section>
                        </>
                    ) : null}

                    {late ? (
                        <section className="space-y-4" aria-labelledby="late-payment-title">
                            <h2 id="late-payment-title" className="font-display text-xl text-ink">
                                Sube tu comprobante
                            </h2>
                            <p className="text-sm text-ink-soft">
                                Cuéntanos los datos del pago que hiciste para ubicarlo en el banco.
                                Lo revisamos a mano y te confirmamos por aquí.
                            </p>
                            {paymentForm}
                            <p className="text-sm text-ink-soft">
                                ¿Todavía no has pagado o tienes dudas?{' '}
                                <WhatsAppInlineLink
                                    message={`Hola, tengo una consulta sobre mi pedido ${order.code}.`}
                                >
                                    Escríbenos por WhatsApp
                                </WhatsAppInlineLink>{' '}
                                con tu código {order.code} antes de pagar.
                            </p>
                        </section>
                    ) : null}

                    {needsPayment && !late && !order.pagoMovil ? (
                        <WhatsAppNotice
                            title="Escríbenos para pagar"
                            message={`Hola, quiero pagar mi pedido ${order.code}.`}
                        >
                            Estamos actualizando los datos de Pago Móvil. Escríbenos por WhatsApp
                            con tu código {order.code} y te los enviamos.
                        </WhatsAppNotice>
                    ) : null}

                    {order.status === 'CANCELADO' ? (
                        <WhatsAppNotice
                            title="¿Hiciste un pago?"
                            message={`Hola, hice un pago para mi pedido ${order.code}, que aparece cancelado.`}
                        >
                            Si hiciste un pago, escríbenos por WhatsApp con tu código {order.code} y
                            lo revisamos.
                        </WhatsAppNotice>
                    ) : null}

                    <PaymentHistory payments={order.payments} />
                </div>

                <aside className="min-w-0 space-y-6">
                    <Card padding="lg" className="space-y-4">
                        <h2 className="font-display text-xl text-ink">Seguimiento</h2>
                        <OrderTimeline order={order} />
                    </Card>
                    <OrderItemsCard order={order} />
                    <OrderQrCard code={order.code} url={link} />
                </aside>
            </div>
        </div>
    )
}
