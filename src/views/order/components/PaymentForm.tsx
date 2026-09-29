import { useState, type ClipboardEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import type { SubmitPaymentInput } from '@/@types/order'
import { IdNumberField } from '@/components/shared/IdNumberField'
import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Alert, Button, Input, Select } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { getErrorMessage, isApiError } from '@/services/errors'
import { formatVeNumber } from '@/utils/formatBolivares'
import { todayInCaracas } from '@/utils/formatDate'
import { insertDigits, rejectNonDigits } from '@/utils/digitInput'
import { useBanks } from '@/utils/hooks/useBanks'
import { ProofDropzone } from '@/views/order/components/ProofDropzone'
import {
    PAYMENT_FIELDS,
    REFERENCE_DIGITS,
    paymentSchema,
    type PaymentFormInput,
    type PaymentFormValues,
} from '@/views/order/schema/payment.schema'

/** Digits typed, dropped (autofill, keyboards that skip `beforeinput`) or pasted: capped. */
function referenceDigits(value: string): string {
    return value.replace(/\D/g, '').slice(0, REFERENCE_DIGITS)
}

/**
 * A pasted whole reference ("Ref. 0012 3456 7890") keeps its last 6 digits, the ones asked for;
 * a shorter paste goes where the cursor is.
 */
function pastedReference(input: HTMLInputElement, text: string): string {
    const digits = text.replace(/\D/g, '')
    if (digits.length >= REFERENCE_DIGITS) return digits.slice(-REFERENCE_DIGITS)
    return insertDigits(input, digits, REFERENCE_DIGITS)
}

/** Day before `iso` in Caracas: the earliest payment date the API accepts. */
function dayBefore(iso: string): string {
    const created = new Date(new Date(iso).getTime() - 24 * 3_600_000)
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(created)
}

export interface PaymentFormProps {
    /** The order's creation date (earliest payment date is the day before). */
    createdAt: string
    /** The order's Bs total, frozen at creation: the amount field starts with it. */
    totalBs: number
    /** Sends the proof; a rejected promise with field errors pins them on the form. */
    onSubmit: (input: SubmitPaymentInput) => Promise<unknown>
    submitLabel?: string
    /**
     * Lets a surrounding dialog submit the form with its own button (`form={formId}`); the
     * form's button is then hidden.
     */
    formId?: string
    /** Where to find the reference's last digits; the admin reads the customer's proof. */
    referenceHint?: string
}

/**
 * The Pago Móvil proof form (reference, bank, phone, date, amount, screenshot). Step 2 of the
 * customer's order page, and the admin's "Registrar pago manualmente".
 */
export function PaymentForm({
    createdAt,
    totalBs,
    onSubmit,
    submitLabel = 'Enviar comprobante',
    formId,
    referenceHint = 'Los encuentras al final del número de referencia de tu comprobante.',
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
    } = useForm<PaymentFormInput, unknown, PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            reference: '',
            payerBankCode: '',
            payerPhone: '',
            payerIdNumber: '',
            paidOn: today,
            amountBs: formatVeNumber(totalBs),
        },
    })

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
                <Controller
                    control={control}
                    name="reference"
                    render={({ field }) => (
                        <Input
                            label="Últimos 6 dígitos de la referencia"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={REFERENCE_DIGITS}
                            placeholder="Ej. 567890"
                            hint={referenceHint}
                            error={errors.reference?.message}
                            {...field}
                            onBeforeInput={rejectNonDigits}
                            onChange={(event) =>
                                field.onChange(referenceDigits(event.target.value))
                            }
                            onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
                                event.preventDefault()
                                const text = event.clipboardData.getData('text')
                                field.onChange(pastedReference(event.currentTarget, text))
                            }}
                        />
                    )}
                />
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
                <Controller
                    control={control}
                    name="payerIdNumber"
                    render={({ field }) => (
                        <IdNumberField
                            label="Cédula del pagador"
                            optional
                            error={errors.payerIdNumber?.message}
                            {...field}
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
                <Input
                    label="Monto pagado (Bs)"
                    inputMode="decimal"
                    autoComplete="off"
                    hint="Ya viene con el monto exacto; cámbialo solo si pagaste otro."
                    error={errors.amountBs?.message}
                    {...register('amountBs')}
                />
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
