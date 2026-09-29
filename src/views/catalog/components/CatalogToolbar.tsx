import type { SortOption } from '@/@types/common'
import { Select, type SelectOption } from '@/components/ui'

const SORT_SELECT_OPTIONS: SelectOption[] = [
    { value: 'relevance', label: 'Más relevantes' },
    { value: 'newest', label: 'Más nuevos' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
]

const SORT_VALUES = SORT_SELECT_OPTIONS.map((option) => option.value)

export interface CatalogToolbarProps {
    total: number
    sort: SortOption
    isRefreshing: boolean
    onSortChange: (sort: SortOption) => void
}

function isSortOption(value: string): value is SortOption {
    return SORT_VALUES.includes(value)
}

export function CatalogToolbar({ total, sort, isRefreshing, onSortChange }: CatalogToolbarProps) {
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-sm text-ink-soft">
                {isRefreshing ? (
                    'Actualizando resultados…'
                ) : (
                    <>
                        <span className="font-semibold text-ink">{total}</span>{' '}
                        {total === 1 ? 'producto encontrado' : 'productos encontrados'}
                    </>
                )}
            </p>

            <Select
                label="Ordenar por"
                hideLabel
                options={SORT_SELECT_OPTIONS}
                value={sort}
                onChange={(event) => {
                    if (isSortOption(event.target.value)) onSortChange(event.target.value)
                }}
                className="sm:w-60"
            />
        </div>
    )
}
