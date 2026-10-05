import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Pencil, Save } from 'lucide-react'
import { useForm, useWatch, type UseFormSetError } from 'react-hook-form'

import type { PaymentMethodInfo } from '@/@types/catalog'
import { PaymentMethodIconGlyph } from '@/components/shared/PaymentMethodIconGlyph'
import { Alert, Badge, Button, Input, Textarea, Tooltip } from '@/components/ui'
import { FIELD_LABEL_CLASS } from '@/components/ui/field.styles'
import { PAYMENT_METHOD_ICON_NAMES, PAYMENT_METHOD_ICONS } from '@/constants/payment.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { ReadOnlyFields } from '@/views/admin/catalogs/components/ReadOnlyFields'
import {
    CATALOG_DESCRIPTION_MAX_LENGTH,
    paymentMethodFormSchema,
    type PaymentMethodFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import { useUpdatePaymentMethod } from '@/views/admin/hooks/useAdminCatalogs'

/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while saving. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

const CURRENCY_LABELS = { VES: 'Bolívares', USD: 'Dólares' } as const

function toFormValues(method: PaymentMethodInfo): PaymentMethodFormValues {
    return { label: method.label, description: method.description, icon: method.icon }
}

function applyServerErrors(
    error: unknown,
    values: PaymentMethodFormValues,
    setError: UseFormSetError<PaymentMethodFormValues>,
): void {
    if (!isApiError(error)) return
    for (const detail of error.details) {
        const message = detail.errors[0]
        if (message && detail.field in values) {
            setError(detail.field as keyof PaymentMethodFormValues, { type: 'server', message })
        }
    }
}

export interface PaymentMethodRowProps {
    method: PaymentMethodInfo
    index: number
    total: number
    /** While a new order is being saved, moves are ignored. */
    isBusy: boolean
    onMove: (index: number, offset: -1 | 1) => void
}

/**
 * One payment method: position, icon, name, checkout help text and currency, and (expanded)
 * the form for what the business may change. The code and the currency stay fixed.
 */
export function PaymentMethodRow({ method, index, total, isBusy, onMove }: PaymentMethodRowProps) {
    const panelId = useId()
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const isFirst = index === 0
    const isLast = index === total - 1

    return (
        <li className="rounded-2xl border border-line bg-white shadow-soft">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
                <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-page text-sm font-bold text-ink">
                        <span className="sr-only">Posición </span>
                        {index + 1}
                    </span>
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <PaymentMethodIconGlyph name={method.icon} className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="min-w-0 text-lg font-bold break-words text-ink">
                                {method.label}
                            </h3>
                            <Badge tone="neutral" size="sm">
                                {method.currency === 'VES' ? 'Bs' : 'USD'}
                            </Badge>
                        </div>
                        <p className="text-sm break-words text-ink-soft">{method.description}</p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Tooltip label="Subir" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isFirst) onMove(index, -1)
                            }}
                            aria-disabled={isBusy || isFirst}
                            aria-label={`Subir ${method.label}`}
                            className={actionClass}
                        >
                            <ArrowUp aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip label="Bajar" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isLast) onMove(index, 1)
                            }}
                            aria-disabled={isBusy || isLast}
                            aria-label={`Bajar ${method.label}`}
                            className={actionClass}
                        >
                            <ArrowDown aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip
                        label={isExpanded ? 'Cerrar edición' : 'Editar'}
                        placement="top"
                        align="end"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setHasOpened(true)
                                setIsExpanded((current) => !current)
                            }}
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            aria-label={`Editar ${method.label}`}
                            className={cn(actionClass, isExpanded && 'bg-brand-100 text-brand-700')}
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {hasOpened ? (
                <div
                    id={panelId}
                    hidden={!isExpanded}
                    className="@container border-t border-line p-4 sm:p-6"
                >
                    <PaymentMethodForm method={method} />
                </div>
            ) : null}
        </li>
    )
}

/** The icons a method may use, as a radio group of swatches. */
function IconField({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
    const name = useId()
    return (
        <fieldset className="space-y-2">
            <legend className={FIELD_LABEL_CLASS}>Ícono</legend>
            <div className="flex flex-wrap gap-2">
                {PAYMENT_METHOD_ICON_NAMES.map((icon) => {
                    const { icon: Glyph, label } = PAYMENT_METHOD_ICONS[icon]
                    const isSelected = icon === value
                    return (
                        <label
                            key={icon}
                            className={cn(
                                'flex w-18 cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition has-focus-visible:ring-2 has-focus-visible:ring-brand-500',
                                isSelected
                                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                                    : 'border-line text-ink-soft hover:border-line-strong',
                            )}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={icon}
                                checked={isSelected}
                                onChange={() => onChange(icon)}
                                className="sr-only"
                            />
                            <Glyph aria-hidden="true" className="size-5" />
                            <span className="text-xs">{label}</span>
                        </label>
                    )
                })}
            </div>
        </fieldset>
    )
}

function PaymentMethodForm({ method }: { method: PaymentMethodInfo }) {
    const update = useUpdatePaymentMethod()
    const [isSaved, setIsSaved] = useState(false)
    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        formState: { errors, isDirty },
    } = useForm<PaymentMethodFormValues>({
        resolver: zodResolver(paymentMethodFormSchema),
        defaultValues: toFormValues(method),
    })
    const values = useWatch({ control })

    const submit = handleSubmit((form) => {
        setIsSaved(false)
        update.mutate(
            { code: method.code, input: form },
            {
                onSuccess: (methods) => {
                    const saved = methods.find((item) => item.code === method.code)
                    reset(saved ? toFormValues(saved) : form)
                    setIsSaved(true)
                },
                onError: (error) => applyServerErrors(error, form, setError),
            },
        )
    })

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 items-start gap-5 @2xl:grid-cols-2">
                <div className="space-y-5">
                    <Input
                        label="Nombre"
                        hint="Checkout, página del pedido, panel, correos, Telegram y comprobante."
                        error={errors.label?.message}
                        {...register('label')}
                    />
                    <Textarea
                        label="Descripción en el checkout"
                        rows={2}
                        maxLength={CATALOG_DESCRIPTION_MAX_LENGTH}
                        hint="Una frase corta bajo el nombre, por ejemplo en qué moneda se paga."
                        error={errors.description?.message}
                        {...register('description')}
                    />
                    <IconField
                        value={values.icon ?? method.icon}
                        onChange={(icon) =>
                            setValue('icon', icon, { shouldDirty: true, shouldValidate: true })
                        }
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-sm font-semibold text-ink">Vista previa en el checkout</p>
                    <div className="flex gap-3 rounded-xl border border-brand-500 bg-white p-4 ring-1 ring-brand-500">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
                            <PaymentMethodIconGlyph
                                name={values.icon ?? method.icon}
                                className="size-5"
                            />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                            <span className="block font-semibold break-words text-ink">
                                {values.label?.trim() || method.label}
                            </span>
                            <span className="block text-xs break-words text-ink-soft">
                                {values.description?.trim() || '—'}
                            </span>
                        </span>
                    </div>
                    <ReadOnlyFields
                        fields={[
                            { label: 'Código', value: <code>{method.code}</code> },
                            { label: 'Moneda', value: CURRENCY_LABELS[method.currency] },
                        ]}
                        explanation="No se pueden cambiar: de ellos dependen los datos que se piden en el pago y el monto a cobrar."
                    />
                </div>
            </div>

            {update.isError ? <Alert>{getErrorMessage(update.error)}</Alert> : null}
            {isSaved ? (
                <Alert
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setIsSaved(false)}
                >
                    Método de pago actualizado. El cambio ya se ve en la tienda.
                </Alert>
            ) : null}

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!isDirty || update.isPending}
                    isLoading={update.isPending}
                    leadingIcon={<Save aria-hidden="true" className="size-4" />}
                >
                    Guardar
                </Button>
            </div>
        </form>
    )
}
