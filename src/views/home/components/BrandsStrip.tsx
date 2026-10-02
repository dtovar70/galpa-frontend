import { Link } from 'react-router'

import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { CATALOG_PARAMS } from '@/views/catalog/hooks/useCatalogFilters'
import { useProductFacets } from '@/views/catalog/hooks/useProductFacets'

/** The brands in the catalog, as text logos that open the catalog filtered by each one. */
export function BrandsStrip() {
    const { data } = useProductFacets()
    const brands = data?.brands ?? []
    if (brands.length === 0) return null

    return (
        <section aria-labelledby="brands-heading" className="border-y border-line bg-page py-10">
            <div className={cn(CONTAINER, 'space-y-6')}>
                <h2
                    id="brands-heading"
                    className="text-center text-xs font-bold tracking-[0.2em] text-ink-muted uppercase"
                >
                    Marcas que distribuimos
                </h2>
                <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                    {brands.map((brand) => (
                        <li key={brand}>
                            <Link
                                to={`${ROUTES.catalog}?${new URLSearchParams({ [CATALOG_PARAMS.brand]: brand }).toString()}`}
                                className="rounded-sm text-2xl font-extrabold tracking-display text-ink/35 uppercase transition hover:text-ink"
                            >
                                {brand}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
