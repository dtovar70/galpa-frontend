import { useId, useState } from 'react'
import { ChevronDown, Download, QrCode } from 'lucide-react'

import { Alert, Button, Card, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { useMediaQuery } from '@/utils/hooks/useMediaQuery'
import { useOrderQr } from '@/utils/hooks/useOrderQr'
import { downloadOrderQr } from '@/utils/orderQr'

export interface OrderQrCardProps {
    code: string
    /** The page's own private link (same token the customer opened it with). */
    url: string
}

/**
 * "Abre tu pedido desde tu teléfono": the QR of this private page, to jump from a computer to
 * the phone. On small screens (already a phone, most likely) it starts collapsed.
 */
export function OrderQrCard({ code, url }: OrderQrCardProps) {
    const isWide = useMediaQuery('(min-width: 64rem)')
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const panelId = useId()
    const expanded = isWide || isOpen
    // Generated (and the QR library downloaded) only once the card is actually open.
    const qr = useOrderQr(expanded ? url : null)

    const download = async () => {
        setIsSaving(true)
        setError(null)
        try {
            await downloadOrderQr(url, code)
        } catch (caught) {
            setError(getErrorMessage(caught, 'No pudimos generar el QR. Intenta de nuevo.'))
        } finally {
            setIsSaving(false)
        }
    }

    const heading = (
        <span className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-frost-100 text-frost-700">
                <QrCode aria-hidden="true" className="size-5" />
            </span>
            <span className="text-lg font-bold text-ink">Abre tu pedido desde tu teléfono</span>
        </span>
    )

    return (
        <Card padding="lg" className="space-y-4">
            {isWide ? (
                <h2>{heading}</h2>
            ) : (
                <h2>
                    <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setIsOpen((open) => !open)}
                        className="-m-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-2xl p-2 text-left transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-500"
                    >
                        {heading}
                        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
                            {isOpen ? 'Ocultar' : 'Ver QR'}
                            <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                    'size-4 transition-transform',
                                    isOpen && 'rotate-180',
                                )}
                            />
                        </span>
                    </button>
                </h2>
            )}

            {expanded ? (
                <div id={panelId} className="space-y-4">
                    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
                        <div className="shrink-0 rounded-2xl bg-white p-2 ring-1 ring-ink/10">
                            {qr ? (
                                <img
                                    src={qr}
                                    alt={`Código QR del pedido ${code}`}
                                    width={176}
                                    height={176}
                                    className="size-44"
                                />
                            ) : (
                                <Skeleton shape="block" className="size-44" />
                            )}
                        </div>
                        <p className="text-sm text-ink-soft">
                            Escanéalo con la cámara de tu celular. No lo compartas: quien lo tenga
                            puede ver tu pedido.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        isLoading={isSaving}
                        onClick={() => void download()}
                        leadingIcon={<Download aria-hidden="true" className="size-4" />}
                    >
                        Descargar QR
                    </Button>
                    {error ? <Alert onDismiss={() => setError(null)}>{error}</Alert> : null}
                </div>
            ) : null}
        </Card>
    )
}
