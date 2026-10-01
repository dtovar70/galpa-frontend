import { useState } from 'react'

import type { Quote, QuoteStatus } from '@/@types/quote'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Select, Textarea, type SelectOption } from '@/components/ui'
import { QUOTE_MANUAL_TRANSITIONS, QUOTE_STATUS_LABELS } from '@/constants/quote.constant'
import { getErrorMessage } from '@/services/errors'
import { useChangeQuoteStatus } from '@/views/admin/hooks/useAdminQuotes'

const REASON_MAX_LENGTH = 300

export interface QuoteStatusDialogProps {
    quote: Quote
    isOpen: boolean
    onClose: () => void
}

/** "Cambiar estado": the manual moves of the quote, with an optional reason. */
export function QuoteStatusDialog({ quote, isOpen, onClose }: QuoteStatusDialogProps) {
    const changeStatus = useChangeQuoteStatus(quote.code)
    const targets = QUOTE_MANUAL_TRANSITIONS[quote.status]
    const [status, setStatus] = useState<QuoteStatus | ''>('')
    const [reason, setReason] = useState('')
    const options: SelectOption[] = targets.map((target) => ({
        value: target,
        label: QUOTE_STATUS_LABELS[target],
    }))

    const close = () => {
        changeStatus.reset()
        setStatus('')
        setReason('')
        onClose()
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            title={`Cambiar el estado de ${quote.code}`}
            description={`Ahora está «${QUOTE_STATUS_LABELS[quote.status]}».`}
            confirmLabel="Cambiar estado"
            confirmVariant="primary"
            confirmDisabled={!status}
            isLoading={changeStatus.isPending}
            error={changeStatus.isError ? getErrorMessage(changeStatus.error) : undefined}
            onConfirm={() => {
                if (!status) return
                changeStatus.mutate(
                    { status, reason: reason.trim() || undefined },
                    { onSuccess: close },
                )
            }}
            onClose={close}
        >
            <div className="space-y-4">
                <Select
                    label="Nuevo estado"
                    placeholder="Elige un estado"
                    options={options}
                    value={status}
                    onChange={(event) =>
                        setStatus(targets.find((target) => target === event.target.value) ?? '')
                    }
                />
                <Textarea
                    label="Motivo o nota"
                    optional
                    rows={3}
                    maxLength={REASON_MAX_LENGTH}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                />
            </div>
        </ConfirmDialog>
    )
}
