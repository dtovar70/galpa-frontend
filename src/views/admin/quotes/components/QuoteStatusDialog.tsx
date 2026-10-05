import { useState } from 'react'

import type { Quote, QuoteTransition } from '@/@types/quote'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Textarea } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { useQuoteStatuses } from '@/views/admin/hooks/useAdminCatalogs'
import { useChangeQuoteStatus } from '@/views/admin/hooks/useAdminQuotes'

const REASON_MAX_LENGTH = 300

export interface QuoteStatusDialogProps {
    quote: Quote
    /** The move picked in the editor (one of `quote.allowedTransitions`); null when closed. */
    target: QuoteTransition | null
    onClose: () => void
}

/**
 * Confirms one manual status move ("Marcar como aceptada"), explaining it with the status's own
 * description from Catálogos, with a note that is optional unless the move requires one.
 */
export function QuoteStatusDialog({ quote, target, onClose }: QuoteStatusDialogProps) {
    const changeStatus = useChangeQuoteStatus(quote.code)
    const catalog = useQuoteStatuses()
    const [reason, setReason] = useState('')
    const needsReason = target?.requiresReason === true
    const label = target?.label.toLowerCase() ?? ''
    const description = target ? catalog.status(target.status)?.description : undefined

    const close = () => {
        changeStatus.reset()
        setReason('')
        onClose()
    }

    return (
        <ConfirmDialog
            isOpen={target !== null}
            title={`¿Marcar ${quote.code} como «${label}»?`}
            description={
                description
                    ? `${description} Ahora está «${quote.statusLabel.toLowerCase()}».`
                    : `Ahora está «${quote.statusLabel.toLowerCase()}».`
            }
            confirmLabel={`Marcar como ${label}`}
            confirmVariant="primary"
            confirmDisabled={needsReason && !reason.trim()}
            isLoading={changeStatus.isPending}
            error={changeStatus.isError ? getErrorMessage(changeStatus.error) : undefined}
            onConfirm={() => {
                if (!target) return
                changeStatus.mutate(
                    { status: target.status, reason: reason.trim() || undefined },
                    { onSuccess: close },
                )
            }}
            onClose={close}
        >
            <Textarea
                label="Nota"
                optional={!needsReason}
                hint="Queda registrada en la cotización, por ejemplo qué respondió el cliente."
                rows={3}
                maxLength={REASON_MAX_LENGTH}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
            />
        </ConfirmDialog>
    )
}
