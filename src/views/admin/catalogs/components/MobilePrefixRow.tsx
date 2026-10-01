import { useId } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'

import type { AdminMobilePrefix, ContentPhoneField } from '@/@types/catalog'
import { Alert, Badge, Switch, Tooltip } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { useSetMobilePrefixActive } from '@/views/admin/hooks/useAdminCatalogs'

/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while saving. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

const CONTENT_FIELD_LABELS: Record<ContentPhoneField, string> = {
    'payment.pagoMovil.phone': 'Pago Móvil de la tienda',
    'contact.whatsapp': 'WhatsApp de contacto',
}

/** "2 pedidos en curso · Pago Móvil de la tienda", or null when nothing uses the code. */
function mobilePrefixUsage(prefix: AdminMobilePrefix): string | null {
    const count = prefix.activeOrderCount
    const parts = [
        count > 0 ? `${count} ${count === 1 ? 'pedido en curso' : 'pedidos en curso'}` : '',
        ...prefix.contentFields.map((field) => CONTENT_FIELD_LABELS[field]),
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
}

export interface MobilePrefixRowProps {
    prefix: AdminMobilePrefix
    index: number
    total: number
    /** While a new order is being saved, moves are ignored. */
    isBusy: boolean
    onMove: (index: number, offset: -1 | 1) => void
    onDelete: (prefix: AdminMobilePrefix) => void
}

/**
 * One operator code: position, whether the phone fields offer it, and what uses it. A code used
 * by an order in progress or the store content cannot be deleted, only deactivated.
 */
export function MobilePrefixRow({
    prefix,
    index,
    total,
    isBusy,
    onMove,
    onDelete,
}: MobilePrefixRowProps) {
    const deleteHintId = useId()
    const update = useSetMobilePrefixActive()
    const usage = mobilePrefixUsage(prefix)
    const canDelete = usage === null
    const isFirst = index === 0
    const isLast = index === total - 1

    return (
        <li
            data-prefix-code={prefix.code}
            className={cn(
                'rounded-2xl border border-line bg-white shadow-soft',
                !prefix.isActive && 'bg-page/60',
            )}
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
                <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-page text-sm font-bold text-ink">
                        <span className="sr-only">Posición </span>
                        {index + 1}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3
                                className={cn(
                                    'text-lg font-bold tabular-nums',
                                    prefix.isActive ? 'text-ink' : 'text-ink-soft',
                                )}
                            >
                                {prefix.code}
                            </h3>
                            {prefix.isActive ? null : (
                                <Badge tone="neutral" size="sm">
                                    Inactivo
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-ink-soft">
                            {usage ?? 'Ningún pedido en curso ni dato de la tienda lo usa'}
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Switch
                        label={`Ofrecer el código ${prefix.code} en los campos de celular`}
                        checked={prefix.isActive}
                        disabled={update.isPending}
                        onChange={(isActive) => update.mutate({ code: prefix.code, isActive })}
                    />
                    <Tooltip label="Subir" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isFirst) onMove(index, -1)
                            }}
                            aria-disabled={isBusy || isFirst}
                            aria-label={`Subir ${prefix.code}`}
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
                            aria-label={`Bajar ${prefix.code}`}
                            className={actionClass}
                        >
                            <ArrowDown aria-hidden="true" className="size-4" />
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
                                if (canDelete) onDelete(prefix)
                            }}
                            aria-disabled={!canDelete}
                            aria-describedby={canDelete ? undefined : deleteHintId}
                            aria-label={`Eliminar ${prefix.code}`}
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

            {update.isError ? (
                <div className="px-4 pb-4">
                    <Alert>{getErrorMessage(update.error)}</Alert>
                </div>
            ) : null}
        </li>
    )
}
