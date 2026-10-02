import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Pencil, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { OrderStatusGroupInfo, OrderStatusInfo } from '@/@types/catalog'
import { Alert, Badge, Button, Input, Textarea, Tooltip } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage } from '@/services/errors'
import { STATUS_TONE_VARIANTS } from '@/constants/tone.constant'
import { cn } from '@/utils/cn'
import { ReadOnlyFields } from '@/views/admin/catalogs/components/ReadOnlyFields'
import {
    CATALOG_DESCRIPTION_MAX_LENGTH,
    orderStatusGroupFormSchema,
    type OrderStatusGroupFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import { useUpdateOrderStatusGroup } from '@/views/admin/hooks/useAdminCatalogs'

/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while saving. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

export interface OrderStatusGroupRowProps {
    group: OrderStatusGroupInfo
    statuses: OrderStatusInfo[]
    index: number
    total: number
    isBusy: boolean
    onMove: (index: number, offset: -1 | 1) => void
}

/** One tab of the orders page: position, name, its statuses and (expanded) its form. */
export function OrderStatusGroupRow({
    group,
    statuses,
    index,
    total,
    isBusy,
    onMove,
}: OrderStatusGroupRowProps) {
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
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold break-words text-ink">
                                {group.label}
                            </h3>
                            {group.highlight ? (
                                <Badge tone="solid" size="sm">
                                    Contador resaltado
                                </Badge>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {statuses.map((status) => (
                                <Badge
                                    key={status.code}
                                    tone={STATUS_TONE_VARIANTS[status.tone]}
                                    size="sm"
                                >
                                    {status.label}
                                </Badge>
                            ))}
                        </div>
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
                            aria-label={`Subir ${group.label}`}
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
                            aria-label={`Bajar ${group.label}`}
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
                            aria-label={`Editar ${group.label}`}
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
                    <OrderStatusGroupForm group={group} statuses={statuses} />
                </div>
            ) : null}
        </li>
    )
}

function OrderStatusGroupForm({
    group,
    statuses,
}: {
    group: OrderStatusGroupInfo
    statuses: OrderStatusInfo[]
}) {
    const update = useUpdateOrderStatusGroup()
    const [isSaved, setIsSaved] = useState(false)
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<OrderStatusGroupFormValues>({
        resolver: zodResolver(orderStatusGroupFormSchema),
        defaultValues: { label: group.label, description: group.description ?? '' },
    })

    const submit = handleSubmit((values) => {
        setIsSaved(false)
        update.mutate(
            {
                code: group.code,
                input: { label: values.label, description: values.description || null },
            },
            {
                onSuccess: () => {
                    reset(values)
                    setIsSaved(true)
                },
            },
        )
    })

    return (
        <form onSubmit={submit} noValidate className="space-y-5">
            <Input
                label="Nombre de la pestaña"
                error={errors.label?.message}
                {...register('label')}
            />
            <Textarea
                label="Texto cuando está vacía"
                optional
                rows={2}
                maxLength={CATALOG_DESCRIPTION_MAX_LENGTH}
                error={errors.description?.message}
                {...register('description')}
            />
            <ReadOnlyFields
                fields={[
                    { label: 'Código', value: <code>{group.code}</code> },
                    {
                        label: 'Estados',
                        value: statuses.map((status) => status.label).join(', '),
                    },
                    { label: 'Contador resaltado', value: group.highlight ? 'Sí' : 'No' },
                ]}
                explanation="Qué estados entran en cada pestaña lo decide el flujo de pedidos, por eso no se puede cambiar aquí."
            />

            {update.isError ? <Alert>{getErrorMessage(update.error)}</Alert> : null}
            {isSaved ? (
                <Alert
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setIsSaved(false)}
                >
                    Pestaña actualizada.
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
