import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Store, Truck, type LucideIcon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import type { PaymentMethod } from '@/@types/order'
import { CheckboxField } from '@/components/shared/CheckboxField'
import { IdNumberField } from '@/components/shared/IdNumberField'
import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import { DELIVERY_METHOD_LABELS } from '@/constants/order.constant'
import { isBolivarMethod } from '@/constants/payment.constant'
import { isApiError } from '@/services/errors'
import { withCapitalizedWords } from '@/utils/capitalizeWords'
import { cn } from '@/utils/cn'
import { PaymentMethodPicker } from '@/views/checkout/components/PaymentMethodPicker'
import {
    CHECKOUT_FIELDS,
    CHECKOUT_NOTES_MAX_LENGTH,
    checkoutSchema,
    DELIVERY_METHODS,
    type CheckoutValues,
    type DeliveryMethod,
} from '@/views/checkout/schema/checkout.schema'

const DELIVERY_DETAILS: Record<DeliveryMethod, { icon: LucideIcon; description: string }> = {
    delivery: { icon: Truck, description: 'Llevamos tu pedido a la dirección que indiques.' },
    pickup: { icon: Store, description: 'Lo retiras en nuestra tienda, sin costo de envío.' },
}

export interface CheckoutFormProps {
    /** Rejects with the API error; field errors are pinned here, the rest is up to the page. */
    onConfirm: (values: CheckoutValues) => Promise<void>
    onDeliveryMethodChange?: (method: DeliveryMethod) => void
    /** Payment methods the store offers right now (never empty here). */
    paymentMethods: readonly PaymentMethod[]
    /** Order total in USD, for the amounts on the payment cards. */
    total: number
    /** BCV rate; null while unknown. */
    rate: number | null
    /** Message for errors that are not about a field (shown above the button). */
    formError?: string | null
}

export function CheckoutForm({
    onConfirm,
    onDeliveryMethodChange,
    paymentMethods,
    total,
    rate,
    formError,
}: CheckoutFormProps) {
    const {
        register,
        handleSubmit,
        control,
        setError,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            customerIdNumber: '',
            city: '',
            address: '',
            notes: '',
            deliveryMethod: 'delivery',
            paymentMethod: paymentMethods[0],
            wantsInstallation: false,
        },
    })

    const deliveryMethod = useWatch({ control, name: 'deliveryMethod' })
    const paymentMethod = useWatch({ control, name: 'paymentMethod' })
    useEffect(() => {
        onDeliveryMethodChange?.(deliveryMethod)
    }, [deliveryMethod, onDeliveryMethodChange])

    // A method that stops being offered (e.g. the BCV rate went missing) falls back to the first.
    useEffect(() => {
        const current = getValues('paymentMethod')
        const first = paymentMethods[0]
        if (first && !paymentMethods.includes(current)) setValue('paymentMethod', first)
    }, [paymentMethods, getValues, setValue])

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
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-8">
            <fieldset className="grid gap-5 sm:grid-cols-2" disabled={isSubmitting}>
                <legend className="mb-3 text-xl font-bold text-ink">Tus datos</legend>

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
                            label="Celular"
                            autoComplete="tel-national"
                            hint="Te avisamos por WhatsApp cómo va tu pedido."
                            error={errors.phone?.message}
                            {...field}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="customerIdNumber"
                    render={({ field }) => (
                        <IdNumberField
                            label="Cédula o RIF"
                            optional
                            hint="Para tu factura."
                            error={errors.customerIdNumber?.message}
                            {...field}
                        />
                    )}
                />
            </fieldset>

            <fieldset className="space-y-4" disabled={isSubmitting}>
                <legend className="mb-3 text-xl font-bold text-ink">Entrega</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                    {DELIVERY_METHODS.map((method) => {
                        const { icon: Icon, description } = DELIVERY_DETAILS[method]
                        const isSelected = deliveryMethod === method
                        return (
                            <label
                                key={method}
                                className={cn(
                                    'flex cursor-pointer gap-3 rounded-xl border bg-white p-4 transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500 has-[input:focus-visible]:ring-offset-2',
                                    isSelected
                                        ? 'border-brand-500 ring-1 ring-brand-500'
                                        : 'border-line-strong hover:border-ink/40',
                                )}
                            >
                                <input
                                    type="radio"
                                    value={method}
                                    className="sr-only"
                                    {...register('deliveryMethod')}
                                />
                                <span
                                    className={cn(
                                        'grid size-10 shrink-0 place-items-center rounded-lg',
                                        isSelected ? 'bg-brand-600 text-white' : 'bg-mist text-ink',
                                    )}
                                >
                                    <Icon aria-hidden="true" className="size-5" />
                                </span>
                                <span className="space-y-0.5">
                                    <span className="block font-semibold text-ink">
                                        {DELIVERY_METHOD_LABELS[method]}
                                    </span>
                                    <span className="block text-xs text-ink-soft">
                                        {description}
                                    </span>
                                </span>
                            </label>
                        )
                    })}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                        label="Ciudad"
                        autoComplete="address-level2"
                        error={errors.city?.message}
                        {...register('city')}
                    />
                    <Input
                        label="Dirección"
                        autoComplete="street-address"
                        error={errors.address?.message}
                        {...register('address')}
                    />
                </div>

                <Controller
                    control={control}
                    name="wantsInstallation"
                    render={({ field }) => (
                        <CheckboxField
                            checked={field.value}
                            onChange={field.onChange}
                            hint="Un asesor te contactará para orientarte sobre la instalación de tu equipo."
                        >
                            Deseo asesoría para la instalación
                        </CheckboxField>
                    )}
                />

                <Textarea
                    label="Notas del pedido"
                    optional
                    hint="Indicaciones para la entrega, horarios o cualquier detalle que debamos saber."
                    error={errors.notes?.message}
                    maxLength={CHECKOUT_NOTES_MAX_LENGTH}
                    {...register('notes')}
                />
            </fieldset>

            <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                    <PaymentMethodPicker
                        methods={paymentMethods}
                        value={field.value}
                        onChange={field.onChange}
                        total={total}
                        rate={rate}
                        error={errors.paymentMethod?.message}
                        disabled={isSubmitting}
                    />
                )}
            />

            {formError ? <Alert>{formError}</Alert> : null}

            <div className="space-y-2">
                <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                    {isSubmitting ? 'Creando tu pedido…' : 'Confirmar pedido'}
                </Button>
                <p className="text-center text-xs text-ink-soft">
                    {paymentMethod && isBolivarMethod(paymentMethod)
                        ? 'Después verás los datos de pago y el monto exacto en bolívares.'
                        : 'Después verás los datos para hacer tu pago en dólares.'}
                </p>
            </div>
        </form>
    )
}
