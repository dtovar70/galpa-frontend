import { useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Mail, MailCheck, MessageCircle, Package, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { Alert, Button, Card, Input } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { OrderService } from '@/services/OrderService'
import { cn } from '@/utils/cn'
import {
    orderLookupSchema,
    type OrderLookupInput,
    type OrderLookupValues,
} from '@/views/order/schema/lookup.schema'

/** The API answers the same whether or not an order matches (it never reveals orders). */
const LOOKUP_SENT_MESSAGE = 'Si los datos coinciden, te enviamos un enlace a tu correo.'

const linkClass =
    'font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-brand-500'

/**
 * "Consultar mi pedido" (`/consultar-pedido`): the order code and the checkout email. When they
 * match, the API emails a fresh private link to the order's address.
 */
export function OrderLookupView() {
    const [sentTo, setSentTo] = useState<string | null>(null)
    const lookup = useMutation({ mutationFn: OrderService.lookup })
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors },
    } = useForm<OrderLookupInput, unknown, OrderLookupValues>({
        resolver: zodResolver(orderLookupSchema),
        defaultValues: { code: '', email: '' },
    })

    const submit = handleSubmit((values) => {
        lookup.mutate(values, {
            onSuccess: () => setSentTo(values.email),
            onError: (error) => {
                if (!isApiError(error, 400)) return
                for (const detail of error.details) {
                    const message = detail.errors[0]
                    if (message && (detail.field === 'code' || detail.field === 'email')) {
                        setError(detail.field, { type: 'server', message })
                    }
                }
            },
        })
    })

    const again = () => {
        setSentTo(null)
        lookup.reset()
        reset()
    }

    return (
        // Phones: heading, form, help. Wide screens: heading and help on the left, form on the right.
        <div
            className={cn(
                CONTAINER,
                'grid grid-cols-1 gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-x-16 lg:py-16',
            )}
        >
            <div className="space-y-3 lg:col-start-1">
                <p className="text-sm font-semibold tracking-[0.2em] text-brand-700 uppercase">
                    Tus pedidos
                </p>
                <h1 className="text-3xl font-extrabold tracking-display text-ink sm:text-4xl">
                    Consulta tu <span className="text-brand-600">pedido</span>
                </h1>
                <p className="max-w-2xl text-ink-soft">
                    ¿Perdiste el enlace de tu pedido o lo hiciste desde otro dispositivo? Escribe el
                    código del pedido y el correo que usaste al comprar, y te enviamos un enlace
                    nuevo para verlo.
                </p>
            </div>

            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                {sentTo ? (
                    <Card padding="lg" className="space-y-4 text-center">
                        <span
                            aria-hidden="true"
                            className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100 text-ink"
                        >
                            <MailCheck className="size-6" />
                        </span>
                        <h2 className="text-2xl font-bold text-ink">Revisa tu correo</h2>
                        <p className="text-sm text-ink-soft" role="status">
                            {LOOKUP_SENT_MESSAGE}
                        </p>
                        <p className="text-sm break-words text-ink-soft">
                            Busca un mensaje para{' '}
                            <span className="font-semibold text-ink">{sentTo}</span> (mira también
                            en spam o promociones). Si no llega en unos minutos, revisa el código y
                            el correo, o escríbenos por{' '}
                            <Link to={ROUTES.contact} className={linkClass}>
                                Contacto
                            </Link>
                            .
                        </p>
                        <Button variant="secondary" onClick={again}>
                            Consultar otro pedido
                        </Button>
                    </Card>
                ) : (
                    <Card padding="lg">
                        <form
                            onSubmit={(event) => void submit(event)}
                            noValidate
                            className="space-y-5"
                        >
                            {lookup.isError && !isApiError(lookup.error, 400) ? (
                                <Alert onDismiss={lookup.reset}>
                                    {getErrorMessage(lookup.error)}
                                </Alert>
                            ) : null}
                            <fieldset className="space-y-5" disabled={lookup.isPending}>
                                <legend className="sr-only">Código del pedido y correo</legend>
                                <Input
                                    label="Código del pedido"
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    hint="Ejemplo: GP-000123"
                                    error={errors.code?.message}
                                    {...register('code')}
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    autoComplete="email"
                                    hint="El mismo que usaste al hacer el pedido."
                                    error={errors.email?.message}
                                    {...register('email')}
                                />
                            </fieldset>
                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                isLoading={lookup.isPending}
                                leadingIcon={<Search aria-hidden="true" className="size-4" />}
                            >
                                Enviarme el enlace
                            </Button>
                        </form>
                    </Card>
                )}
            </div>

            <section aria-labelledby="lookup-help-title" className="space-y-4 lg:col-start-1">
                <h2 id="lookup-help-title" className="text-xl font-bold text-ink">
                    ¿Dónde encuentro mi código?
                </h2>
                <ul className="space-y-3">
                    <HelpItem icon={<Mail className="size-5" />}>
                        En el correo{' '}
                        <span className="font-semibold text-ink">«Recibimos tu pedido GP-…»</span>{' '}
                        que te enviamos al comprar. Ese correo también trae el botón «Ver mi
                        pedido».
                    </HelpItem>
                    <HelpItem icon={<Package className="size-5" />}>
                        Si compraste desde este dispositivo, está en{' '}
                        <Link to={ROUTES.myOrders} className={linkClass}>
                            Mis pedidos
                        </Link>
                        .
                    </HelpItem>
                    <HelpItem icon={<MessageCircle className="size-5" />}>
                        ¿No lo encuentras? Escríbenos por{' '}
                        <Link to={ROUTES.contact} className={linkClass}>
                            Contacto
                        </Link>{' '}
                        con tu nombre y te ayudamos.
                    </HelpItem>
                </ul>
            </section>
        </div>
    )
}

function HelpItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <li className="flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-4">
            <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"
            >
                {icon}
            </span>
            <p className="pt-2 text-sm text-ink-soft">{children}</p>
        </li>
    )
}
