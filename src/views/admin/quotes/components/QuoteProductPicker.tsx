import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'

import type { AdminProduct } from '@/@types/admin'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { Input, Spinner } from '@/components/ui'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminService } from '@/services/AdminService'
import { formatCurrency } from '@/utils/formatCurrency'
import { useDebouncedValue } from '@/utils/hooks/useDebouncedValue'

const RESULTS = 8
const SEARCH_DEBOUNCE_MS = 300

export interface QuoteProductPickerProps {
    onPick: (product: AdminProduct) => void
    disabled?: boolean
}

/** Searches the catalog (hidden products included) and adds the chosen one as a quote line. */
export function QuoteProductPicker({ onPick, disabled = false }: QuoteProductPickerProps) {
    const [term, setTerm] = useState('')
    const search = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS)
    const params = { search, pageSize: RESULTS }
    const results = useQuery({
        queryKey: queryKeys.admin.products.list(params),
        queryFn: () => AdminService.getProducts(params),
        enabled: search.length >= 2,
        placeholderData: keepPreviousData,
    })
    const products = search.length >= 2 ? (results.data?.items ?? []) : []

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
                    {products.map((product) => (
                        <li key={product.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    onPick(product)
                                    setTerm('')
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
                                <AvailabilityBadge product={product} />
                                <span className="font-tech text-sm font-semibold text-ink">
                                    {formatCurrency(product.price)}
                                </span>
                                <Plus
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-brand-600"
                                />
                                <span className="sr-only">Agregar a la cotización</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}
