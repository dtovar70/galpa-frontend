import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck, MessageCircle, Package, Send, X } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useSearchParams } from 'react-router'

import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Alert, Button, Card, Input, Select, Textarea, type SelectOption } from '@/components/ui'
import { ContactService } from '@/services/ContactService'
import { getErrorMessage, isApiError } from '@/services/errors'
import { withCapitalizedWords } from '@/utils/capitalizeWords'
import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import {
    CONTACT_AREA_MAX,
    CONTACT_FIELDS,
    CONTACT_MESSAGE_MAX_LENGTH,
    contactSchema,
    CONTACT_TOPIC_LABELS,
    CONTACT_TOPICS,
    SPACE_TYPE_LABELS,
    SPACE_TYPES,
    type ContactValues,
} from '@/views/contact/schema/contact.schema'
import { productDetailQueryOptions } from '@/views/product/hooks/useProduct'

const TOPIC_OPTIONS: SelectOption[] = CONTACT_TOPICS.map((topic) => ({
    value: topic,
    label: CONTACT_TOPIC_LABELS[topic],
}))

const SPACE_OPTIONS: SelectOption[] = [
    { value: '', label: 'Prefiero no indicarlo' },
    ...SPACE_TYPES.map((type) => ({ value: type, label: SPACE_TYPE_LABELS[type] })),
]

/** `?producto=<slug>`: set by "Solicitar asesoría" on a product page. */
const ADVISORY_PRODUCT_PARAM = 'producto'

function defaultValues(productSlug: string): ContactValues {
    return {
        fullName: '',
        email: '',
        phone: '',
        topic: 'ASESORIA',
        spaceType: '',
        areaM2: '',
        productSlug,
        message: '',
        website: '',
    }
}

/** What the WhatsApp fallback pre-fills: who writes and the message they could not send. */
function whatsappFallbackText(values: ContactValues): string {
    const name = values.fullName.trim()
    const intro = name ? `Hola, soy ${name}.` : 'Hola.'
    return `${intro} ${CONTACT_TOPIC_LABELS[values.topic]}: ${values.message.trim()}`
}

function parseArea(value: string): number | undefined {
    if (!value) return undefined
    const area = Number(value.replace(',', '.'))
    return Number.isFinite(area) ? area : undefined
}

export function ContactForm() {
    const { contact } = useSiteContent()
    const [searchParams, setSearchParams] = useSearchParams()
    const linkedSlug = searchParams.get(ADVISORY_PRODUCT_PARAM)?.trim() ?? ''
    const [sentToName, setSentToName] = useState<string | null>(null)
    const [failure, setFailure] = useState<{ message: string; whatsappText: string } | null>(null)
    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ContactValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: defaultValues(linkedSlug),
    })
    const productSlug = useWatch({ control, name: 'productSlug' })
    // The name of the linked product; an unknown slug simply shows the slug.
    const { data: linkedProduct } = useQuery({
        ...productDetailQueryOptions(productSlug),
        enabled: productSlug !== '',
        retry: false,
    })

    const clearProduct = () => {
        setValue('productSlug', '')
        const next = new URLSearchParams(searchParams)
        next.delete(ADVISORY_PRODUCT_PARAM)
        setSearchParams(next, { replace: true })
    }

    const onSubmit = handleSubmit(async (values) => {
        setFailure(null)
        try {
            await ContactService.send({
                name: values.fullName,
                email: values.email,
                phone: values.phone,
                topic: values.topic,
                spaceType: values.spaceType || undefined,
                areaM2: parseArea(values.areaM2),
                productSlug: values.productSlug,
                message: values.message,
                website: values.website,
            })
        } catch (error) {
            if (isApiError(error, 400) && error.details.length) {
                let pinned = false
                for (const detail of error.details) {
                    // The API names the full name `name`; the form field is `fullName`.
                    const apiField = detail.field === 'name' ? 'fullName' : detail.field
                    const field = CONTACT_FIELDS.find((name) => name === apiField)
                    const message = detail.errors[0]
                    if (field && message) {
                        setError(field, { type: 'server', message })
                        pinned = true
                    }
                }
                if (pinned) return
            }
            setFailure({
                message: getErrorMessage(
                    error,
                    'No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.',
                ),
                whatsappText: whatsappFallbackText(values),
            })
            return
        }
        setSentToName(values.fullName)
        reset(defaultValues(''))
    })

    if (sentToName) {
        return (
            <Card padding="lg" className="space-y-4 text-center">
                <span
                    aria-hidden="true"
                    className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-700"
                >
                    <CircleCheck className="size-7" />
                </span>
                <h2 className="text-2xl text-ink">¡Gracias, {sentToName}!</h2>
                <p className="text-sm text-ink-soft">
                    Recibimos tu solicitud. Un asesor te responderá en menos de 24 horas hábiles con
                    una recomendación para tu espacio.
                </p>
                <Button variant="secondary" onClick={() => setSentToName(null)}>
                    Enviar otra consulta
                </Button>
            </Card>
        )
    }

    return (
        <Card padding="lg">
            <form onSubmit={onSubmit} noValidate className="space-y-5">
                <fieldset className="space-y-5" disabled={isSubmitting}>
                    <legend className="mb-2 text-xl font-bold text-ink">
                        Solicita tu asesoría
                    </legend>

                    {productSlug ? (
                        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
                            <Package
                                aria-hidden="true"
                                className="size-5 shrink-0 text-brand-700"
                            />
                            <p className="min-w-0 flex-1 text-brand-900">
                                Consulta sobre{' '}
                                <span className="font-semibold">
                                    {linkedProduct
                                        ? `${linkedProduct.brand} · ${linkedProduct.name}`
                                        : productSlug}
                                </span>
                            </p>
                            <button
                                type="button"
                                onClick={clearProduct}
                                aria-label="Quitar el producto de la consulta"
                                className="grid size-8 shrink-0 place-items-center rounded-full text-brand-800 transition hover:bg-brand-100"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </div>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Input
                            label="Nombre y apellido"
                            autoComplete="name"
                            autoCapitalize="words"
                            error={errors.fullName?.message}
                            {...withCapitalizedWords(register('fullName'))}
                        />
                        <Input
                            label="Correo"
                            type="email"
                            autoComplete="email"
                            error={errors.email?.message}
                            {...register('email')}
                        />
                    </div>
                    <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                            <MobilePhoneField
                                label="WhatsApp"
                                optional
                                autoComplete="tel-national"
                                hint="Si lo dejas, un asesor te puede responder por WhatsApp."
                                error={errors.phone?.message}
                                {...field}
                            />
                        )}
                    />
                    <Select
                        label="¿En qué te ayudamos?"
                        options={TOPIC_OPTIONS}
                        error={errors.topic?.message}
                        {...register('topic')}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Select
                            label="Tipo de espacio"
                            optional
                            options={SPACE_OPTIONS}
                            error={errors.spaceType?.message}
                            {...register('spaceType')}
                        />
                        <Input
                            label="Área aproximada (m²)"
                            optional
                            type="number"
                            inputMode="decimal"
                            min={1}
                            max={CONTACT_AREA_MAX}
                            step="any"
                            error={errors.areaM2?.message}
                            {...register('areaM2')}
                        />
                    </div>
                    <Textarea
                        label="Tu mensaje"
                        rows={5}
                        hint="Cuéntanos qué espacio quieres climatizar, cuánto sol recibe y cualquier detalle de la instalación."
                        error={errors.message?.message}
                        maxLength={CONTACT_MESSAGE_MAX_LENGTH}
                        {...register('message')}
                    />

                    {/* Honeypot: hidden from people and screen readers; bots fill it. */}
                    <div
                        aria-hidden="true"
                        className="absolute left-[-9999px] size-px overflow-hidden"
                    >
                        <label>
                            Sitio web
                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                {...register('website')}
                            />
                        </label>
                    </div>
                </fieldset>

                {failure ? (
                    <Alert tone="error" onDismiss={() => setFailure(null)}>
                        <p>{failure.message}</p>
                        {contact.whatsapp ? (
                            <a
                                href={whatsappUrl(contact.whatsapp, failure.whatsappText)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 rounded-sm font-semibold text-danger-800 underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                            >
                                <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                                Enviar esta consulta por WhatsApp
                            </a>
                        ) : null}
                    </Alert>
                ) : null}

                <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    trailingIcon={<Send aria-hidden="true" className="size-4" />}
                >
                    {isSubmitting ? 'Enviando…' : 'Enviar solicitud'}
                </Button>
            </form>
        </Card>
    )
}
