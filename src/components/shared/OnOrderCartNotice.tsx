import { PackageSearch } from 'lucide-react'

import { cn } from '@/utils/cn'

export interface OnOrderCartNoticeProps {
    className?: string
}

/** Cart and checkout: what "bajo pedido" means for this order before the customer pays. */
export function OnOrderCartNotice({ className }: OnOrderCartNoticeProps) {
    return (
        <div
            className={cn(
                'flex gap-3 rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-900',
                className,
            )}
        >
            <PackageSearch aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning-600" />
            <p>
                <span className="font-semibold">Incluye equipos bajo pedido.</span> Los traemos
                especialmente para ti; te avisaremos cuando lleguen a nuestro almacén y
                coordinaremos la entrega.
            </p>
        </div>
    )
}
