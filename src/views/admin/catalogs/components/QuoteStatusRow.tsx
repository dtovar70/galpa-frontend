import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Pencil, Save } from 'lucide-react'
import { useForm, useWatch, type UseFormSetError } from 'react-hook-form'

import type { QuoteStatusInfo } from '@/@types/catalog'
import { Alert, Badge, Button, Input, Textarea, Tooltip } from '@/components/ui'
import { STATUS_TONE_VARIANTS } from '@/constants/tone.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { ReadOnlyFields } from '@/views/admin/catalogs/components/ReadOnlyFields'
import { ToneField } from '@/views/admin/catalogs/components/ToneField'
import {
    CATALOG_DESCRIPTION_MAX_LENGTH,
    quoteStatusFormSchema,
    type QuoteStatusFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import { useUpdateQuoteStatus } from '@/views/admin/hooks/useAdminCatalogs'

const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

function toFormValues(status: QuoteStatusInfo): QuoteStatusFormValues {
    return { label: status.label, description: status.description, tone: status.tone }
}

function applyServerErrors(
    error: unknown,
    values: QuoteStatusFormValues,
    setError: UseFormSetError<QuoteStatusFormValues>,
): void {
    if (!isApiError(error)) return
    for (const detail of error.details) {
        const message = detail.errors[0]
        if (message && detail.field in values) {
            setError(detail.field as keyof QuoteStatusFormValues, { type: 'server', message })
        }
    }
}

export interface QuoteStatusRowProps {
    status: QuoteStatusInfo
    /** 1-based place in the workflow order. */
    position: number
}

/**
 * One quote status: its badge, code and help text, and (expanded) the form for what the
 * business may rename: the label, the help text and the badge color, with a live preview.
 */
export function QuoteStatusRow({ status, position }: QuoteStatusRowProps) {
    const panelId = useId()
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)

    return (
        <li className="rounded-2xl border border-line bg-white shadow-soft">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
                <div className="min-w-0 flex-1 basis-60 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Badge tone={STATUS_TONE_VARIANTS[status.tone]}>{status.label}</Badge>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-soft">
                            <Lock aria-hidden="true" className="size-3" />
                            {status.code}
                        </span>
                        {status.isTerminal ? (
                            <span className="text-xs text-ink-soft">final</span>
                        ) : null}
                    </div>
                    <p className="text-sm break-words text-ink-soft">{status.description}</p>
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
                    <QuoteStatusForm status={status} position={position} />
                </div>
            ) : null}
        </li>
    )
}

function QuoteStatusForm({ status, position }: QuoteStatusRowProps) {
    const update = useUpdateQuoteStatus()
    const [isSaved, setIsSaved] = useState(false)
    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        formState: { errors, isDirty },
    } = useForm<QuoteStatusFormValues>({
        resolver: zodResolver(quoteStatusFormSchema),
        defaultValues: toFormValues(status),
    })
    const values = useWatch({ control })

    const submit = handleSubmit((form) => {
        setIsSaved(false)
        update.mutate(
            { code: status.code, input: form },
            {
                onSuccess: (statuses) => {
                    const saved = statuses.find((item) => item.code === status.code)
                    reset(saved ? toFormValues(saved) : form)
                    setIsSaved(true)
                },
                onError: (error) => applyServerErrors(error, form, setError),
            },
        )
    })

    const previewLabel = values.label?.trim() || status.label
    const previewTone = STATUS_TONE_VARIANTS[values.tone ?? status.tone]

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 items-start gap-5 @2xl:grid-cols-2">
                <div className="space-y-5">
                    <Input
                        label="Nombre en el panel"
                        hint="Etiqueta, filtro de estado y «Cambiar estado» de las cotizaciones."
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
                    <Textarea
                        label="Qué significa"
                        rows={3}
                        maxLength={CATALOG_DESCRIPTION_MAX_LENGTH}
                        hint="Una frase corta para el equipo: qué indica el estado y qué se puede hacer."
                        error={errors.description?.message}
                        {...register('description')}
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-sm font-semibold text-ink">Vista previa</p>
                    <div className="space-y-3 rounded-2xl border border-line bg-page/60 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                            <span>En el panel:</span>
                            <Badge tone={previewTone}>{previewLabel}</Badge>
                            <Badge tone={previewTone} size="sm">
                                {previewLabel}
                            </Badge>
                        </div>
                        <p className="text-sm break-words text-ink-soft">
                            {values.description?.trim() || '—'}
                        </p>
                    </div>
                    <ReadOnlyFields
                        fields={[
                            { label: 'Código', value: <code>{status.code}</code> },
                            { label: 'Orden', value: String(position) },
                            { label: 'Estado final', value: status.isTerminal ? 'Sí' : 'No' },
                        ]}
                        explanation="No se pueden cambiar: de ellos dependen la edición, el envío, la conversión en pedido y el vencimiento de las cotizaciones."
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
                    Estado actualizado. El cambio ya se ve en las cotizaciones.
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
