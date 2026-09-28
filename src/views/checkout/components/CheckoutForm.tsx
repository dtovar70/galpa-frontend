import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useEffect } from 'react'

import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Alert, Button, Input, Select, Textarea, type SelectOption } from '@/components/ui'
import { isApiError } from '@/services/errors'
import {
    CHECKOUT_FIELDS,
    CHECKOUT_NOTES_MAX_LENGTH,
    checkoutSchema,
    DELIVERY_METHOD_LABELS,
    DELIVERY_METHODS,
    type CheckoutValues,
    type DeliveryMethod,
} from '@/views/checkout/schema/checkout.schema'

const DELIVERY_OPTIONS: SelectOption[] = DELIVERY_METHODS.map((method) => ({
    value: method,
    label: DELIVERY_METHOD_LABELS[method],
}))

export interface CheckoutFormProps {
    /** Rejects with the API error; field errors are pinned here, the rest is up to the page. */
    onConfirm: (values: CheckoutValues) => Promise<void>
    onDeliveryMethodChange?: (method: DeliveryMethod) => void
    /** Blocks sending (e.g. no BCV rate): the button stays disabled. */
    disabled?: boolean
    /** Message for errors that are not about a field (shown above the button). */
    formError?: string | null
}

export function CheckoutForm({
    onConfirm,
    onDeliveryMethodChange,
    disabled = false,
    formError,
}: CheckoutFormProps) {
    const {
        register,
        handleSubmit,
        control,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            city: '',
            address: '',
            notes: '',
            deliveryMethod: 'delivery',
        },
    })

    const deliveryMethod = useWatch({ control, name: 'deliveryMethod' })
    useEffect(() => {
        onDeliveryMethodChange?.(deliveryMethod)
    }, [deliveryMethod, onDeliveryMethodChange])

    const submit = async (values: CheckoutValues) => {
        try {
            await onConfirm(values)
        } catch (error) {
            if (!isApiError(error, 400)) return
            for (const detail of error.details) {
                const field = CHECKOUT_FIELDS.find((name) => name === detail.field)
                const message = detail.errors[0]
                if (field && message) setError(field, { type: 'server', message })
            }
        }
    }

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
            <fieldset className="grid gap-5 sm:grid-cols-2" disabled={isSubmitting}>
                <legend className="mb-3 font-display text-xl text-ink">Tus datos</legend>

                <Input
                    label="Nombre y apellido"
                    autoComplete="name"
                    error={errors.fullName?.message}
                    {...register('fullName')}
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
                            label="Celular"
                            autoComplete="tel-national"
                            hint="Te avisamos por WhatsApp cómo va tu pedido."
                            error={errors.phone?.message}
                            {...field}
                        />
                    )}
                />
                <Input
                    label="Ciudad"
                    autoComplete="address-level2"
                    error={errors.city?.message}
                    {...register('city')}
                />

                <div className="sm:col-span-2">
                    <Input
                        label="Dirección"
                        autoComplete="street-address"
                        error={errors.address?.message}
                        {...register('address')}
                    />
                </div>

                <div className="sm:col-span-2">
                    <Select
                        label="Método de entrega"
                        options={DELIVERY_OPTIONS}
                        error={errors.deliveryMethod?.message}
                        {...register('deliveryMethod')}
                    />
                </div>

                <div className="sm:col-span-2">
                    <Textarea
                        label="Notas para el taller"
                        optional
                        hint="Cuéntanos si hay un color, una fecha o un detalle que debamos cuidar."
                        error={errors.notes?.message}
                        maxLength={CHECKOUT_NOTES_MAX_LENGTH}
                        {...register('notes')}
                    />
                </div>
            </fieldset>

            {formError ? <Alert>{formError}</Alert> : null}

            <div className="space-y-2">
                <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    disabled={disabled || isSubmitting}
                >
                    {isSubmitting ? 'Creando tu pedido…' : 'Confirmar pedido'}
                </Button>
                <p className="text-center text-xs text-ink-soft">
                    Después verás los datos de Pago Móvil y el monto exacto en bolívares.
                </p>
            </div>
        </form>
    )
}
