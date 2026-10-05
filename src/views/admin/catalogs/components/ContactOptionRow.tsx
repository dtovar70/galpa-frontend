import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Lock, Pencil, Save, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { AdminContactOption, ContactOptionKind } from '@/@types/catalog'
import { Alert, Badge, Button, Input, Switch, Tooltip } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import {
    contactOptionFormSchema,
    type ContactOptionFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import { useUpdateContactOption } from '@/views/admin/hooks/useAdminCatalogs'

/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while saving. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

export interface ContactOptionRowProps {
    kind: ContactOptionKind
    option: AdminContactOption
    index: number
    total: number
    /** While a new order is being saved, moves are ignored. */
    isBusy: boolean
    /** Why it cannot be turned off or deleted (the last active topic), or null. */
    lockedReason: string | null
    onMove: (index: number, offset: -1 | 1) => void
    onDelete: (option: AdminContactOption) => void
}

/** One option of the contact form: position, name, whether it is offered, rename and delete. */
export function ContactOptionRow({
    kind,
    option,
    index,
    total,
    isBusy,
    lockedReason,
    onMove,
    onDelete,
}: ContactOptionRowProps) {
    const panelId = useId()
    const lockedHintId = useId()
    const update = useUpdateContactOption(kind)
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const isFirst = index === 0
    const isLast = index === total - 1
    const isLocked = lockedReason !== null

    return (
        <li
            className={cn(
                'rounded-2xl border border-line bg-white shadow-soft',
                !option.isActive && 'bg-page/60',
            )}
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
                <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-page text-sm font-bold text-ink">
                        <span className="sr-only">Posición </span>
                        {index + 1}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4
                                className={cn(
                                    'min-w-0 font-bold break-words',
                                    option.isActive ? 'text-ink' : 'text-ink-soft',
                                )}
                            >
                                {option.label}
                            </h4>
                            {option.isActive ? null : (
                                <Badge tone="neutral" size="sm">
                                    Inactiva
                                </Badge>
                            )}
                        </div>
                        <p className="font-mono text-xs break-all text-ink-soft">{option.code}</p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Switch
                        label={`Mostrar «${option.label}» en el formulario`}
                        checked={option.isActive}
                        disabled={update.isPending || (option.isActive && isLocked)}
                        onChange={(isActive) =>
                            update.mutate({ code: option.code, input: { isActive } })
                        }
                    />
                    <Tooltip label="Subir" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isFirst) onMove(index, -1)
                            }}
                            aria-disabled={isBusy || isFirst}
                            aria-label={`Subir ${option.label}`}
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
                            aria-label={`Bajar ${option.label}`}
                            className={actionClass}
                        >
                            <ArrowDown aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip label={isExpanded ? 'Cerrar edición' : 'Renombrar'} placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                setHasOpened(true)
                                setIsExpanded((current) => !current)
                            }}
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            aria-label={`Renombrar ${option.label}`}
                            className={cn(actionClass, isExpanded && 'bg-brand-100 text-brand-700')}
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip
                        label={isLocked ? 'Debe quedar una activa' : 'Eliminar'}
                        placement="top"
                        align="end"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (!isLocked) onDelete(option)
                            }}
                            aria-disabled={isLocked}
                            aria-describedby={isLocked ? lockedHintId : undefined}
                            aria-label={`Eliminar ${option.label}`}
                            className={actionClass}
                        >
                            <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    {isLocked ? (
                        <span id={lockedHintId} className="sr-only">
                            {lockedReason}
                        </span>
                    ) : null}
                </div>
            </div>

            {update.isError && !isExpanded ? (
                <div className="px-4 pb-4">
                    <Alert>{getErrorMessage(update.error)}</Alert>
                </div>
            ) : null}

            {hasOpened ? (
                <div id={panelId} hidden={!isExpanded} className="border-t border-line p-4 sm:p-6">
                    <ContactOptionNameForm kind={kind} option={option} />
                </div>
            ) : null}
        </li>
    )
}

function ContactOptionNameForm({
    kind,
    option,
}: {
    kind: ContactOptionKind
    option: AdminContactOption
}) {
    const update = useUpdateContactOption(kind)
    const [isSaved, setIsSaved] = useState(false)
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isDirty },
    } = useForm<ContactOptionFormValues>({
        resolver: zodResolver(contactOptionFormSchema),
        defaultValues: { label: option.label },
    })

    const submit = handleSubmit((values) => {
        setIsSaved(false)
        update.mutate(
            { code: option.code, input: { label: values.label } },
            {
                onSuccess: (saved) => {
                    reset({ label: saved.label })
                    setIsSaved(true)
                },
                onError: (error) => {
                    const message = isApiError(error)
                        ? error.details.find((detail) => detail.field === 'label')?.errors[0]
                        : undefined
                    if (message) setError('label', { type: 'server', message })
                },
            },
        )
    })

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <Lock aria-hidden="true" className="size-3.5" />
                        Código
                    </p>
                    <p className="flex h-11 items-center overflow-hidden rounded-full border-2 border-dashed border-line px-4 font-mono text-sm text-ellipsis whitespace-nowrap text-ink-soft">
                        {option.code}
                    </p>
                </div>
                <Input label="Nombre" error={errors.label?.message} {...register('label')} />
            </div>
            <p className="text-xs text-ink-soft">
                El código se generó con el primer nombre y no cambia; el nuevo nombre se verá en el
                formulario y en los avisos que recibes.
            </p>

            {update.isError ? <Alert>{getErrorMessage(update.error)}</Alert> : null}
            {isSaved ? (
                <Alert
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setIsSaved(false)}
                >
                    Opción actualizada.
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
