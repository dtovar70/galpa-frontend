import { useState } from 'react'
import { Download, Printer, QrCode } from 'lucide-react'

import type { AdminOrder } from '@/@types/order'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { useOrderQr } from '@/utils/hooks/useOrderQr'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { downloadOrderQr, orderQrPngDataUrl } from '@/utils/orderQr'
import { useIssueAccessLink } from '@/views/admin/hooks/useAdminOrders'
import { printOrderLabel } from '@/views/admin/orders/utils/printOrderLabel'

/**
 * "QR del pedido": a fresh private customer link as a QR, to download or print as a small label
 * for the package. The QR opens the customer's order page (never tied to their email).
 */
export function OrderQrAction({ order }: { order: AdminOrder }) {
    const { general } = useSiteContent()
    const issue = useIssueAccessLink(order.code)
    const [isOpen, setIsOpen] = useState(false)
    /** Rendered as soon as the link arrives, so "Imprimir" can open its window synchronously. */
    const [labelPng, setLabelPng] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const url = issue.data?.url ?? null
    const qr = useOrderQr(isOpen ? url : null)

    const open = () => {
        setIsOpen(true)
        setLabelPng(null)
        setActionError(null)
        issue.mutate(undefined, {
            onSuccess: (link) => {
                void orderQrPngDataUrl(link.url).then(setLabelPng)
            },
        })
    }

    const download = async () => {
        if (!url) return
        setActionError(null)
        try {
            await downloadOrderQr(url, order.code)
        } catch (caught) {
            setActionError(getErrorMessage(caught, 'No pudimos generar el QR. Intenta de nuevo.'))
        }
    }

    const print = () => {
        if (!labelPng) return
        setActionError(null)
        const opened = printOrderLabel({
            code: order.code,
            customerName: order.customer.fullName,
            brandName: general.brandName,
            qrPngDataUrl: labelPng,
        })
        if (!opened) {
            setActionError(
                'Tu navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio e intenta de nuevo.',
            )
        }
    }

    const ready = Boolean(url && qr) && !issue.isPending

    return (
        <>
            <Button
                variant="secondary"
                size="sm"
                onClick={open}
                leadingIcon={<QrCode aria-hidden="true" className="size-4" />}
            >
                QR del pedido
            </Button>

            <ConfirmDialog
                isOpen={isOpen}
                title="QR del pedido"
                cancelLabel="Cerrar"
                description="Abre la página privada del pedido, igual que el enlace que recibe el cliente. Cada vez se crea un enlace nuevo; los anteriores siguen funcionando."
                error={issue.isError ? getErrorMessage(issue.error) : (actionError ?? undefined)}
                onClose={() => setIsOpen(false)}
                actions={
                    <>
                        <Button
                            variant="secondary"
                            disabled={!ready}
                            onClick={() => void download()}
                            leadingIcon={<Download aria-hidden="true" className="size-4" />}
                        >
                            Descargar PNG
                        </Button>
                        <Button
                            disabled={!ready || !labelPng}
                            onClick={print}
                            leadingIcon={<Printer aria-hidden="true" className="size-4" />}
                        >
                            Imprimir etiqueta
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 text-center ring-1 ring-ink/5 sm:flex-row sm:text-left">
                    <div className="shrink-0 rounded-2xl bg-white p-1 ring-1 ring-ink/10">
                        {ready && qr ? (
                            <img
                                src={qr}
                                alt={`Código QR del pedido ${order.code}`}
                                width={176}
                                height={176}
                                className="size-44"
                            />
                        ) : (
                            <Skeleton shape="block" className="size-44" />
                        )}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                            {general.brandName}
                        </p>
                        <p className="font-tech text-2xl font-bold text-ink">{order.code}</p>
                        <p className="text-sm break-words text-ink">{order.customer.fullName}</p>
                        <p className="pt-1 text-xs text-ink-soft">
                            La etiqueta mide 6 × 4 cm. Quien escanee el QR podrá ver el pedido.
                        </p>
                    </div>
                </div>
            </ConfirmDialog>
        </>
    )
}
