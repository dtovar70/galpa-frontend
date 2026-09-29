import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MailCheck, Search } from 'lucide-react'
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
    'font-semibold text-blush-600 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blush-400'

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
        <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
            <div className="space-y-2">
                <h1 className="font-display text-4xl tracking-tight text-ink uppercase sm:text-5xl">
                    Consulta tu <span className="text-blush-500">pedido</span>
                </h1>
                <p className="max-w-2xl text-ink-soft">
                    ¿Perdiste el enlace de tu pedido o lo hiciste desde otro dispositivo? Escribe el
                    código del pedido y el correo que usaste al comprar, y te enviamos un enlace
                    nuevo para verlo.
                </p>
            </div>

            <div className="max-w-xl">
                {sentTo ? (
                    <Card padding="lg" className="space-y-4 text-center">
                        <span
                            aria-hidden="true"
                            className="mx-auto flex size-14 items-center justify-center rounded-full bg-mint-200 text-ink"
                        >
                            <MailCheck className="size-6" />
                        </span>
                        <h2 className="font-display text-2xl text-ink">Revisa tu correo</h2>
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
                                    hint="Ejemplo: MR-000123"
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
                            <p className="text-sm text-ink-soft">
                                ¿Hiciste el pedido desde este dispositivo? Míralo en{' '}
                                <Link to={ROUTES.myOrders} className={linkClass}>
                                    Mis pedidos
                                </Link>
                                .
                            </p>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    )
}
