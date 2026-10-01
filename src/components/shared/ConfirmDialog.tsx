import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Alert, Button, type ButtonProps } from '@/components/ui'
import { cn } from '@/utils/cn'

export interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    description?: ReactNode
    confirmLabel?: string
    cancelLabel?: string
    isLoading?: boolean
    /** Shown inside the dialog, e.g. when the confirmed request failed. */
    error?: string
    /** `danger` (default) for destructive actions, `primary` for positive ones. */
    confirmVariant?: Extract<ButtonProps['variant'], 'danger' | 'primary'>
    /** Keeps the confirm button disabled, e.g. until a required reason is typed. */
    confirmDisabled?: boolean
    /** Extra content between the description and the buttons, e.g. a reason field. */
    children?: ReactNode
    /**
     * Replaces the confirm button (the cancel one stays), for dialogs whose actions are links
     * or several buttons. `onConfirm` is then unused.
     */
    actions?: ReactNode
    /** Informational dialogs with a single "OK" button: no cancel button. */
    hideCancel?: boolean
    /** `lg` for dialogs that hold a whole form. */
    size?: 'md' | 'lg'
    onConfirm?: () => void
    onClose: () => void
}

/**
 * Built on the native `<dialog>`: `showModal()` gives the focus trap, the inert page behind
 * it and Escape-to-close for free. Inside another modal it stacks on top, like ProofViewer. The title and the buttons stay put; only the content in
 * between scrolls, inside the rounded shell, so the scrollbar never pokes out of its corners.
 */
export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    isLoading = false,
    error,
    confirmVariant = 'danger',
    confirmDisabled = false,
    children,
    actions,
    hideCancel = false,
    size = 'md',
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const titleId = useId()
    const descriptionId = useId()

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (isOpen && !dialog.open) dialog.showModal()
        if (!isOpen && dialog.open) dialog.close()
    }, [isOpen])

    const requestClose = () => {
        if (!isLoading) onClose()
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onCancel={(event) => {
                // Escape: keep React as the owner of the open state. It may be stacked over
                // another dialog (the design editor): React would bubble the synthetic event up
                // to that one's handler, so it stops here (only the top dialog closes).
                event.preventDefault()
                event.stopPropagation()
                requestClose()
            }}
            onClose={(event) => {
                // Browsers force-close on a repeated Escape; keep the state in sync. Only this
                // dialog's own event: a nested one (e.g. the proof viewer) is not a reason.
                event.stopPropagation()
                if (event.target === event.currentTarget && isOpen) onClose()
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') event.stopPropagation()
            }}
            onClick={(event) => {
                // A click on the element itself (not its content) is a click on the backdrop.
                if (event.target === event.currentTarget) requestClose()
            }}
            className={cn(
                'fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-3xl bg-cream p-0 text-ink shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm',
                size === 'lg' ? 'max-w-2xl' : 'max-w-md',
            )}
        >
            {isOpen ? (
                <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
                    <h2 id={titleId} className="shrink-0 px-6 pt-6 font-display text-xl">
                        {title}
                    </h2>

                    <div className="scroll-soft min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 pt-2 pb-5">
                        {description ? (
                            <div id={descriptionId} className="text-sm text-ink-soft">
                                {description}
                            </div>
                        ) : null}

                        {children}

                        {error ? <Alert>{error}</Alert> : null}
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-3 px-6 pb-6 sm:flex-row sm:flex-wrap-reverse sm:justify-end">
                        {hideCancel ? null : (
                            <Button variant="secondary" onClick={requestClose} disabled={isLoading}>
                                {cancelLabel}
                            </Button>
                        )}
                        {actions ?? (
                            <Button
                                variant={confirmVariant}
                                onClick={onConfirm}
                                isLoading={isLoading}
                                disabled={confirmDisabled || isLoading}
                            >
                                {confirmLabel}
                            </Button>
                        )}
                    </div>
                </div>
            ) : null}
        </dialog>
    )
}
