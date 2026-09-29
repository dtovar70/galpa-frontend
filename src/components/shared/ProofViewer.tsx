import { useEffect, useRef, useState } from 'react'
import { ExternalLink, ImageOff, X, ZoomIn, ZoomOut } from 'lucide-react'

import { cn } from '@/utils/cn'

export interface ProofViewerProps {
    /**
     * The screenshot: the private proof URL in the admin (the session cookie authorizes it) or
     * a local `blob:` preview in the customer's payment form.
     */
    src: string
    /** e.g. "Captura del pago ref. 0012345678". */
    title: string
}

/**
 * Thumbnail that opens the payment screenshot in a modal. The image can be zoomed (tap it or
 * use the buttons) and scrolled; Escape or the backdrop closes it.
 *
 * It can live inside another modal (the admin's "Registrar pago manualmente"): `showModal()`
 * stacks it on top in the top layer, and Escape only reaches the topmost dialog. React still
 * propagates the synthetic `cancel`/`close` events up the component tree, so they stop here
 * and never close the dialog underneath.
 */
export function ProofViewer({ src, title }: ProofViewerProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [zoomed, setZoomed] = useState(false)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (isOpen && !dialog.open) dialog.showModal()
        if (!isOpen && dialog.open) dialog.close()
    }, [isOpen])

    const close = () => {
        setIsOpen(false)
        setZoomed(false)
    }

    if (failed) {
        return (
            <span className="flex size-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-white p-2 text-center text-[11px] text-ink-soft">
                <ImageOff aria-hidden="true" className="size-5" />
                No se pudo cargar
            </span>
        )
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="group relative size-24 shrink-0 overflow-hidden rounded-2xl border border-line bg-white focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
                aria-label={`Ver ${title.toLowerCase()}`}
            >
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="size-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-ink/60 py-0.5 text-[11px] font-semibold text-white">
                    Ver captura
                </span>
            </button>

            <dialog
                ref={dialogRef}
                aria-label={title}
                onCancel={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    close()
                }}
                onClose={(event) => {
                    // Also after a browser force-close (repeated Escape): keep the state in sync.
                    event.stopPropagation()
                    if (isOpen) close()
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') event.stopPropagation()
                }}
                onClick={(event) => {
                    event.stopPropagation()
                    if (event.target === event.currentTarget) close()
                }}
                className="fixed inset-0 m-auto h-[min(90vh,56rem)] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-3xl bg-cream p-0 text-ink shadow-lift backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
            >
                {isOpen ? (
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                            <p className="min-w-0 truncate font-display text-base">{title}</p>
                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setZoomed((value) => !value)}
                                    aria-label={zoomed ? 'Alejar' : 'Acercar'}
                                    className="flex size-9 items-center justify-center rounded-full hover:bg-blush-100"
                                >
                                    {zoomed ? (
                                        <ZoomOut aria-hidden="true" className="size-5" />
                                    ) : (
                                        <ZoomIn aria-hidden="true" className="size-5" />
                                    )}
                                </button>
                                <a
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Abrir en una pestaña nueva"
                                    className="flex size-9 items-center justify-center rounded-full hover:bg-blush-100"
                                >
                                    <ExternalLink aria-hidden="true" className="size-5" />
                                </a>
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Cerrar"
                                    className="flex size-9 items-center justify-center rounded-full hover:bg-blush-100"
                                >
                                    <X aria-hidden="true" className="size-5" />
                                </button>
                            </div>
                        </div>
                        <div className="scroll-soft min-h-0 flex-1 overflow-auto bg-ink/5">
                            <img
                                src={src}
                                alt={title}
                                onClick={() => setZoomed((value) => !value)}
                                className={cn(
                                    'mx-auto block',
                                    zoomed
                                        ? 'max-w-none cursor-zoom-out'
                                        : 'h-full w-full cursor-zoom-in object-contain',
                                )}
                                style={zoomed ? { width: '200%' } : undefined}
                            />
                        </div>
                    </div>
                ) : null}
            </dialog>
        </>
    )
}
