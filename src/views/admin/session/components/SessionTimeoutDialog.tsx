import { useEffect, useId, useRef } from 'react'
import { Clock } from 'lucide-react'

import { Alert, Button } from '@/components/ui'
import type { SessionTimeoutSnapshot } from '@/views/admin/session/SessionTimeoutController'

export interface SessionTimeoutDialogProps {
    snapshot: SessionTimeoutSnapshot
    onContinue: () => void
    onLogout: () => void
}

/**
 * "¿Sigues ahí?" prompt, on the native `<dialog>` like `ConfirmDialog`. Unlike it, nothing
 * closes it silently: Escape and backdrop clicks are ignored, only the two buttons (or the
 * countdown) decide.
 */
export function SessionTimeoutDialog({
    snapshot,
    onContinue,
    onLogout,
}: SessionTimeoutDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const titleId = useId()
    const descriptionId = useId()
    const isOpen = snapshot.phase === 'prompt'
    const { secondsLeft, remainingFraction, announcement, isExtending, error } = snapshot

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (isOpen && !dialog.open) {
            dialog.showModal()
            // `showModal()` would focus the first button; the safe choice is the default.
            dialog.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus()
        }
        if (!isOpen && dialog.open) dialog.close()
    }, [isOpen])

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCancel={(event) => {
                // Escape must not dismiss the question: the admin has to answer it.
                event.preventDefault()
            }}
            onClose={(event) => {
                // Browsers force-close on a repeated Escape; reopen while the prompt is due.
                const dialog = event.currentTarget
                if (isOpen && !dialog.open) {
                    dialog.showModal()
                    dialog.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus()
                }
            }}
            className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl bg-cream p-0 text-ink shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
        >
            {isOpen ? (
                <div className="scroll-soft max-h-[calc(100dvh-2rem)] space-y-5 overflow-y-auto overscroll-contain p-6">
                    <div className="space-y-2">
                        <h2 id={titleId} className="flex items-center gap-2 font-display text-xl">
                            <Clock aria-hidden="true" className="size-5 text-blush-500" />
                            ¿Sigues ahí?
                        </h2>
                        <p id={descriptionId} className="text-sm text-ink-soft">
                            Por seguridad, cerraremos tu sesión por inactividad. ¿Quieres seguir
                            trabajando en el panel?
                        </p>
                    </div>

                    <div className="space-y-3 rounded-2xl border-2 border-blush-200 bg-blush-50 px-4 pt-4 pb-5 text-center">
                        <p className="text-sm text-ink-soft">
                            Tu sesión se cerrará en
                            <span className="block font-display text-6xl leading-tight text-blush-700 tabular-nums">
                                {secondsLeft}
                            </span>
                            {secondsLeft === 1 ? 'segundo' : 'segundos'}
                        </p>
                        <div
                            aria-hidden="true"
                            className="relative h-1.5 overflow-hidden rounded-full bg-blush-100"
                        >
                            {/* Same look as the `Alert` countdown bar, driven by the wall clock so
                                it stays right after the tab sleeps or the dialog reopens. */}
                            <span
                                style={{ transform: `scaleX(${remainingFraction})` }}
                                className="absolute inset-0 origin-left bg-blush-400 transition-transform duration-300 ease-linear motion-reduce:transition-none"
                            />
                        </div>
                    </div>

                    {/* Polite and sparse: only at the `announceAtSeconds` thresholds. */}
                    <p className="sr-only" aria-live="polite" aria-atomic="true">
                        {announcement}
                    </p>

                    {error ? <Alert>{error}</Alert> : null}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button variant="secondary" onClick={onLogout} disabled={isExtending}>
                            No, cerrar sesión
                        </Button>
                        <Button data-autofocus onClick={onContinue} isLoading={isExtending}>
                            Sí, continuar
                        </Button>
                    </div>
                </div>
            ) : null}
        </dialog>
    )
}
