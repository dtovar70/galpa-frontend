import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Pencil, Save } from 'lucide-react'
import { useForm, useWatch, type UseFormSetError } from 'react-hook-form'

import type { OrderStatusInfo } from '@/@types/catalog'
import type { OrderStatus } from '@/@types/order'
import { Alert, Badge, Button, Input, Textarea, Tooltip } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { STATUS_TONE_VARIANTS } from '@/constants/tone.constant'
import { cn } from '@/utils/cn'
import { useFillPlaceholders } from '@/utils/hooks/useSiteContent'
import { ReadOnlyFields } from '@/views/admin/catalogs/components/ReadOnlyFields'
import { ToneField } from '@/views/admin/catalogs/components/ToneField'
import { WhatsAppTemplateField } from '@/views/admin/catalogs/components/WhatsAppTemplateField'
import {
    CATALOG_DESCRIPTION_MAX_LENGTH,
    createOrderStatusFormSchema,
    type OrderStatusFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import { RECEIPT_STATUSES } from '@/views/admin/catalogs/utils/whatsappTemplate'
import { useUpdateOrderStatus } from '@/views/admin/hooks/useAdminCatalogs'

const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2'

/** Where the customer message of a status is not the whole story. */
const MESSAGE_NOTES: Partial<Record<OrderStatus, string>> = {
    ESPERANDO_MERCANCIA:
        'Solo aparece en pedidos con equipos bajo pedido. Si escribes una nota al marcarlo, el cliente ve esa nota.',
    LISTO_PARA_RETIRO: 'Solo para pedidos con retiro en tienda.',
    DESPACHADO:
        'Solo para pedidos con envío. Si al despacharlo escribes el transporte y la guía, el cliente ve esa nota.',
    CANCELADO: 'Si escribes un motivo al cancelar, el cliente ve ese motivo.',
    EXPIRADO: 'También se muestra cuando el plazo para pagar venció pero aún puede pagar.',
}

function toFormValues(status: OrderStatusInfo, whatsappTemplate: string): OrderStatusFormValues {
    return {
        whatsappTemplate,
        label: status.label,
        tone: status.tone,
        customerLabel: status.customerLabel,
        customerTitle: status.customerTitle ?? '',
        customerDescription: status.customerDescription ?? '',
    }
}

function applyServerErrors(
    error: unknown,
    values: OrderStatusFormValues,
    setError: UseFormSetError<OrderStatusFormValues>,
): void {
    if (!isApiError(error)) return
    for (const detail of error.details) {
        const message = detail.errors[0]
        if (message && detail.field in values) {
            setError(detail.field as keyof OrderStatusFormValues, { type: 'server', message })
        }
    }
}

export interface OrderStatusRowProps {
    status: OrderStatusInfo
    /** Its "Avisar por WhatsApp" message (admin catalog). */
    whatsappTemplate: string
    /** Label of the tab the status belongs to. */
    groupLabel: string
}

/**
 * One order status: its badge, code and tab, and (expanded) the form for what the business may
 * rename: the admin label, the badge color and the customer texts, with a live preview.
 */
export function OrderStatusRow({ status, whatsappTemplate, groupLabel }: OrderStatusRowProps) {
    const panelId = useId()
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)

    return (
        <li className="rounded-2xl border border-line bg-white shadow-soft">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
                <div className="flex min-w-0 flex-1 basis-60 flex-wrap items-center gap-x-3 gap-y-1">
                    <Badge tone={STATUS_TONE_VARIANTS[status.tone]}>{status.label}</Badge>
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-soft">
                        <Lock aria-hidden="true" className="size-3" />
                        {status.code}
                    </span>
                    <span className="text-xs text-ink-soft">
                        Pestaña «{groupLabel}»{status.isTerminal ? ' · final' : ''}
                    </span>
                </div>
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
                        aria-label={`Editar ${status.label}`}
                        className={cn(actionClass, isExpanded && 'bg-brand-100 text-brand-700')}
                    >
                        <Pencil aria-hidden="true" className="size-4" />
                    </button>
                </Tooltip>
            </div>

            {hasOpened ? (
                <div
                    id={panelId}
                    hidden={!isExpanded}
                    className="@container border-t border-line p-4 sm:p-6"
                >
                    <OrderStatusForm
                        status={status}
                        whatsappTemplate={whatsappTemplate}
                        groupLabel={groupLabel}
                    />
                </div>
            ) : null}
        </li>
    )
}

function OrderStatusForm({ status, whatsappTemplate, groupLabel }: OrderStatusRowProps) {
    const update = useUpdateOrderStatus()
    const fill = useFillPlaceholders()
    const [isSaved, setIsSaved] = useState(false)
    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        formState: { errors, isDirty },
    } = useForm<OrderStatusFormValues>({
        resolver: zodResolver(createOrderStatusFormSchema(status.code)),
        defaultValues: toFormValues(status, whatsappTemplate),
    })
    const values = useWatch({ control })
    const whatsappField = register('whatsappTemplate')

    const submit = handleSubmit((form) => {
        setIsSaved(false)
        update.mutate(
            {
                code: status.code,
                input: {
                    label: form.label,
                    tone: form.tone,
                    customerLabel: form.customerLabel,
                    customerTitle: form.customerTitle || null,
                    customerDescription: form.customerDescription || null,
                    whatsappTemplate: form.whatsappTemplate,
                },
            },
            {
                onSuccess: (catalog) => {
                    const saved = catalog.statuses.find((item) => item.code === status.code)
                    reset(saved ? toFormValues(saved, saved.whatsappTemplate) : form)
                    setIsSaved(true)
                },
                onError: (error) => applyServerErrors(error, form, setError),
            },
        )
    })

    const previewLabel = values.label?.trim() || status.label
    const previewTitle = values.customerTitle?.trim() || values.customerLabel?.trim() || ''
    const previewBody = values.customerDescription?.trim()
    const note = MESSAGE_NOTES[status.code]

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 items-start gap-5 @2xl:grid-cols-2">
                <div className="space-y-5">
                    <Input
                        label="Nombre en el panel"
                        hint="Etiqueta, pestañas, filtro de estado e historial."
                        error={errors.label?.message}
                        {...register('label')}
                    />
                    <ToneField
                        value={values.tone ?? status.tone}
                        sample={previewLabel}
                        onChange={(tone) =>
                            setValue('tone', tone, { shouldDirty: true, shouldValidate: true })
                        }
                    />
                    <Input
                        label="Nombre para el cliente"
                        hint="El paso en el seguimiento de la página del pedido."
                        error={errors.customerLabel?.message}
                        {...register('customerLabel')}
                    />
                    <Input
                        label="Título del mensaje al cliente"
                        optional
                        hint="Si lo dejas vacío se usa el nombre para el cliente."
                        error={errors.customerTitle?.message}
                        {...register('customerTitle')}
                    />
                    <Textarea
                        label="Mensaje al cliente"
                        optional
                        rows={3}
                        maxLength={CATALOG_DESCRIPTION_MAX_LENGTH}
                        hint="Puedes usar {produccion} (tiempo de producción) y {marca} (nombre de la tienda)."
                        error={errors.customerDescription?.message}
                        {...register('customerDescription')}
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-sm font-semibold text-ink">Vista previa</p>
                    <div className="space-y-3 rounded-2xl border border-line bg-page/60 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                            <span>En el panel:</span>
                            <Badge tone={STATUS_TONE_VARIANTS[values.tone ?? status.tone]}>
                                {previewLabel}
                            </Badge>
                            <Badge
                                tone={STATUS_TONE_VARIANTS[values.tone ?? status.tone]}
                                size="sm"
                            >
                                {previewLabel}
                            </Badge>
                        </div>
                        <div className="rounded-2xl border border-line bg-white p-4">
                            <p className="text-xs text-ink-soft">En la página del pedido:</p>
                            <p className="mt-1 text-lg font-bold break-words text-ink">
                                {previewTitle || '—'}
                            </p>
                            {previewBody ? (
                                <p className="text-sm break-words text-ink-soft">
                                    {fill(previewBody)}
                                </p>
                            ) : null}
                        </div>
                        {note ? <p className="text-xs text-ink-soft">{note}</p> : null}
                    </div>
                    <ReadOnlyFields
                        fields={[
                            { label: 'Código', value: <code>{status.code}</code> },
                            { label: 'Pestaña', value: groupLabel },
                            { label: 'Estado final', value: status.isTerminal ? 'Sí' : 'No' },
                        ]}
                        explanation="No se pueden cambiar: de ellos dependen el inventario, los reembolsos, el vencimiento de los pedidos y los avisos."
                    />
                </div>
            </div>

            <div className="space-y-3 border-t border-line pt-6">
                <WhatsAppTemplateField
                    {...whatsappField}
                    fieldRef={whatsappField.ref}
                    value={values.whatsappTemplate ?? ''}
                    error={errors.whatsappTemplate?.message}
                    allowsReceipt={RECEIPT_STATUSES.includes(status.code)}
                    onInsert={(next) =>
                        setValue('whatsappTemplate', next, {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                />
            </div>

            {update.isError ? <Alert>{getErrorMessage(update.error)}</Alert> : null}
            {isSaved ? (
                <Alert
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setIsSaved(false)}
                >
                    Estado actualizado. El cambio ya se ve en los pedidos.
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
