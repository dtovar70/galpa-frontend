import { useEffect, useState } from 'react'
import { PackageOpen, Plus, Search, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import type { AdminProduct } from '@/@types/admin'
import type { CategorySlug } from '@/@types/product'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { Alert, Button, ButtonLink, Card, Input, Skeleton, Spinner, Switch } from '@/components/ui'
import { ADMIN_ROUTES, adminProductPath } from '@/constants/route.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { useDebouncedValue } from '@/utils/hooks/useDebouncedValue'
import { CatalogPagination } from '@/views/catalog/components/CatalogPagination'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminCategories } from '@/views/admin/hooks/useAdminCategories'
import {
    useAdminProducts,
    useDeleteProduct,
    useSetProductActive,
} from '@/views/admin/hooks/useAdminProducts'
import { useSession } from '@/views/admin/hooks/useSession'
import { AdminPriceCell } from '@/views/admin/products/components/AdminPriceCell'
import { ProductRowActions } from '@/views/admin/products/components/ProductRowActions'
import {
    readSavedNotice,
    type ProductEditFromState,
} from '@/views/admin/products/schema/product.schema'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350
const SKELETON_ROWS = 6

const headerCellClass =
    'px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-soft uppercase'
const cellClass = 'px-4 py-3 align-middle'
/**
 * Pinned to the right edge of the scroll area, so edit/delete stay on screen even if the
 * table ever has to scroll sideways. It needs its own background to cover what slides under.
 */
const actionsCellClass = 'sticky right-0 bg-white px-3 transition group-hover:bg-page'

/** "12.000 BTU: 3 · 18.000 BTU: 0" on hover; the stock shown is their sum. */
function stockBreakdown(product: AdminProduct): string | undefined {
    if (product.variants.length === 0 || product.stockMode === 'ON_ORDER') return undefined
    return product.variants.map((variant) => `${variant.label}: ${variant.stock}`).join(' · ')
}

/** "En stock · 12" / "Bajo pedido" / "Agotado". */
function AvailabilityCell({ product }: { product: AdminProduct }) {
    return (
        <span className="inline-flex flex-col items-center gap-1" title={stockBreakdown(product)}>
            <AvailabilityBadge product={product} />
            {product.stockMode === 'STOCK' ? (
                <span className="text-xs text-ink-soft tabular-nums">
                    {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                </span>
            ) : product.leadTimeDays ? (
                <span className="text-xs text-ink-soft">~{product.leadTimeDays} días</span>
            ) : null}
        </span>
    )
}

function Thumbnail({ product }: { product: AdminProduct }) {
    return (
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white p-1">
            <ProductMedia
                category={product.category}
                image={product.images.at(0)}
                fallbackAlt=""
                size="sm"
            />
        </div>
    )
}

export function AdminProductsView() {
    const [searchParams, setSearchParams] = useSearchParams()
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const search = searchParams.get('q') ?? ''
    const [searchInput, setSearchInput] = useState(search)
    const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS)

    const { data: session } = useSession()
    const canDelete = session?.role === 'ADMIN'
    const { data: categories } = useAdminCategories()
    const products = useAdminProducts({ search: search || undefined, page, pageSize: PAGE_SIZE })
    const setActive = useSetProductActive()
    const deleteProduct = useDeleteProduct()
    const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null)
    const location = useLocation()
    const navigate = useNavigate()
    // Edit links carry this list URL, so a save returns to the same search and page.
    const editState: ProductEditFromState = { from: `${location.pathname}${location.search}` }

    // "Guardamos «…»" from the edit page. Kept in local state and dropped from the history
    // entry right away, so a reload (or coming back later) does not show it again.
    const [savedNotice, setSavedNotice] = useState(() => readSavedNotice(location.state))
    const hasSavedNoticeState = readSavedNotice(location.state) !== null
    useEffect(() => {
        if (!hasSavedNoticeState) return
        void navigate(
            { pathname: location.pathname, search: location.search },
            { replace: true, state: null },
        )
    }, [hasSavedNoticeState, location.pathname, location.search, navigate])

    // The URL is the source of truth, so a reload or "back" keeps the search and the page.
    useEffect(() => {
        if (debouncedSearch === search) return
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current)
                if (debouncedSearch) next.set('q', debouncedSearch)
                else next.delete('q')
                next.delete('page')
                return next
            },
            { replace: true },
        )
    }, [debouncedSearch, search, setSearchParams])

    const goToPage = (nextPage: number) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current)
            if (nextPage > 1) next.set('page', String(nextPage))
            else next.delete('page')
            return next
        })
    }

    const categoryName = (slug: CategorySlug) =>
        categories?.find((category) => category.slug === slug)?.name ?? slug

    const confirmDelete = () => {
        if (!pendingDelete) return
        const isLastOnPage = products.data?.items.length === 1
        deleteProduct.mutate(pendingDelete.id, {
            onSuccess: () => {
                setPendingDelete(null)
                if (isLastOnPage && page > 1) goToPage(page - 1)
            },
        })
    }

    const openDelete = canDelete
        ? (product: AdminProduct) => {
              deleteProduct.reset()
              setPendingDelete(product)
          }
        : undefined

    const toggleActive = (product: AdminProduct, isActive: boolean) => {
        setActive.mutate({ id: product.id, isActive })
    }

    const isToggling = (id: string) => setActive.isPending && setActive.variables?.id === id
    const items = products.data?.items ?? []

    return (
        <>
            <AdminPageHeader
                title="Productos"
                description={
                    products.data
                        ? `${products.data.total} ${products.data.total === 1 ? 'producto' : 'productos'} en el catálogo, incluidos los ocultos.`
                        : 'Todo el catálogo, incluidos los productos ocultos.'
                }
                actions={
                    <ButtonLink
                        to={ADMIN_ROUTES.productNew}
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Nuevo producto
                    </ButtonLink>
                }
            />

            <div className="mb-6 flex items-center gap-3">
                <div className="w-full max-w-md">
                    <Input
                        label="Buscar productos"
                        hideLabel
                        type="search"
                        placeholder="Buscar por nombre, marca, modelo o SKU"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        leadingIcon={<Search className="size-4" />}
                        trailingAction={
                            searchInput ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchInput('')}
                                    aria-label="Limpiar búsqueda"
                                    className="flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-mist"
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            ) : null
                        }
                    />
                </div>
                {products.isFetching && !products.isPending ? (
                    <Spinner size="sm" className="text-brand-600" label="Actualizando la lista" />
                ) : null}
            </div>

            {savedNotice ? (
                <Alert
                    key={savedNotice}
                    tone="success"
                    className="mb-6"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setSavedNotice(null)}
                >
                    {savedNotice}
                </Alert>
            ) : null}

            {setActive.isError ? (
                <Alert className="mb-6">
                    No pudimos cambiar la visibilidad: {getErrorMessage(setActive.error)}
                </Alert>
            ) : null}

            {products.isPending ? (
                <Card padding="none" className="divide-y divide-line overflow-hidden">
                    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                        <div key={index} className="flex items-center gap-4 p-4">
                            <Skeleton shape="block" className="size-14 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="w-1/2" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))}
                </Card>
            ) : products.isError ? (
                <EmptyState
                    title="No pudimos cargar los productos"
                    description={getErrorMessage(products.error)}
                    icon={<PackageOpen className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void products.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title={search ? 'Ningún producto coincide' : 'Todavía no hay productos'}
                    description={
                        search
                            ? `No encontramos productos para “${search}”.`
                            : 'Crea el primero para que aparezca en la tienda.'
                    }
                    icon={<PackageOpen className="size-6" />}
                    action={
                        search ? (
                            <Button variant="secondary" onClick={() => setSearchInput('')}>
                                Limpiar búsqueda
                            </Button>
                        ) : (
                            <ButtonLink to={ADMIN_ROUTES.productNew}>Nuevo producto</ButtonLink>
                        )
                    }
                />
            ) : (
                /*
                 * The table/cards switch follows the width the list actually gets, not the
                 * viewport: next to the 18rem sidebar a 1100px window leaves less room than a
                 * 768px tablet without it.
                 */
                <div className="@container">
                    {/* Wide containers: a table. */}
                    <Card padding="none" className="hidden overflow-hidden @3xl:block">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[44rem] table-fixed text-sm">
                                <colgroup>
                                    <col />
                                    <col className="w-36" />
                                    <col className="w-36" />
                                    <col className="w-32" />
                                    <col className="w-24" />
                                    <col className="w-26" />
                                </colgroup>
                                <thead className="border-b border-line bg-page">
                                    <tr>
                                        <th scope="col" className={headerCellClass}>
                                            Producto
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Marca
                                        </th>
                                        <th
                                            scope="col"
                                            className={cn(headerCellClass, 'text-center')}
                                        >
                                            Precio
                                        </th>
                                        <th
                                            scope="col"
                                            className={cn(headerCellClass, 'text-center')}
                                        >
                                            Disponibilidad
                                        </th>
                                        <th
                                            scope="col"
                                            className={cn(headerCellClass, 'text-center')}
                                        >
                                            Visible
                                        </th>
                                        <th
                                            scope="col"
                                            className={cn(
                                                headerCellClass,
                                                actionsCellClass,
                                                'bg-page text-center',
                                            )}
                                        >
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {items.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="group transition hover:bg-page"
                                        >
                                            <td className={cellClass}>
                                                <div className="flex items-center gap-3">
                                                    <Thumbnail product={product} />
                                                    <div className="min-w-0">
                                                        <Link
                                                            to={adminProductPath(product.id)}
                                                            state={editState}
                                                            className="line-clamp-2 text-base leading-snug font-semibold break-words text-ink hover:text-brand-700"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                        <p
                                                            className="truncate text-xs text-ink-soft tabular-nums"
                                                            title={`/${product.slug}`}
                                                        >
                                                            {product.sku ?? `/${product.slug}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={cellClass}>
                                                <p className="truncate font-semibold text-ink">
                                                    {product.brand}
                                                </p>
                                                <p className="truncate text-xs text-ink-soft">
                                                    {product.model ??
                                                        categoryName(product.category)}
                                                </p>
                                            </td>
                                            <td className={cellClass}>
                                                <AdminPriceCell product={product} align="center" />
                                            </td>
                                            <td className={`${cellClass} text-center`}>
                                                <AvailabilityCell product={product} />
                                            </td>
                                            <td className={cellClass}>
                                                <div className="flex justify-center">
                                                    <Switch
                                                        checked={product.isActive}
                                                        disabled={isToggling(product.id)}
                                                        onChange={(checked) =>
                                                            toggleActive(product, checked)
                                                        }
                                                        label={`Visible en la tienda: ${product.name}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className={`${cellClass} ${actionsCellClass}`}>
                                                <ProductRowActions
                                                    product={product}
                                                    onDelete={openDelete}
                                                    editState={editState}
                                                    className="justify-center"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Narrow containers: one card per product, two across when there is room. */}
                    <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @3xl:hidden">
                        {items.map((product) => (
                            <li key={product.id}>
                                <Card padding="sm" className="flex h-full flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <Thumbnail product={product} />
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                to={adminProductPath(product.id)}
                                                state={editState}
                                                className="text-base leading-snug font-semibold break-words text-ink"
                                            >
                                                {product.name}
                                            </Link>
                                            <p className="text-xs text-ink-soft">
                                                {product.brand} · {categoryName(product.category)}
                                            </p>
                                            <div className="mt-1">
                                                <AvailabilityBadge product={product} />
                                            </div>
                                            <div className="mt-1 text-sm">
                                                <AdminPriceCell product={product} />
                                            </div>
                                        </div>
                                        <ProductRowActions
                                            product={product}
                                            onDelete={openDelete}
                                            editState={editState}
                                        />
                                    </div>
                                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
                                        <span className="text-sm text-ink-soft">
                                            {product.isActive ? 'Visible en la tienda' : 'Oculto'}
                                        </span>
                                        <Switch
                                            checked={product.isActive}
                                            disabled={isToggling(product.id)}
                                            onChange={(checked) => toggleActive(product, checked)}
                                            label={`Visible en la tienda: ${product.name}`}
                                        />
                                    </div>
                                </Card>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8">
                        <CatalogPagination
                            page={products.data?.page ?? page}
                            totalPages={products.data?.totalPages ?? 1}
                            onPageChange={goToPage}
                        />
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={pendingDelete !== null}
                title="¿Eliminar este producto?"
                description={
                    <>
                        Vas a eliminar <strong className="text-ink">{pendingDelete?.name}</strong>{' '}
                        con sus variantes y fotos. No se puede deshacer. Si solo quieres quitarlo de
                        la tienda, ocúltalo.
                    </>
                }
                confirmLabel="Eliminar producto"
                isLoading={deleteProduct.isPending}
                error={deleteProduct.isError ? getErrorMessage(deleteProduct.error) : undefined}
                onConfirm={confirmDelete}
                onClose={() => setPendingDelete(null)}
            />
        </>
    )
}
