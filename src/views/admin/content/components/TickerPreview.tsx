import { Sparkles } from 'lucide-react'

export interface TickerPreviewProps {
    messages: string[]
}

/** The announcement strip as the storefront paints it, wrapped instead of scrolling. */
export function TickerPreview({ messages }: TickerPreviewProps) {
    const visible = messages.filter((message) => message.trim() !== '')
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold text-ink-soft">Vista previa</p>
            <div className="flex flex-wrap items-center gap-y-2 rounded-2xl bg-ink px-2 py-2.5 text-xs font-semibold text-page">
                {visible.length ? (
                    visible.map((message, index) => (
                        <span key={index} className="flex min-w-0 items-center gap-2 px-3">
                            <Sparkles
                                aria-hidden="true"
                                className="size-3.5 shrink-0 text-brand-300"
                            />
                            <span className="break-words">{message}</span>
                        </span>
                    ))
                ) : (
                    <span className="px-3 text-page/70">Sin mensajes</span>
                )}
            </div>
            <p className="text-xs text-ink-soft">
                En la tienda los mensajes se desplazan en bucle, en este orden.
            </p>
        </div>
    )
}
