import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronRight, Plus, Search } from 'lucide-react'

import type { AdminProduct } from '@/@types/admin'
import type { ProductVariant } from '@/@types/product'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { Input, Spinner } from '@/components/ui'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminService } from '@/services/AdminService'
import { formatCurrency } from '@/utils/formatCurrency'
import { useDebouncedValue } from '@/utils/hooks/useDebouncedValue'

const RESULTS = 8
const SEARCH_DEBOUNCE_MS = 300

export interface QuoteProductPickerProps {
    /** `variant` is the chosen version of a product with variants (null otherwise). */
    onPick: (product: AdminProduct, variant: ProductVariant | null) => void
    disabled?: boolean
}

/** Searches the catalog (hidden products included) and adds the chosen one as a quote line. */
export function QuoteProductPicker({ onPick, disabled = false }: QuoteProductPickerProps) {
    const [term, setTerm] = useState('')
    // A product with variants opens its versions first: converting the quote needs one.
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const search = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS)
    const params = { search, pageSize: RESULTS }
    const results = useQuery({
        queryKey: queryKeys.admin.products.list(params),
        queryFn: () => AdminService.getProducts(params),
        enabled: search.length >= 2,
        placeholderData: keepPreviousData,
    })
    const products = search.length >= 2 ? (results.data?.items ?? []) : []
    const pick = (product: AdminProduct, variant: ProductVariant | null) => {
        onPick(product, variant)
        setTerm('')
        setExpandedId(null)
    }

    return (
        <div className="space-y-3">
            <Input
                label="Buscar un producto del catálogo"
                type="search"
                placeholder="Nombre, marca, modelo o SKU"
                value={term}
                disabled={disabled}
                onChange={(event) => setTerm(event.target.value)}
                leadingIcon={<Search aria-hidden="true" className="size-4" />}
                trailingAction={
                    results.isFetching ? (
                        <Spinner size="sm" className="mr-2 text-brand-600" />
                    ) : null
                }
            />
            {search.length >= 2 && !results.isPending && products.length === 0 ? (
                <p className="text-sm text-ink-soft">
                    No encontramos productos para «{search}». Puedes agregar una línea libre.
                </p>
            ) : null}
            {products.length > 0 ? (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                    {products.map((product) => {
                        const hasVariants = product.variants.length > 0
                        const isExpanded = expandedId === product.id
                        return (
                            <li key={product.id}>
                                <button
                                    type="button"
                                    aria-expanded={hasVariants ? isExpanded : undefined}
                                    onClick={() => {
                                        if (hasVariants) {
                                            setExpandedId(isExpanded ? null : product.id)
                                        } else {
                                            pick(product, null)
                                        }
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-page focus-visible:bg-page"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-ink">
                                            {product.name}
                                        </span>
                                        <span className="block truncate text-xs text-ink-soft">
                                            {[product.brand, product.model, product.sku]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 flex-col items-end gap-1">
                                        <span className="text-sm font-semibold text-ink tabular-nums">
                                            {formatCurrency(product.price)}
                                        </span>
                                        <AvailabilityBadge product={product} />
                                    </span>
                                    {hasVariants ? (
                                        <ChevronRight
                                            aria-hidden="true"
                                            className={`size-4 shrink-0 text-brand-600 transition ${isExpanded ? 'rotate-90' : ''}`}
                                        />
                                    ) : (
                                        <Plus
                                            aria-hidden="true"
                                            className="size-4 shrink-0 text-brand-600"
                                        />
                                    )}
                                    <span className="sr-only">
                                        {hasVariants
                                            ? 'Elegir la versión'
                                            : 'Agregar a la cotización'}
                                    </span>
                                </button>
                                {hasVariants && isExpanded ? (
                                    <ul
                                        aria-label={`Versiones de ${product.name}`}
                                        className="space-y-1 bg-page px-4 pb-3"
                                    >
                                        {product.variants.map((variant) => (
                                            <li key={variant.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => pick(product, variant)}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white focus-visible:bg-white"
                                                >
                                                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                                                        {variant.label}
                                                    </span>
                                                    {product.stockMode === 'STOCK' ? (
                                                        <span className="text-xs text-ink-soft">
                                                            {variant.stock} en stock
                                                        </span>
                                                    ) : null}
                                                    <span className="font-semibold text-ink tabular-nums">
                                                        {formatCurrency(
                                                            product.price + variant.priceDelta,
                                                        )}
                                                    </span>
                                                    <Plus
                                                        aria-hidden="true"
                                                        className="size-4 shrink-0 text-brand-600"
                                                    />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}
