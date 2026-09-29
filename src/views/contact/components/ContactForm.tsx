import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { PartyPopper, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button, Card, Input, Select, Textarea, type SelectOption } from '@/components/ui'
import {
    CONTACT_MESSAGE_MAX_LENGTH,
    contactSchema,
    CONTACT_TOPIC_LABELS,
    CONTACT_TOPICS,
    type ContactValues,
} from '@/views/contact/schema/contact.schema'
import { withCapitalizedWords } from '@/utils/capitalizeWords'

const SUBMIT_DELAY_MS = 1200

const TOPIC_OPTIONS: SelectOption[] = CONTACT_TOPICS.map((topic) => ({
    value: topic,
    label: CONTACT_TOPIC_LABELS[topic],
}))

export function ContactForm() {
    const [sentToName, setSentToName] = useState<string | null>(null)
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: { fullName: '', email: '', topic: 'personalizado', message: '' },
    })

    const onSubmit = handleSubmit(async (values) => {
        await new Promise((resolve) => setTimeout(resolve, SUBMIT_DELAY_MS))
        setSentToName(values.fullName)
        reset()
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
                </fieldset>

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
