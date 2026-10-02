import { useEffect, useState } from 'react'
import { ChevronRight, Plus, ReceiptText, Search, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '@/@types/quote'
import { EmptyState } from '@/components/shared/EmptyState'
import {
    Button,
    ButtonLink,
    Card,
    Input,
    Select,
    Skeleton,
    Spinner,
    type SelectOption,
} from '@/components/ui'
import { QUOTE_STATUS_LABELS } from '@/constants/quote.constant'
import { ADMIN_ROUTES, adminQuotePath } from '@/constants/route.constant'
import { getErrorMessage } from '@/services/errors'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDay } from '@/utils/formatDate'
import { useDebouncedValue } from '@/utils/hooks/useDebouncedValue'
import { CatalogPagination } from '@/views/catalog/components/CatalogPagination'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminQuotes } from '@/views/admin/hooks/useAdminQuotes'
import { QuoteStatusBadge } from '@/views/admin/quotes/components/QuoteStatusBadge'

const SEARCH_DEBOUNCE_MS = 350
const SKELETON_ROWS = 6

const STATUS_OPTIONS: SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    ...QUOTE_STATUSES.map((status) => ({ value: status, label: QUOTE_STATUS_LABELS[status] })),
]

const headerCellClass =
    'px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-soft uppercase'
const cellClass = 'px-4 py-3 align-middle'

function isQuoteStatus(value: string | null): value is QuoteStatus {
    return value !== null && (QUOTE_STATUSES as readonly string[]).includes(value)
}

function QuoteTotal({ quote, align }: { quote: Quote; align?: 'right' }) {
    return (
        <div className={align === 'right' ? 'text-right' : undefined}>
            <p className="font-semibold text-ink tabular-nums">{formatCurrency(quote.total)}</p>
            {quote.totalBs !== null ? (
                <p className="text-xs text-ink-soft tabular-nums">
                    {formatBolivares(quote.totalBs)}
                </p>
            ) : null}
        </div>
    )
}

/** "Cotizaciones": every quote, filtered by status and searched by code or customer. */
export function AdminQuotesView() {
    const [searchParams, setSearchParams] = useSearchParams()
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const search = searchParams.get('q') ?? ''
    const rawStatus = searchParams.get('estado')
    const status = isQuoteStatus(rawStatus) ? rawStatus : undefined
    const [searchInput, setSearchInput] = useState(search)
    const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS)
    const quotes = useAdminQuotes({ status, search: search || undefined, page })

    const updateParams = (patch: Record<string, string | null>) => {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current)
                for (const [key, value] of Object.entries(patch)) {
                    if (value) next.set(key, value)
                    else next.delete(key)
                }
                return next
            },
            { replace: true },
        )
    }

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

    const items = quotes.data?.items ?? []
    const totalPages = quotes.data
        ? Math.max(1, Math.ceil(quotes.data.total / Math.max(1, quotes.data.pageSize)))
        : 1
    const hasFilters = Boolean(search || status)

    return (
        <>
            <AdminPageHeader
                title="Cotizaciones"
                description="Presupuestos para clientes: se envían en PDF por correo o WhatsApp y se convierten en pedidos."
                actions={
                    <ButtonLink
                        to={ADMIN_ROUTES.quoteNew}
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Nueva cotización
                    </ButtonLink>
                }
            />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="w-full sm:max-w-sm">
                    <Input
                        label="Buscar cotizaciones"
                        hideLabel
                        type="search"
                        placeholder="Código, cliente o empresa"
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
                <Select
                    label="Estado"
                    hideLabel
                    options={STATUS_OPTIONS}
                    value={status ?? ''}
                    onChange={(event) =>
                        updateParams({ estado: event.target.value || null, page: null })
                    }
                    className="sm:w-60"
                />
                {quotes.isFetching && !quotes.isPending ? (
                    <Spinner
                        size="sm"
                        className="mt-3 text-brand-600"
                        label="Actualizando la lista"
                    />
                ) : null}
            </div>

            {quotes.isPending ? (
                <Card padding="none" className="divide-y divide-line overflow-hidden">
                    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                        <div key={index} className="flex items-center gap-4 p-4">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="w-20" />
                        </div>
                    ))}
                </Card>
            ) : quotes.isError ? (
                <EmptyState
                    title="No pudimos cargar las cotizaciones"
                    description={getErrorMessage(quotes.error)}
                    icon={<ReceiptText className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void quotes.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title={
                        hasFilters ? 'Ninguna cotización coincide' : 'Todavía no hay cotizaciones'
                    }
                    description={
                        hasFilters
                            ? 'Prueba con otra búsqueda u otro estado.'
                            : 'Crea la primera para enviarle un presupuesto a un cliente.'
                    }
                    icon={<ReceiptText className="size-6" />}
                    action={
                        hasFilters ? (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSearchInput('')
                                    setSearchParams({}, { replace: true })
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        ) : (
                            <ButtonLink to={ADMIN_ROUTES.quoteNew}>Nueva cotización</ButtonLink>
                        )
                    }
                />
            ) : (
                <div className="@container">
                    <Card padding="none" className="hidden overflow-hidden @3xl:block">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[48rem] table-fixed text-sm">
                                <colgroup>
                                    <col className="w-36" />
                                    <col />
                                    <col className="w-36" />
                                    <col className="w-44" />
                                    <col className="w-32" />
                                    <col className="w-14" />
                                </colgroup>
                                <thead className="border-b border-line bg-page">
                                    <tr>
                                        <th scope="col" className={headerCellClass}>
                                            Código
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Cliente
                                        </th>
                                        <th scope="col" className={`${headerCellClass} text-right`}>
                                            Total
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Estado
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Válida hasta
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            <span className="sr-only">Abrir</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {items.map((quote) => (
                                        <tr key={quote.code} className="transition hover:bg-page">
                                            <td className={cellClass}>
                                                <Link
                                                    to={adminQuotePath(quote.code)}
                                                    className="text-base font-bold text-ink tabular-nums hover:text-brand-700"
                                                >
                                                    {quote.code}
                                                </Link>
                                                <p className="text-xs text-ink-soft">
                                                    {quote.items.length}{' '}
                                                    {quote.items.length === 1 ? 'línea' : 'líneas'}
                                                </p>
                                            </td>
                                            <td className={cellClass}>
                                                <p className="truncate font-semibold text-ink">
                                                    {quote.customerName}
                                                </p>
                                                <p className="truncate text-xs text-ink-soft">
                                                    {quote.customerCompany ?? quote.customerEmail}
                                                </p>
                                            </td>
                                            <td className={cellClass}>
                                                <QuoteTotal quote={quote} align="right" />
                                            </td>
                                            <td className={cellClass}>
                                                <QuoteStatusBadge status={quote.status} />
                                            </td>
                                            <td className={`${cellClass} text-ink-soft`}>
                                                {formatDay(quote.validUntil)}
                                            </td>
                                            <td className={cellClass}>
                                                <Link
                                                    to={adminQuotePath(quote.code)}
                                                    aria-label={`Abrir la cotización ${quote.code}`}
                                                    className="flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-mist hover:text-ink"
                                                >
                                                    <ChevronRight
                                                        aria-hidden="true"
                                                        className="size-5"
                                                    />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @3xl:hidden">
                        {items.map((quote) => (
                            <li key={quote.code}>
                                <Card padding="sm" className="flex h-full flex-col gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-1">
                                            <Link
                                                to={adminQuotePath(quote.code)}
                                                className="text-lg font-bold text-ink tabular-nums"
                                            >
                                                {quote.code}
                                            </Link>
                                            <p className="truncate text-sm font-semibold text-ink">
                                                {quote.customerName}
                                            </p>
                                            <QuoteStatusBadge status={quote.status} />
                                        </div>
                                        <QuoteTotal quote={quote} align="right" />
                                    </div>
                                    <p className="mt-auto border-t border-line pt-3 text-xs text-ink-soft">
                                        Válida hasta el {formatDay(quote.validUntil)}
                                    </p>
                                </Card>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8">
                        <CatalogPagination
                            page={quotes.data?.page ?? page}
                            totalPages={totalPages}
                            onPageChange={(next) =>
                                updateParams({ page: next > 1 ? String(next) : null })
                            }
                        />
                    </div>
                </div>
            )}
        </>
    )
}
