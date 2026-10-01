import { useState } from 'react'
import { ListChecks } from 'lucide-react'

import type { OrderStatusGroupInfo } from '@/@types/catalog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { resolveOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'
import { OrderStatusGroupRow } from '@/views/admin/catalogs/components/OrderStatusGroupRow'
import { OrderStatusRow } from '@/views/admin/catalogs/components/OrderStatusRow'
import {
    useEditableOrderStatusCatalog,
    useSwapOrderStatusGroups,
} from '@/views/admin/hooks/useAdminCatalogs'

const SKELETON_ROWS = 4

/**
 * "Estados de pedido": the tabs of the orders page and every status, with what the business
 * may rename. Codes, tab membership and "final" stay fixed (the workflow depends on them).
 */
export function OrderStatusesSection() {
    const query = useEditableOrderStatusCatalog()
    const swap = useSwapOrderStatusGroups()
    const [announcement, setAnnouncement] = useState('')

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
                title="No pudimos cargar los estados de pedido"
                description={getErrorMessage(query.error)}
                icon={<ListChecks className="size-6" />}
                action={
                    <Button variant="secondary" onClick={() => void query.refetch()}>
                        Reintentar
                    </Button>
                }
            />
        )
    }

    const catalog = query.data ?? {
        ...resolveOrderStatusCatalog(undefined),
        whatsappTemplate: () => '',
    }
    const groupLabel = (code: string) =>
        catalog.groups.find((group) => group.code === code)?.label ?? code
    const statusesOf = (group: OrderStatusGroupInfo) => group.statuses.map(catalog.status)

    const move = (index: number, offset: -1 | 1) => {
        const current = catalog.groups[index]
        const target = catalog.groups[index + offset]
        if (!current || !target) return
        setAnnouncement(`«${current.label}» pasó a la posición ${index + offset + 1}.`)
        swap.mutate([
            { code: current.code, sortOrder: current.sortOrder },
            { code: target.code, sortOrder: target.sortOrder },
        ])
    }

    return (
        <div className="space-y-10">
            <Alert tone="info">
                Aquí cambias cómo se llaman los estados y qué texto ve el cliente. Los códigos, la
                pestaña de cada estado y si es final no se pueden cambiar (tienen un candado): de
                ellos dependen el inventario, los reembolsos, el vencimiento y los avisos.
            </Alert>

            <section className="space-y-3" aria-labelledby="catalog-groups-title">
                <div className="space-y-1">
                    <h2 id="catalog-groups-title" className="text-2xl font-bold text-ink">
                        Pestañas de Pedidos
                    </h2>
                    <p className="text-sm text-ink-soft">
                        En este orden aparecen en la página de Pedidos, de izquierda a derecha.
                        «Todos» siempre va al final.
                    </p>
                </div>
                {swap.isError ? (
                    <Alert>No pudimos guardar el nuevo orden. {getErrorMessage(swap.error)}</Alert>
                ) : null}
                <p className="sr-only" aria-live="polite">
                    {announcement}
                </p>
                <ol className="space-y-3" aria-label="Orden de las pestañas">
                    {catalog.groups.map((group, index) => (
                        <OrderStatusGroupRow
                            key={group.code}
                            group={group}
                            statuses={statusesOf(group)}
                            index={index}
                            total={catalog.groups.length}
                            isBusy={swap.isPending}
                            onMove={move}
                        />
                    ))}
                </ol>
            </section>

            <section className="space-y-3" aria-labelledby="catalog-statuses-title">
                <div className="space-y-1">
                    <h2 id="catalog-statuses-title" className="text-2xl font-bold text-ink">
                        Estados
                    </h2>
                    <p className="text-sm text-ink-soft">
                        El nombre y el color se ven en el panel; el nombre para el cliente y el
                        mensaje, en la página de su pedido. El mensaje de WhatsApp es el que se
                        prepara con «Avisar por WhatsApp».
                    </p>
                </div>
                <ul className="space-y-3">
                    {catalog.statuses.map((status) => (
                        <OrderStatusRow
                            key={status.code}
                            status={status}
                            whatsappTemplate={catalog.whatsappTemplate(status.code)}
                            groupLabel={groupLabel(status.groupCode)}
                        />
                    ))}
                </ul>
            </section>
        </div>
    )
}
