import { useState } from 'react'
import { PackageOpen, SearchX, SlidersHorizontal, Tags, X } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ProductGrid } from '@/components/shared/ProductGrid'
import { Button, ButtonLink, Card, Drawer } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { useMediaQuery } from '@/utils/hooks/useMediaQuery'
import { CatalogFilters } from '@/views/catalog/components/CatalogFilters'
import { CatalogPagination } from '@/views/catalog/components/CatalogPagination'
import { CatalogToolbar } from '@/views/catalog/components/CatalogToolbar'
import { CATALOG_PAGE_SIZE, useCatalogFilters } from '@/views/catalog/hooks/useCatalogFilters'
import { useCategories } from '@/views/catalog/hooks/useCategories'
import { useProducts } from '@/views/catalog/hooks/useProducts'

export function CatalogView() {
    const catalog = useCatalogFilters()
    const { filters } = catalog
    const { data: categories } = useCategories()
    // Phones and tablets get the filters in a drawer; the side card only fits from `lg`.
    const isDesktop = useMediaQuery('(min-width: 64rem)')
    const [filtersOpen, setFiltersOpen] = useState(false)
    const activeFilterCount =
        (filters.category !== undefined ? 1 : 0) +
        (filters.priceBracket !== 'all' ? 1 : 0) +
        filters.tags.length

    const activeCategory = (categories ?? []).find((category) => category.slug === filters.category)
    /** A deleted category, or a mistyped link: known only once the categories have loaded. */
    const isUnknownCategory =
        filters.category !== undefined && categories !== undefined && !activeCategory
    const { data, isPending, isError, isPlaceholderData, refetch } = useProducts(
        catalog.queryParams,
        { enabled: !isUnknownCategory },
    )
    const products = data?.items ?? []
    const closeFilters = () => setFiltersOpen(false)
    const hasNoResults = !isPending && !isError && products.length === 0

    const filterPanel = (
        <CatalogFilters
            filters={filters}
            isFiltered={catalog.isFiltered}
            onCategoryChange={catalog.setCategory}
            onPriceBracketChange={catalog.setPriceBracket}
            onTagToggle={catalog.toggleTag}
            onClear={catalog.clearFilters}
        />
    )

    if (isUnknownCategory) {
        return (
            <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
                <header className="space-y-3">
                    <p className="font-display text-sm font-semibold tracking-[0.2em] text-blush-700 uppercase">
                        Catálogo
                    </p>
                    <h1 className="font-display text-4xl tracking-tight text-ink uppercase sm:text-5xl">
                        Categoría no encontrada
                    </h1>
                </header>
                <EmptyState
                    title="Esta categoría ya no existe"
                    description="Puede que la hayamos retirado o que el enlace esté mal escrito. El resto del catálogo sigue aquí."
                    icon={<Tags className="size-6" />}
                    action={<ButtonLink to={ROUTES.catalog}>Ver todo el catálogo</ButtonLink>}
                />
            </div>
        )
    }

    return (
        <div className={cn(CONTAINER, 'space-y-8 py-12 lg:py-16')}>
            <header className="space-y-3">
                <p className="font-display text-sm font-semibold tracking-[0.2em] text-blush-700 uppercase">
                    Catálogo
                </p>
                <h1 className="font-display text-4xl tracking-tight text-ink uppercase sm:text-5xl">
                    {activeCategory?.name ?? 'Todo lo que sublimamos'}
                </h1>
                <p className="max-w-2xl text-ink-soft">
                    {activeCategory?.description ??
                        'Filtra por categoría, precio o etiqueta. Cada diseño se personaliza con tu texto o tu foto.'}
                </p>

                {filters.search ? (
                    <p className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                        Resultados para
                        <span className="inline-flex items-center gap-2 rounded-full bg-blush-100 px-3 py-1 font-semibold text-blush-700">
                            {filters.search}
                            <button
                                type="button"
                                onClick={() => catalog.setSearch('')}
                                aria-label="Quitar la búsqueda"
                                // A 44px hit area around the small icon, without a bigger chip.
                                className="relative rounded-full after:absolute after:-inset-[15px] after:content-['']"
                            >
                                <X aria-hidden="true" className="size-3.5" />
                            </button>
                        </span>
                    </p>
                ) : null}
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
                {isDesktop ? (
                    <aside aria-label="Filtros del catálogo" className="h-fit lg:sticky lg:top-28">
                        <Card padding="lg">{filterPanel}</Card>
                    </aside>
                ) : (
                    <Drawer
                        isOpen={filtersOpen}
                        onClose={closeFilters}
                        title="Filtros"
                        side="left"
                        footer={
                            <Button fullWidth onClick={closeFilters}>
                                {data && !isPlaceholderData
                                    ? `Ver ${data.total} ${data.total === 1 ? 'producto' : 'productos'}`
                                    : 'Ver productos'}
                            </Button>
                        }
                    >
                        {filterPanel}
                    </Drawer>
                )}

                <section aria-label="Resultados" className="space-y-6">
                    {isDesktop ? null : (
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setFiltersOpen(true)}
                            aria-haspopup="dialog"
                            leadingIcon={
                                <SlidersHorizontal aria-hidden="true" className="size-4" />
                            }
                        >
                            Filtros
                            {activeFilterCount > 0 ? (
                                <span className="flex min-w-6 items-center justify-center rounded-full bg-blush-700 px-1.5 text-xs font-bold text-white tabular-nums">
                                    <span className="sr-only">(</span>
                                    {activeFilterCount}
                                    <span className="sr-only"> activos)</span>
                                </span>
                            ) : null}
                        </Button>
                    )}

                    <CatalogToolbar
                        total={data?.total ?? 0}
                        sort={filters.sort}
                        isRefreshing={isPlaceholderData}
                        onSortChange={catalog.setSort}
                    />

                    {isError ? (
                        <EmptyState
                            title="No pudimos cargar el catálogo"
                            description="Hubo un problema al traer los productos. Inténtalo otra vez."
                            icon={<PackageOpen className="size-6" />}
                            action={
                                <Button variant="secondary" onClick={() => void refetch()}>
                                    Reintentar
                                </Button>
                            }
                        />
                    ) : hasNoResults ? (
                        <EmptyState
                            title="No encontramos nada con esos filtros"
                            description="Prueba con menos filtros o busca otra palabra."
                            icon={<SearchX className="size-6" />}
                            action={
                                <Button variant="secondary" onClick={catalog.clearFilters}>
                                    Limpiar filtros
                                </Button>
                            }
                        />
                    ) : (
                        <ProductGrid
                            products={products}
                            isPending={isPending}
                            skeletonCount={CATALOG_PAGE_SIZE}
                            className="xl:grid-cols-3"
                        />
                    )}

                    <CatalogPagination
                        page={data?.page ?? 1}
                        totalPages={data?.totalPages ?? 1}
                        onPageChange={catalog.setPage}
                    />
                </section>
            </div>
        </div>
    )
}
