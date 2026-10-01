import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { AlertTriangle, Check, ChevronRight, ClipboardList, Search, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { ORDER_STATUSES, type AdminOrderListItem, type OrderStatus } from '@/@types/order'
import { EmptyState } from '@/components/shared/EmptyState'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import { Button, Card, Input, Select, Skeleton, Spinner, type SelectOption } from '@/components/ui'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { isBolivarMethod, paymentMethodLabel } from '@/constants/payment.constant'
import { adminOrderPath } from '@/constants/route.constant'
import { getErrorMessage } from '@/services/errors'
import { formatDayRange, isCalendarDay, parseCalendarDay } from '@/utils/calendarDay'
import { cn } from '@/utils/cn'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDate'
import { useDebouncedValue } from '@/utils/hooks/useDebouncedValue'
import { useOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'
import { CatalogPagination } from '@/views/catalog/components/CatalogPagination'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminOrders, useAdminOrdersSummary } from '@/views/admin/hooks/useAdminOrders'
import { OrderGroupTabs } from '@/views/admin/orders/components/OrderGroupTabs'
import { OrdersSetupWarnings } from '@/views/admin/orders/components/OrdersSetupWarnings'
import { OrderListFlags } from '@/views/admin/orders/components/OrderListFlags'
import {
    ALL_ORDERS_GROUP_ID,
    buildOrderGroups,
    findOrderGroup,
    groupCount,
    groupOfStatus,
} from '@/views/admin/orders/utils/orderGroups'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350
const SKELETON_ROWS = 6
/** The search field's width from which the full placeholder fits without an ellipsis. */
const FULL_SEARCH_PLACEHOLDER_MIN_PX = 368

const headerCellClass =
    'px-3 py-3 text-left text-xs font-bold tracking-wide text-ink-soft uppercase first:pl-4'
const cellClass = 'px-3 py-3 align-middle first:pl-4'
/** Pinned to the right edge, like the products list, with its own background. */
const actionsCellClass = 'sticky right-0 bg-white px-3 transition group-hover:bg-page'

function isStatus(value: string | null): value is OrderStatus {
    return value !== null && (ORDER_STATUSES as readonly string[]).includes(value)
}

/** The total in the currency the customer pays with first, the other one below. */
function ListTotal({ order, align }: { order: AdminOrderListItem; align?: 'right' }) {
    const inBolivares = isBolivarMethod(order.paymentMethod)
    const primary = inBolivares ? formatBolivares(order.totalBs) : formatCurrency(order.totalUsd)
    const secondary = inBolivares ? formatCurrency(order.totalUsd) : formatBolivares(order.totalBs)
    return (
        <div className={align === 'right' ? 'text-right' : undefined}>
            <p className="font-tech font-semibold text-ink">{primary}</p>
            <p className="font-tech text-xs text-ink-soft">{secondary}</p>
        </div>
    )
}

function OpenLink({ order }: { order: AdminOrderListItem }) {
    return (
        <Link
            to={adminOrderPath(order.code)}
            aria-label={`Ver pedido ${order.code}`}
            className="flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
            <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
    )
}

/** One removable chip of the "filtros activos" summary. */
function FilterChip({
    children,
    onRemove,
    label,
}: {
    children: ReactNode
    onRemove: () => void
    label: string
}) {
    return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-white py-0.5 pr-1 pl-3 text-sm text-ink">
            <span className="truncate">{children}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={label}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700"
            >
                <X aria-hidden="true" className="size-3.5" />
            </button>
        </span>
    )
}

/** Whether the element is at least `minWidth` pixels wide, kept in sync as it resizes. */
function useIsWiderThan(ref: RefObject<HTMLElement | null>, minWidth: number): boolean {
    const [isWider, setIsWider] = useState(true)
    useEffect(() => {
        const element = ref.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setIsWider(entry.contentRect.width >= minWidth)
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [ref, minWidth])
    return isWider
}

export function AdminOrdersView() {
    const idPrefix = useId()
    const [searchParams, setSearchParams] = useSearchParams()
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const search = searchParams.get('q') ?? ''
    const rawStatus = searchParams.get('estado')
    const urlStatus = isStatus(rawStatus) ? rawStatus : undefined
    const rawGroup = searchParams.get('grupo')
    const pendingRefundsOnly = searchParams.get('reembolso') === 'pendiente'
    const from = isCalendarDay(searchParams.get('desde')) ? (searchParams.get('desde') ?? '') : ''
    const to = isCalendarDay(searchParams.get('hasta')) ? (searchParams.get('hasta') ?? '') : ''
    const [searchInput, setSearchInput] = useState(search)
    const searchBoxRef = useRef<HTMLDivElement>(null)
    const isSearchWide = useIsWiderThan(searchBoxRef, FULL_SEARCH_PLACEHOLDER_MIN_PX)
    const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS)

    const summaryQuery = useAdminOrdersSummary()
    const summary = summaryQuery.data
    const statusCatalog = useOrderStatusCatalog()
    const groups = useMemo(
        () => buildOrderGroups(statusCatalog.groups, statusCatalog.statuses),
        [statusCatalog.groups, statusCatalog.statuses],
    )

    /*
     * Without a tab in the URL, open on "Por verificar" when payments are waiting (her main
     * job) and on "Todos" otherwise. Decided once per visit, so the poll that brings the count
     * to zero does not yank the tab from under her.
     */
    const [defaultGroup, setDefaultGroup] = useState<string | null>(null)
    const summaryDefault: string | null = statusCatalog.isLoading
        ? null
        : summary
          ? summary.pendingVerification > 0
              ? groupOfStatus(groups, 'PENDIENTE_VERIFICACION')
              : ALL_ORDERS_GROUP_ID
          : summaryQuery.isError
            ? ALL_ORDERS_GROUP_ID
            : null
    if (defaultGroup === null && summaryDefault !== null) setDefaultGroup(summaryDefault)

    const urlGroup = findOrderGroup(groups, rawGroup)
    const groupId: string | null = statusCatalog.isLoading
        ? null
        : urlGroup
          ? urlGroup.id
          : urlStatus
            ? groupOfStatus(groups, urlStatus)
            : (defaultGroup ?? summaryDefault)
    const group = findOrderGroup(groups, groupId) ?? null
    // A status from another tab (an edited URL) is ignored rather than showing an empty list.
    const status = urlStatus && group?.statuses.includes(urlStatus) ? urlStatus : undefined

    const orders = useAdminOrders(
        {
            status: status
                ? [status]
                : groupId === ALL_ORDERS_GROUP_ID
                  ? undefined
                  : group?.statuses,
            refundStatus: pendingRefundsOnly ? 'PENDIENTE' : undefined,
            search: search || undefined,
            from: from || undefined,
            to: to || undefined,
            page,
            pageSize: PAGE_SIZE,
        },
        { enabled: group !== null },
    )

    const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current)
                for (const [key, value] of Object.entries(changes)) {
                    if (value) next.set(key, value)
                    else next.delete(key)
                }
                if (resetPage) next.delete('page')
                return next
            },
            { replace: true },
        )
    }

    // The URL is the source of truth, so a reload or "back" keeps every filter.
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

    const selectGroup = (id: string) =>
        updateParams({ grupo: id, estado: undefined, reembolso: undefined })

    const toggleRefunds = () =>
        updateParams(
            pendingRefundsOnly
                ? { reembolso: undefined }
                : { reembolso: 'pendiente', grupo: ALL_ORDERS_GROUP_ID, estado: undefined },
        )

    const clearSearch = () => {
        setSearchInput('')
        updateParams({ q: undefined })
    }

    // The tab is navigation, not a filter: clearing keeps it.
    const hasFilters = Boolean(search || from || to || status || pendingRefundsOnly)
    const clearFilters = () => {
        setSearchInput('')
        updateParams({
            q: undefined,
            estado: undefined,
            desde: undefined,
            hasta: undefined,
            reembolso: undefined,
        })
    }

    const items = orders.data?.items ?? []
    const counts = orders.data?.counts
    const pending = summary?.pendingVerification ?? 0
    const pendingRefunds = orders.data?.pendingRefunds ?? 0
    const fromDate = parseCalendarDay(from)

    const statusOptions: SelectOption[] = group
        ? [
              {
                  value: '',
                  label: `Todos los estados${counts ? ` · ${groupCount(group, counts)}` : ''}`,
              },
              ...group.statuses.map((value) => ({
                  value,
                  label: `${statusCatalog.status(value).label}${counts ? ` · ${counts[value]}` : ''}`,
              })),
          ]
        : [{ value: '', label: 'Todos los estados' }]

    return (
        <>
            <AdminPageHeader
                title="Pedidos"
                description={
                    pending > 0
                        ? `${pending} ${pending === 1 ? 'pago espera' : 'pagos esperan'} tu verificación.`
                        : 'Pedidos de la tienda, sus pagos y su estado.'
                }
            />

            <OrdersSetupWarnings summary={summary} />

            <div className="mb-4 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <OrderGroupTabs
                        groups={groups}
                        isLoading={statusCatalog.isLoading}
                        active={groupId}
                        counts={counts}
                        idPrefix={idPrefix}
                        onSelect={selectGroup}
                    />
                </div>
                {orders.isFetching && !orders.isPending ? (
                    <Spinner
                        size="sm"
                        className="shrink-0 text-brand-600"
                        label="Actualizando la lista"
                    />
                ) : null}
            </div>

            {/* 17.5rem fits the longest status and its count ("Pendiente por verificación · 12"). */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_17.5rem_minmax(12rem,auto)]">
                <div ref={searchBoxRef} className="sm:col-span-2 lg:col-span-1">
                    {/* The (hidden) label always says what the search covers; a narrow field
                        shows a shorter placeholder instead of a clipped one. */}
                    <Input
                        label="Buscar pedidos por código, cliente, teléfono o referencia"
                        hideLabel
                        type="search"
                        placeholder={
                            isSearchWide
                                ? 'Código, cliente, teléfono o referencia'
                                : 'Buscar pedido…'
                        }
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        leadingIcon={<Search className="size-4" />}
                        trailingAction={
                            searchInput ? (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label="Limpiar búsqueda"
                                    className="flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-brand-100"
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            ) : null
                        }
                    />
                </div>
                <Select
                    label="Estado"
                    hideLabel
                    // Same size as the options, so the longest status fits the column.
                    className="lg:text-sm"
                    options={statusOptions}
                    value={status ?? ''}
                    disabled={!group || group.statuses.length < 2}
                    onChange={(event) => updateParams({ estado: event.target.value || undefined })}
                />
                <DateRangePicker
                    value={{ from: from || undefined, to: to || undefined }}
                    onChange={(range) => updateParams({ desde: range.from, hasta: range.to })}
                />
            </div>

            {hasFilters || pendingRefunds > 0 ? (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    {pendingRefunds > 0 || pendingRefundsOnly ? (
                        <button
                            type="button"
                            aria-pressed={pendingRefundsOnly}
                            onClick={toggleRefunds}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full border-2 py-1 pr-1.5 pl-3 text-sm font-semibold text-ink transition',
                                pendingRefundsOnly
                                    ? 'border-warning-400 bg-warning-100'
                                    : 'border-warning-400/80 bg-warning-100/40 hover:bg-warning-100/80',
                            )}
                        >
                            {pendingRefundsOnly ? (
                                <Check aria-hidden="true" className="size-4 text-ink" />
                            ) : (
                                <AlertTriangle
                                    aria-hidden="true"
                                    className="size-4 text-amber-600"
                                />
                            )}
                            Reembolsos pendientes
                            <span className="min-w-6 rounded-full bg-white px-1.5 py-0.5 text-center text-xs font-bold tabular-nums">
                                {pendingRefunds}
                            </span>
                        </button>
                    ) : null}

                    {search ? (
                        <FilterChip onRemove={clearSearch} label="Quitar la búsqueda">
                            <span className="text-ink-soft">Búsqueda:</span> “{search}”
                        </FilterChip>
                    ) : null}
                    {status ? (
                        <FilterChip
                            onRemove={() => updateParams({ estado: undefined })}
                            label="Quitar el filtro de estado"
                        >
                            <span className="text-ink-soft">Estado:</span>{' '}
                            {statusCatalog.status(status).label}
                        </FilterChip>
                    ) : null}
                    {fromDate ? (
                        <FilterChip
                            onRemove={() => updateParams({ desde: undefined, hasta: undefined })}
                            label="Quitar el filtro de fechas"
                        >
                            <span className="text-ink-soft">Fechas:</span>{' '}
                            {formatDayRange(fromDate, parseCalendarDay(to))}
                        </FilterChip>
                    ) : null}

                    {hasFilters ? (
                        <div className="ml-auto flex items-center gap-3">
                            {orders.data ? (
                                <span className="text-sm text-ink-soft" aria-live="polite">
                                    {orders.data.total}{' '}
                                    {orders.data.total === 1 ? 'pedido' : 'pedidos'}
                                </span>
                            ) : null}
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Limpiar filtros
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="mb-6" />
            )}

            <div
                id={`${idPrefix}-panel`}
                role="tabpanel"
                aria-labelledby={groupId ? `${idPrefix}-tab-${groupId}` : undefined}
            >
                {orders.isPending ? (
                    <Card padding="none" className="divide-y divide-line overflow-hidden">
                        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                            <div key={index} className="flex items-center gap-4 p-4">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="w-1/3" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="h-6 w-28" />
                            </div>
                        ))}
                    </Card>
                ) : orders.isError ? (
                    <EmptyState
                        title="No pudimos cargar los pedidos"
                        description={getErrorMessage(orders.error)}
                        icon={<ClipboardList className="size-6" />}
                        action={
                            <Button variant="secondary" onClick={() => void orders.refetch()}>
                                Reintentar
                            </Button>
                        }
                    />
                ) : items.length === 0 ? (
                    <EmptyState
                        title={hasFilters ? 'Ningún pedido coincide' : (group?.emptyTitle ?? '')}
                        description={
                            hasFilters
                                ? 'Prueba con otra búsqueda, otro estado u otras fechas.'
                                : group?.emptyDescription
                        }
                        icon={<ClipboardList className="size-6" />}
                        action={
                            hasFilters ? (
                                <Button variant="secondary" onClick={clearFilters}>
                                    Limpiar filtros
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    /*
                     * Table or cards by the width the list gets, like the products list. The table
                     * waits for 56rem: below that the fixed columns (sized so the longest status
                     * and every payment flag fit whole) would squeeze the customer to nothing.
                     */
                    <div className="@container">
                        <Card padding="none" className="hidden overflow-hidden @4xl:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[56rem] table-fixed text-sm">
                                    <colgroup>
                                        <col className="w-44" />
                                        <col />
                                        <col className="w-30" />
                                        <col className="w-48" />
                                        <col className="w-48" />
                                        <col className="w-15" />
                                    </colgroup>
                                    <thead className="border-b border-line bg-page">
                                        <tr>
                                            <th scope="col" className={headerCellClass}>
                                                Pedido
                                            </th>
                                            <th scope="col" className={headerCellClass}>
                                                Cliente
                                            </th>
                                            <th
                                                scope="col"
                                                className={`${headerCellClass} text-right`}
                                            >
                                                Total
                                            </th>
                                            <th scope="col" className={headerCellClass}>
                                                Estado
                                            </th>
                                            <th scope="col" className={headerCellClass}>
                                                Pago
                                            </th>
                                            <th
                                                scope="col"
                                                className={cn(
                                                    headerCellClass,
                                                    actionsCellClass,
                                                    'bg-page',
                                                )}
                                            >
                                                <span className="sr-only">Acciones</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {items.map((order) => (
                                            <tr
                                                key={order.code}
                                                className="group transition hover:bg-page"
                                            >
                                                <td className={cellClass}>
                                                    <Link
                                                        to={adminOrderPath(order.code)}
                                                        className="font-tech text-base font-bold text-ink hover:text-brand-700"
                                                    >
                                                        {order.code}
                                                    </Link>
                                                    <p className="text-xs text-ink-soft">
                                                        {formatDateTime(order.createdAt)}
                                                    </p>
                                                </td>
                                                <td className={cellClass}>
                                                    <p className="truncate font-semibold text-ink">
                                                        {order.customerName}
                                                    </p>
                                                    <p className="truncate text-xs text-ink-soft">
                                                        {order.customerPhone} · {order.itemCount} u.
                                                    </p>
                                                </td>
                                                <td className={cellClass}>
                                                    <ListTotal order={order} align="right" />
                                                </td>
                                                <td className={cellClass}>
                                                    <OrderStatusBadge
                                                        status={order.status}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className={cellClass}>
                                                    <div className="space-y-1">
                                                        <p className="truncate text-xs text-ink-soft">
                                                            <span className="font-semibold text-ink">
                                                                {paymentMethodLabel(
                                                                    order.paymentMethod,
                                                                )}
                                                            </span>
                                                            {order.latestPayment
                                                                ? ` · Ref. ${order.latestPayment.reference}`
                                                                : ''}
                                                        </p>
                                                        <OrderListFlags order={order} />
                                                    </div>
                                                </td>
                                                <td className={`${cellClass} ${actionsCellClass}`}>
                                                    <OpenLink order={order} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:hidden">
                            {items.map((order) => (
                                <li key={order.code}>
                                    <Card padding="sm" className="flex h-full flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <Link
                                                    to={adminOrderPath(order.code)}
                                                    className="font-tech text-lg font-bold text-ink"
                                                >
                                                    {order.code}
                                                </Link>
                                                <p className="text-xs text-ink-soft">
                                                    {formatDateTime(order.createdAt)}
                                                </p>
                                                <OrderStatusBadge status={order.status} size="sm" />
                                            </div>
                                            <OpenLink order={order} />
                                        </div>
                                        <div className="min-w-0 text-sm">
                                            <p className="truncate font-semibold text-ink">
                                                {order.customerName}
                                            </p>
                                            <p className="truncate text-xs text-ink-soft">
                                                {order.customerPhone} · {order.itemCount} u.
                                            </p>
                                        </div>
                                        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-line pt-3">
                                            <div>
                                                <ListTotal order={order} />
                                                <p className="text-xs text-ink-soft">
                                                    {paymentMethodLabel(order.paymentMethod)}
                                                </p>
                                            </div>
                                            <OrderListFlags order={order} />
                                        </div>
                                    </Card>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8">
                            <CatalogPagination
                                page={orders.data?.page ?? page}
                                totalPages={orders.data?.totalPages ?? 1}
                                onPageChange={goToPage}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
