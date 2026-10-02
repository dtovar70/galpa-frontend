import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import type { AdminProduct } from '@/@types/admin'
import { Tooltip } from '@/components/ui'
import { adminProductPath } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import type { ProductEditFromState } from '@/views/admin/products/schema/product.schema'

const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

export interface ProductRowActionsProps {
    product: AdminProduct
    /** Omitted for roles that cannot delete, which hides the button entirely. */
    onDelete?: (product: AdminProduct) => void
    /** Router state for the edit link, so saving there returns to this exact list page. */
    editState?: ProductEditFromState
    className?: string
}

export function ProductRowActions({
    product,
    onDelete,
    editState,
    className,
}: ProductRowActionsProps) {
    return (
        <div className={cn('flex shrink-0 items-center justify-end gap-1', className)}>
            {/* Tooltips open upwards and end-aligned: rows sit inside a clipping scroll area. */}
            <Tooltip label="Editar" placement="top" align={onDelete ? 'center' : 'end'}>
                <Link
                    to={adminProductPath(product.id)}
                    state={editState}
                    aria-label={`Editar ${product.name}`}
                    className={actionClass}
                >
                    <Pencil aria-hidden="true" className="size-4" />
                </Link>
            </Tooltip>
            {onDelete ? (
                <Tooltip label="Eliminar" placement="top" align="end">
                    <button
                        type="button"
                        onClick={() => onDelete(product)}
                        aria-label={`Eliminar ${product.name}`}
                        className={actionClass}
                    >
                        <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                </Tooltip>
            ) : null}
        </div>
    )
}
