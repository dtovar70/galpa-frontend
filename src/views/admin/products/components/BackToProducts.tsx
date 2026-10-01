import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { ADMIN_ROUTES } from '@/constants/route.constant'

export interface BackToProductsProps {
    /** The list URL to return to (keeps its search and page); defaults to the plain list. */
    to?: string
}

export function BackToProducts({ to = ADMIN_ROUTES.products }: BackToProductsProps) {
    return (
        <Link
            to={to}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-brand-700"
        >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a productos
        </Link>
    )
}
