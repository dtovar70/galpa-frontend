import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Lock, Pencil, Save, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { AdminBank } from '@/@types/catalog'
import { Alert, Badge, Button, Input, Switch, Tooltip } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { bankFormSchema, type BankFormValues } from '@/views/admin/catalogs/schema/catalog.schema'
import { useUpdateBank } from '@/views/admin/hooks/useAdminCatalogs'

/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while saving. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

function plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

/** "3 pagos · Pago Móvil de la tienda", or null when nothing uses the bank. */
function bankUsage(bank: AdminBank): string | null {
    const parts = [
        bank.paymentCount > 0 ? plural(bank.paymentCount, 'pago', 'pagos') : '',
        bank.usedByPaymentContent ? 'Pago Móvil de la tienda' : '',
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
}

export interface BankRowProps {
    bank: AdminBank
    index: number
    total: number
    /** While a new order is being saved, moves are ignored. */
    isBusy: boolean
    onMove: (index: number, offset: -1 | 1) => void
    onDelete: (bank: AdminBank) => void
}

/**
 * One bank: position, code, name, whether it is offered in the selects, and what uses it.
 * A bank in use cannot be deleted, only deactivated.
 */
export function BankRow({ bank, index, total, isBusy, onMove, onDelete }: BankRowProps) {
    const panelId = useId()
    const deleteHintId = useId()
    const update = useUpdateBank()
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const usage = bankUsage(bank)
    const canDelete = usage === null
    const isFirst = index === 0
    const isLast = index === total - 1

    return (
        <li
            data-bank-code={bank.code}
            className={cn(
                'rounded-2xl border border-line bg-white shadow-soft',
                !bank.isActive && 'bg-page/60',
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
                            <span className="font-mono text-sm text-ink-soft">{bank.code}</span>
                            <h3
                                className={cn(
                                    'min-w-0 text-lg font-bold break-words',
                                    bank.isActive ? 'text-ink' : 'text-ink-soft',
                                )}
                            >
                                {bank.name}
                            </h3>
                            {bank.isActive ? null : (
                                <Badge tone="neutral" size="sm">
                                    Inactivo
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-ink-soft">
                            {usage ?? 'Ningún pago lo usa todavía'}
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Switch
                        label={`Mostrar ${bank.name} en las listas de bancos`}
                        checked={bank.isActive}
                        disabled={update.isPending}
                        onChange={(isActive) =>
                            update.mutate({ code: bank.code, input: { isActive } })
                        }
                    />
                    <Tooltip label="Subir" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isFirst) onMove(index, -1)
                            }}
                            aria-disabled={isBusy || isFirst}
                            aria-label={`Subir ${bank.name}`}
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
                            aria-label={`Bajar ${bank.name}`}
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
                            aria-label={`Renombrar ${bank.name}`}
                            className={cn(actionClass, isExpanded && 'bg-brand-100 text-brand-700')}
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip
                        label={canDelete ? 'Eliminar' : 'En uso: desactívalo'}
                        placement="top"
                        align="end"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (canDelete) onDelete(bank)
                            }}
                            aria-disabled={!canDelete}
                            aria-describedby={canDelete ? undefined : deleteHintId}
                            aria-label={`Eliminar ${bank.name}`}
                            className={actionClass}
                        >
                            <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    {canDelete ? null : (
                        <span id={deleteHintId} className="sr-only">
                            No se puede eliminar porque está en uso ({usage}). Desactívalo para
                            ocultarlo.
                        </span>
                    )}
                </div>
            </div>

            {update.isError && !isExpanded ? (
                <div className="px-4 pb-4">
                    <Alert>{getErrorMessage(update.error)}</Alert>
                </div>
            ) : null}

            {hasOpened ? (
                <div id={panelId} hidden={!isExpanded} className="border-t border-line p-4 sm:p-6">
                    <BankNameForm bank={bank} />
                </div>
            ) : null}
        </li>
    )
}

function BankNameForm({ bank }: { bank: AdminBank }) {
    const update = useUpdateBank()
    const [isSaved, setIsSaved] = useState(false)
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isDirty },
    } = useForm<BankFormValues>({
        resolver: zodResolver(bankFormSchema),
        defaultValues: { code: bank.code, name: bank.name },
    })

    const submit = handleSubmit((values) => {
        setIsSaved(false)
        update.mutate(
            { code: bank.code, input: { name: values.name } },
            {
                onSuccess: (saved) => {
                    reset({ code: saved.code, name: saved.name })
                    setIsSaved(true)
                },
                onError: (error) => {
                    const message = isApiError(error)
                        ? error.details.find((detail) => detail.field === 'name')?.errors[0]
                        : undefined
                    if (message) setError('name', { type: 'server', message })
                },
            },
        )
    })

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <Lock aria-hidden="true" className="size-3.5" />
                        Código
                    </p>
                    <p className="flex h-11 items-center rounded-full border-2 border-dashed border-line px-4 font-mono text-sm text-ink-soft">
                        {bank.code}
                    </p>
                </div>
                <Input label="Nombre" error={errors.name?.message} {...register('name')} />
            </div>
            <p className="text-xs text-ink-soft">
                El código identifica al banco en los pagos y no se puede cambiar. Los pagos ya
                registrados conservan el nombre que tenía el banco ese día.
            </p>

            {update.isError ? <Alert>{getErrorMessage(update.error)}</Alert> : null}
            {isSaved ? (
                <Alert
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setIsSaved(false)}
                >
                    Banco actualizado.
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
