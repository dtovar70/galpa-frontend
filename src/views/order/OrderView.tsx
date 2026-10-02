import { useEffect, useState, type ReactNode } from 'react'
import { Clock, Mail, Package, PackageSearch, Warehouse } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CopyButton } from '@/components/shared/CopyButton'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import { ReceiptDownloadButton } from '@/components/shared/ReceiptDownloadButton'
import { WhatsAppInlineLink } from '@/components/shared/WhatsAppInlineLink'
import { WhatsAppNotice } from '@/components/shared/WhatsAppNotice'
import { Alert, Button, ButtonLink, Card, Skeleton } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { orderPath, ROUTES } from '@/constants/route.constant'
import { isApiError } from '@/services/errors'
import { OrderService } from '@/services/OrderService'
import { cn } from '@/utils/cn'
import { isBolivarMethod } from '@/constants/payment.constant'
import { formatDateTime } from '@/utils/formatDate'
import { useCountdown } from '@/utils/hooks/useCountdown'
import { useOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'
import { rememberOrder } from '@/utils/recentOrders'
import { OrderItemsCard } from '@/views/order/components/OrderItemsCard'
import { OrderQrCard } from '@/views/order/components/OrderQrCard'
import { OrderTimeline } from '@/views/order/components/OrderTimeline'
import { PaymentDeadline } from '@/views/order/components/PaymentDeadline'
import { PaymentForm } from '@/views/order/components/PaymentForm'
import { PaymentHistory } from '@/views/order/components/PaymentHistory'
import { PaymentInstructionsCard } from '@/views/order/components/PaymentInstructionsCard'
import { PaymentMethodSwitcher } from '@/views/order/components/PaymentMethodSwitcher'
import { StatusMessage } from '@/views/order/components/StatusMessage'
import { useChangePaymentMethod, useOrder, useSubmitPayment } from '@/views/order/hooks/useOrder'

const pageClass = 'space-y-8 py-10 lg:py-14'

function StepTitle({ number, children }: { number: number; children: string }) {
    return (
        <h2 className="flex items-center gap-3 text-xl text-ink">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-base text-brand-700 tabular-nums">
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
 * The customer's private order page (`/pedido/GP-000123?t=<token>`): how to pay, the proof
 * upload and, afterwards, where the order stands. Works without an account.
 */
export function OrderView() {
    const { code = '' } = useParams()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('t') ?? ''
    const location = useLocation()
    const navigate = useNavigate()
    const [showCreated, setShowCreated] = useState(
        () => (location.state as { justCreated?: boolean } | null)?.justCreated === true,
    )

    // The browser keeps navigation state across reloads: drop the flag once it is read, so the
    // "¡Pedido creado!" notice shows right after checkout and never again on this entry.
    useEffect(() => {
        if ((location.state as { justCreated?: boolean } | null)?.justCreated) {
            void navigate(
                { pathname: location.pathname, search: location.search },
                { replace: true, state: null },
            )
        }
    }, [location, navigate])
    const { data: order, isPending, isError, error, refetch } = useOrder(code, token)
    const submitPayment = useSubmitPayment(code, token)
    const changeMethod = useChangePaymentMethod(code, token)
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
    // The store's details for the order's method come with the order; the method may have been
    // turned off meanwhile (then its details come back empty).
    const methodAvailable = order.availablePaymentMethods.includes(order.paymentMethod)
    const canSwitchMethod = order.canChangePaymentMethod
    const methodLabel = order.paymentMethodLabel
    const paymentForm = (
        <Card padding="md">
            <PaymentForm
                key={order.paymentMethod}
                createdAt={order.createdAt}
                method={order.paymentMethod}
                totalBs={order.totals.totalBs}
                totalUsd={order.totals.totalUsd}
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
                    <h1 className="text-4xl font-bold tracking-tight break-words text-ink tabular-nums sm:text-5xl">
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

            <ConfirmDialog
                isOpen={showCreated}
                title="¡Pedido creado!"
                confirmLabel="Entendido"
                confirmVariant="primary"
                hideCancel
                onConfirm={() => setShowCreated(false)}
                onClose={() => setShowCreated(false)}
            >
                <ul className="space-y-4 text-sm text-ink-soft">
                    <CreatedNoticeItem icon={<Mail className="size-5" />}>
                        Te enviamos un correo a{' '}
                        <span className="font-semibold break-all text-ink">
                            {order.customer.email}
                        </span>{' '}
                        con el resumen, los datos para pagar con {methodLabel} y el enlace para
                        volver a este pedido. Si no lo ves, revisa spam o promociones.
                    </CreatedNoticeItem>
                    {order.canSubmitPayment ? (
                        <CreatedNoticeItem icon={<Clock className="size-5" />}>
                            Paga y envía el comprobante antes del{' '}
                            <span className="font-semibold text-ink">
                                {formatDateTime(order.paymentDueAt)}
                            </span>{' '}
                            {/* The time already ends in "a. m."/"p. m.", so no extra period. */}
                            Si no llega a tiempo, el pedido expira y los productos apartados vuelven
                            a estar disponibles.
                        </CreatedNoticeItem>
                    ) : null}
                    {order.hasOnOrderItems ? (
                        <CreatedNoticeItem icon={<Warehouse className="size-5" />}>
                            Tu pedido incluye equipos bajo pedido: te avisaremos cuando lleguen a
                            nuestro almacén para coordinar la entrega.
                        </CreatedNoticeItem>
                    ) : null}
                    <CreatedNoticeItem icon={<Package className="size-5" />}>
                        En este dispositivo también lo encuentras en{' '}
                        <Link
                            to={ROUTES.myOrders}
                            className="font-semibold text-brand-700 underline underline-offset-2"
                        >
                            Mis pedidos
                        </Link>{' '}
                        (el ícono de paquete junto al carrito, o en el menú).
                    </CreatedNoticeItem>
                </ul>
            </ConfirmDialog>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-8">
                    <StatusMessage order={order} late={late} />

                    {rejection ? (
                        <Alert>
                            <span className="font-semibold">Motivo del rechazo:</span> {rejection}
                        </Alert>
                    ) : null}

                    {needsPayment && !late && methodAvailable ? (
                        <>
                            <section className="space-y-4" aria-label="Paso 1">
                                <StepTitle number={1}>Realiza tu pago</StepTitle>
                                <p className="text-sm text-ink-soft">
                                    {isBolivarMethod(order.paymentMethod)
                                        ? `Haz tu ${methodLabel} por el monto exacto en bolívares con estos datos.`
                                        : `Envía el monto exacto en dólares por ${methodLabel} con estos datos.`}{' '}
                                    Usa los botones para copiarlos.
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
                                <PaymentInstructionsCard order={order} />
                                {canSwitchMethod ? (
                                    <PaymentMethodSwitcher
                                        order={order}
                                        methods={order.availablePaymentMethods}
                                        onChange={(method) => changeMethod.mutateAsync(method)}
                                    />
                                ) : null}
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
                            <h2 id="late-payment-title" className="text-xl text-ink">
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

                    {needsPayment && !late && !methodAvailable ? (
                        <>
                            <WhatsAppNotice
                                title="Escríbenos para pagar"
                                message={`Hola, quiero pagar mi pedido ${order.code}.`}
                            >
                                Estamos actualizando los datos de {methodLabel}. Escríbenos por
                                WhatsApp con tu código {order.code} y te los enviamos, o elige otro
                                método de pago.
                            </WhatsAppNotice>
                            {canSwitchMethod ? (
                                <PaymentMethodSwitcher
                                    order={order}
                                    methods={order.availablePaymentMethods}
                                    onChange={(method) => changeMethod.mutateAsync(method)}
                                />
                            ) : null}
                        </>
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
                        <h2 className="text-xl text-ink">Seguimiento</h2>
                        <OrderTimeline order={order} />
                    </Card>
                    <OrderItemsCard order={order} />
                    <OrderQrCard code={order.code} url={link} />
                </aside>
            </div>
        </div>
    )
}

function CreatedNoticeItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"
            >
                {icon}
            </span>
            <p className="pt-1.5">{children}</p>
        </li>
    )
}
