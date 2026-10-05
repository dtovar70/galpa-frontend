import { useState } from 'react'
import { Wallet } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { usePaymentMethods } from '@/utils/hooks/usePaymentMethods'
import { moveItem } from '@/utils/moveItem'
import { PaymentMethodRow } from '@/views/admin/catalogs/components/PaymentMethodRow'
import { useReorderPaymentMethods } from '@/views/admin/hooks/useAdminCatalogs'

const SKELETON_ROWS = 4

/**
 * "Métodos de pago": the name, checkout help text, icon and order of each payment method. The
 * methods themselves (and their currency) are fixed: which ones are offered and their account
 * details are set in Contenido → Pago.
 */
export function PaymentMethodsSection() {
    const query = usePaymentMethods()
    const reorder = useReorderPaymentMethods()
    const [announcement, setAnnouncement] = useState('')
    const list = query.methods

    const move = (index: number, offset: -1 | 1) => {
        const moved = list[index]
        const target = index + offset
        if (!moved || target < 0 || target >= list.length) return
        const next = moveItem(list, index, target)
        setAnnouncement(`«${moved.label}» pasó a la posición ${target + 1} de ${next.length}.`)
        reorder.mutate(next.map((method) => method.code))
    }

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
                title="No pudimos cargar los métodos de pago"
                description={getErrorMessage(query.error)}
                icon={<Wallet className="size-6" />}
                action={
                    <Button variant="secondary" onClick={() => void query.refetch()}>
                        Reintentar
                    </Button>
                }
            />
        )
    }

    return (
        <div className="space-y-6">
            <Alert tone="info">
                Aquí cambias cómo se llama cada método de pago, la frase que lo acompaña en el
                checkout, su ícono y el orden en que se ofrecen. Qué métodos se ofrecen y los datos
                de tus cuentas se configuran en Contenido → Pago; la moneda de cada método no se
                puede cambiar.
            </Alert>

            {reorder.isError ? (
                <Alert>No pudimos guardar el nuevo orden. {getErrorMessage(reorder.error)}</Alert>
            ) : null}
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>

            <ol className="space-y-3" aria-label="Orden de los métodos de pago">
                {list.map((method, index) => (
                    <PaymentMethodRow
                        key={method.code}
                        method={method}
                        index={index}
                        total={list.length}
                        isBusy={reorder.isPending}
                        onMove={move}
                    />
                ))}
            </ol>
        </div>
    )
}
