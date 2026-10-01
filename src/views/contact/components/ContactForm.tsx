import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageCircle, PartyPopper, Send } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Alert, Button, Card, Input, Select, Textarea, type SelectOption } from '@/components/ui'
import { ContactService } from '@/services/ContactService'
import { getErrorMessage, isApiError } from '@/services/errors'
import {
    CONTACT_FIELDS,
    CONTACT_MESSAGE_MAX_LENGTH,
    contactSchema,
    CONTACT_TOPIC_LABELS,
    CONTACT_TOPICS,
    type ContactValues,
} from '@/views/contact/schema/contact.schema'
import { withCapitalizedWords } from '@/utils/capitalizeWords'
import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

const TOPIC_OPTIONS: SelectOption[] = CONTACT_TOPICS.map((topic) => ({
    value: topic,
    label: CONTACT_TOPIC_LABELS[topic],
}))

const DEFAULT_VALUES: ContactValues = {
    fullName: '',
    email: '',
    phone: '',
    topic: 'personalizado',
    message: '',
    website: '',
}

/** What the WhatsApp fallback pre-fills: who writes and the message they could not send. */
function whatsappFallbackText(values: ContactValues): string {
    const name = values.fullName.trim()
    const intro = name ? `Hola, soy ${name}.` : 'Hola.'
    return `${intro} ${CONTACT_TOPIC_LABELS[values.topic]}: ${values.message.trim()}`
}

export function ContactForm() {
    const { contact } = useSiteContent()
    const [sentToName, setSentToName] = useState<string | null>(null)
    const [failure, setFailure] = useState<{ message: string; whatsappText: string } | null>(null)
    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ContactValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: DEFAULT_VALUES,
    })

    const onSubmit = handleSubmit(async (values) => {
        setFailure(null)
        try {
            await ContactService.send(values)
        } catch (error) {
            if (isApiError(error, 400) && error.details.length) {
                let pinned = false
                for (const detail of error.details) {
                    const field = CONTACT_FIELDS.find((name) => name === detail.field)
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
                    'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.',
                ),
                whatsappText: whatsappFallbackText(values),
            })
            return
        }
        setSentToName(values.fullName)
        reset(DEFAULT_VALUES)
    })

    if (sentToName) {
        return (
            <Card padding="lg" className="space-y-4 text-center">
                <span
                    aria-hidden="true"
                    className="mx-auto flex size-14 items-center justify-center rounded-full bg-mint-200 text-ink"
                >
                    <PartyPopper className="size-6" />
                </span>
                <h2 className="font-display text-2xl text-ink">¡Mensaje enviado, {sentToName}!</h2>
                <p className="text-sm text-ink-soft">
                    Te respondemos en menos de 24 horas hábiles con una propuesta y un presupuesto.
                </p>
                <Button variant="secondary" onClick={() => setSentToName(null)}>
                    Enviar otro mensaje
                </Button>
            </Card>
        )
    }

    return (
        <Card padding="lg">
            <form onSubmit={onSubmit} noValidate className="space-y-5">
                <fieldset className="space-y-5" disabled={isSubmitting}>
                    <legend className="mb-2 font-display text-xl text-ink">Escríbenos</legend>

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
                    <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                            <MobilePhoneField
                                label="WhatsApp"
                                optional
                                autoComplete="tel-national"
                                hint="Si lo dejas, te podemos responder por WhatsApp."
                                error={errors.phone?.message}
                                {...field}
                            />
                        )}
                    />
                    <Select
                        label="¿Sobre qué quieres hablar?"
                        options={TOPIC_OPTIONS}
                        error={errors.topic?.message}
                        {...register('topic')}
                    />
                    <Textarea
                        label="Tu mensaje"
                        rows={5}
                        hint="Cuéntanos la idea, la cantidad y para cuándo la necesitas."
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
                                className="mt-2 inline-flex items-center gap-1 rounded-sm font-semibold text-blush-700 underline underline-offset-2 hover:text-blush-800 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
                            >
                                <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                                Enviar este mensaje por WhatsApp
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
                    {isSubmitting ? 'Enviando…' : 'Enviar mensaje'}
                </Button>
            </form>
        </Card>
    )
}
