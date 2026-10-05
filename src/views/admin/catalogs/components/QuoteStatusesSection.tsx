import { ReceiptText } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { QuoteStatusRow } from '@/views/admin/catalogs/components/QuoteStatusRow'
import { useQuoteStatuses } from '@/views/admin/hooks/useAdminCatalogs'

const SKELETON_ROWS = 4

/**
 * "Estados de cotización": every quote status, with what the business may rename. Codes, their
 * order and "final" stay fixed (the quote workflow depends on them).
 */
export function QuoteStatusesSection() {
    const query = useQuoteStatuses()

    if (query.isPending) {
        return (
            <div className="space-y-3">
                {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    <Skeleton key={index} shape="block" className="h-20" />
                ))}
            </div>
        )
    }
    if (query.isError) {
        return (
            <EmptyState
                title="No pudimos cargar los estados de cotización"
                description={getErrorMessage(query.error)}
                icon={<ReceiptText className="size-6" />}
                action={
                    <Button variant="secondary" onClick={() => void query.refetch()}>
                        Reintentar
                    </Button>
                }
            />
        )
    }

    return (
        <div className="space-y-10">
            <Alert tone="info">
                Aquí cambias cómo se llaman los estados de las cotizaciones, qué significan y su
                color. Los códigos, su orden y si son finales no se pueden cambiar (tienen un
                candado): de ellos dependen la edición, el envío, la conversión en pedido y el
                vencimiento.
            </Alert>

            <section className="space-y-3" aria-labelledby="catalog-quote-statuses-title">
                <div className="space-y-1">
                    <h2 id="catalog-quote-statuses-title" className="text-2xl font-bold text-ink">
                        Estados de cotización
                    </h2>
                    <p className="text-sm text-ink-soft">
                        En este orden aparecen en el filtro de Cotizaciones. El nombre y el color se
                        ven en el panel.
                    </p>
                </div>
                <ul className="space-y-3">
                    {query.statuses.map((status, index) => (
                        <QuoteStatusRow key={status.code} status={status} position={index + 1} />
                    ))}
                </ul>
            </section>
        </div>
    )
}
