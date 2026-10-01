import { useState, type ClipboardEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { PAYMENT_METHODS, type PaymentMethod, type SubmitPaymentInput } from '@/@types/order'
import { IdNumberField } from '@/components/shared/IdNumberField'
import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Alert, Button, Input, Select, type SelectOption } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { isBolivarMethod, paymentMethodLabel } from '@/constants/payment.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { formatVeNumber } from '@/utils/formatBolivares'
import { todayInCaracas } from '@/utils/formatDate'
import { useBanks } from '@/utils/hooks/useBanks'
import { ProofDropzone } from '@/views/order/components/ProofDropzone'
import {
    cleanReference,
    PAYMENT_FIELDS,
    paymentSchema,
    REFERENCE_RULES,
    type PaymentFormValues,
} from '@/views/order/schema/payment.schema'

const METHOD_OPTIONS: SelectOption[] = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: paymentMethodLabel(method),
}))

const REFERENCE_LABELS: Record<PaymentMethod, { label: string; hint: string }> = {
    PAGO_MOVIL: {
        label: 'Número de referencia',
        hint: 'El número completo que aparece en el comprobante del Pago Móvil.',
    },
    TRANSFERENCIA: {
        label: 'Número de referencia',
        hint: 'El número de la operación que aparece en el comprobante de tu banco.',
    },
    ZELLE: {
        label: 'Código de confirmación',
        hint: 'El código que muestra tu banco al enviar el Zelle.',
    },
    BINANCE: {
        label: 'ID de la orden',
        hint: 'El Order ID de la transferencia en Binance Pay.',
    },
}

/** Day before `iso` in Caracas: the earliest payment date the API accepts. */
function dayBefore(iso: string): string {
    const created = new Date(new Date(iso).getTime() - 24 * 3_600_000)
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(created)
}

export interface PaymentFormProps {
    /** The order's creation date (earliest payment date is the day before). */
    createdAt: string
    /** The method chosen for the order. */
    method: PaymentMethod
    /** Lets the admin record a payment made with another method. */
    allowMethodChange?: boolean
    /** The order's totals, frozen at creation: the amount field starts with the right one. */
    totalBs: number
    totalUsd: number
    /** Sends the proof; a rejected promise with field errors pins them on the form. */
    onSubmit: (input: SubmitPaymentInput) => Promise<unknown>
    submitLabel?: string
    /**
     * Lets a surrounding dialog submit the form with its own button (`form={formId}`); the
     * form's button is then hidden.
     */
    formId?: string
}

/**
 * The payment proof form, with the fields of each method (bank and phone for Pago Móvil,
 * holder for Zelle…) and the screenshot. Step 2 of the customer's order page, and the admin's
 * "Registrar pago manualmente".
 */
export function PaymentForm({
    createdAt,
    method: initialMethod,
    allowMethodChange = false,
    totalBs,
    totalUsd,
    onSubmit,
    submitLabel = 'Enviar comprobante',
    formId,
}: PaymentFormProps) {
    const [proof, setProof] = useState<File | null>(null)
    const [proofError, setProofError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | null>(null)
    const today = todayInCaracas()
    const banks = useBanks()

    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            method: initialMethod,
            reference: '',
            paidOn: today,
            payerBankCode: '',
            payerPhone: '',
            payerIdNumber: '',
            payerName: '',
            payerAccount: '',
            amountBs: formatVeNumber(totalBs),
            amountUsd: formatVeNumber(totalUsd),
        },
    })
    const method = useWatch({ control, name: 'method' })
    const inBolivares = isBolivarMethod(method)
    const referenceRule = REFERENCE_RULES[method]

    const submit = async (values: PaymentFormValues) => {
        setFormError(null)
        setProofError(undefined)
        try {
            await onSubmit({ ...values, proof })
        } catch (error) {
            if (isApiError(error, 400) && error.details.length) {
                for (const detail of error.details) {
                    const message = detail.errors[0]
                    if (!message) continue
                    if (detail.field === 'proof') setProofError(message)
                    const field = PAYMENT_FIELDS.find((name) => name === detail.field)
                    if (field) setError(field, { type: 'server', message })
                }
                return
            }
            setFormError(getErrorMessage(error, 'No pudimos enviar tu pago. Intenta de nuevo.'))
        }
    }

    return (
        <form id={formId} onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
            <fieldset className="grid gap-5 sm:grid-cols-2" disabled={isSubmitting}>
                <legend className="sr-only">Datos del pago</legend>

                {allowMethodChange ? (
                    <div className="sm:col-span-2">
                        <Select
                            label="Método de pago"
                            options={METHOD_OPTIONS}
                            error={errors.method?.message}
                            {...register('method')}
                        />
                    </div>
                ) : null}

                <Controller
                    control={control}
                    name="reference"
                    render={({ field }) => (
                        <Input
                            label={REFERENCE_LABELS[method].label}
                            inputMode={referenceRule.digitsOnly ? 'numeric' : 'text'}
                            autoComplete="off"
                            autoCapitalize="characters"
                            maxLength={referenceRule.max}
                            hint={REFERENCE_LABELS[method].hint}
                            error={errors.reference?.message}
                            {...field}
                            onChange={(event) =>
                                field.onChange(cleanReference(method, event.target.value))
                            }
                            onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
                                event.preventDefault()
                                const text = event.clipboardData.getData('text')
                                field.onChange(cleanReference(method, text))
                            }}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="paidOn"
                    render={({ field }) => (
                        <DatePicker
                            label="Fecha del pago"
                            min={dayBefore(createdAt)}
                            max={today}
                            error={errors.paidOn?.message}
                            {...field}
                        />
                    )}
                />

                {inBolivares ? (
                    <>
                        <Select
                            label="Banco desde el que pagaste"
                            placeholder={banks.isPending ? 'Cargando bancos…' : 'Elige tu banco'}
                            options={banks.options}
                            disabled={banks.isPending}
                            error={
                                errors.payerBankCode?.message ??
                                (banks.isError
                                    ? 'No pudimos cargar la lista de bancos. Recarga la página.'
                                    : undefined)
                            }
                            {...register('payerBankCode')}
                        />
                        <Controller
                            control={control}
                            name="payerIdNumber"
                            render={({ field }) => (
                                <IdNumberField
                                    label="Cédula o RIF del titular"
                                    error={errors.payerIdNumber?.message}
                                    {...field}
                                />
                            )}
                        />
                        {method === 'PAGO_MOVIL' ? (
                            <Controller
                                control={control}
                                name="payerPhone"
                                render={({ field }) => (
                                    <MobilePhoneField
                                        label="Teléfono del pagador"
                                        hint="El celular desde el que hiciste el Pago Móvil."
                                        error={errors.payerPhone?.message}
                                        {...field}
                                    />
                                )}
                            />
                        ) : null}
                        <Input
                            label="Monto pagado (Bs)"
                            inputMode="decimal"
                            autoComplete="off"
                            hint="Ya viene con el monto exacto; cámbialo solo si pagaste otro."
                            error={errors.amountBs?.message}
                            className="font-tech"
                            {...register('amountBs')}
                        />
                    </>
                ) : (
                    <>
                        {method === 'ZELLE' ? (
                            <Input
                                label="Titular de la cuenta Zelle"
                                autoComplete="name"
                                error={errors.payerName?.message}
                                {...register('payerName')}
                            />
                        ) : null}
                        <Input
                            label={
                                method === 'ZELLE'
                                    ? 'Correo o teléfono de Zelle'
                                    : 'Binance Pay ID o correo'
                            }
                            autoComplete="off"
                            error={errors.payerAccount?.message}
                            {...register('payerAccount')}
                        />
                        <Input
                            label="Monto pagado (USD)"
                            inputMode="decimal"
                            autoComplete="off"
                            hint="Ya viene con el total del pedido; cámbialo solo si pagaste otro."
                            error={errors.amountUsd?.message}
                            className="font-tech"
                            {...register('amountUsd')}
                        />
                    </>
                )}

                <div className="sm:col-span-2">
                    <ProofDropzone
                        file={proof}
                        onChange={(file) => {
                            setProof(file)
                            setProofError(undefined)
                        }}
                        error={proofError}
                        disabled={isSubmitting}
                    />
                </div>
            </fieldset>

            {formError ? <Alert>{formError}</Alert> : null}

            {formId ? null : (
                <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                    {isSubmitting ? 'Enviando…' : submitLabel}
                </Button>
            )}
        </form>
    )
}
