import type { ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'

import { PRODUCT_TAGS } from '@/@types/product'
import { Button, Switch } from '@/components/ui'
import { AVAILABILITY_LABELS, formatBtu, PRODUCT_TAG_LABELS } from '@/constants/product.constant'
import { useCategories } from '@/views/catalog/hooks/useCategories'
import {
    AVAILABILITY_FILTERS,
    PRICE_BRACKETS,
    type UseCatalogFiltersResult,
} from '@/views/catalog/hooks/useCatalogFilters'
import { useProductFacets } from '@/views/catalog/hooks/useProductFacets'

const chipVariants = cva(
    'inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm font-semibold transition duration-200 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500 has-[input:focus-visible]:ring-offset-2',
    {
        variants: {
            isSelected: {
                true: 'border-brand-500 bg-brand-50 text-brand-800',
                false: 'border-line-strong bg-white text-ink-soft hover:border-ink/40 hover:text-ink',
            },
            tech: { true: 'tabular-nums', false: '' },
        },
        defaultVariants: { isSelected: false, tech: false },
    },
)

const LEGEND_CLASS = 'text-xs font-bold tracking-[0.12em] text-ink uppercase'

interface ChipProps {
    type: 'radio' | 'checkbox'
    name: string
    checked: boolean
    onChange: () => void
    tech?: boolean
    children: ReactNode
}

function Chip({ type, name, checked, onChange, tech = false, children }: ChipProps) {
    return (
        <label className={chipVariants({ isSelected: checked, tech })}>
            <input
                type={type}
                name={name}
                className="sr-only"
                checked={checked}
                onChange={onChange}
            />
            {children}
        </label>
    )
}

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
    return (
        <fieldset className="space-y-3">
            <legend className={LEGEND_CLASS}>{legend}</legend>
            <div className="flex flex-wrap gap-2">{children}</div>
        </fieldset>
    )
}

export interface CatalogFiltersProps {
    catalog: UseCatalogFiltersResult
}

export function CatalogFilters({ catalog }: CatalogFiltersProps) {
    const { filters } = catalog
    const { data: categories } = useCategories()
    const { data: facets } = useProductFacets(filters.category)
    const btus = facets?.btus ?? []
    const isExactBtu =
        filters.btuMin !== undefined &&
        filters.btuMin === filters.btuMax &&
        btus.includes(filters.btuMin)
    // A range from the home calculator: shown as one removable chip.
    const btuRange =
        (filters.btuMin !== undefined || filters.btuMax !== undefined) && !isExactBtu
            ? [filters.btuMin, filters.btuMax]
            : null

    return (
        <div className="space-y-7">
            <FilterGroup legend="Categoría">
                <Chip
                    type="radio"
                    name="category"
                    checked={filters.category === undefined}
                    onChange={() => catalog.setCategory(undefined)}
                >
                    Todas
                </Chip>
                {(categories ?? []).map((category) => (
                    <Chip
                        key={category.slug}
                        type="radio"
                        name="category"
                        checked={filters.category === category.slug}
                        onChange={() => catalog.setCategory(category.slug)}
                    >
                        {category.name}
                    </Chip>
                ))}
            </FilterGroup>

            <FilterGroup legend="Disponibilidad">
                <Chip
                    type="radio"
                    name="availability"
                    checked={filters.availability === undefined}
                    onChange={() => catalog.setAvailability(undefined)}
                >
                    Todas
                </Chip>
                {AVAILABILITY_FILTERS.map((availability) => (
                    <Chip
                        key={availability}
                        type="radio"
                        name="availability"
                        checked={filters.availability === availability}
                        onChange={() => catalog.setAvailability(availability)}
                    >
                        {AVAILABILITY_LABELS[availability]}
                    </Chip>
                ))}
            </FilterGroup>

            {facets && facets.brands.length > 0 ? (
                <FilterGroup legend="Marca">
                    {facets.brands.map((brand) => (
                        <Chip
                            key={brand}
                            type="checkbox"
                            name="brand"
                            checked={filters.brands.includes(brand)}
                            onChange={() => catalog.toggleBrand(brand)}
                        >
                            {brand}
                        </Chip>
                    ))}
                </FilterGroup>
            ) : null}

            {btus.length > 0 || btuRange ? (
                <FilterGroup legend="Capacidad">
                    {btuRange ? (
                        <button
                            type="button"
                            onClick={() => catalog.setBtuRange(undefined, undefined)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 tabular-nums transition hover:bg-brand-100"
                            aria-label="Quitar el rango de capacidad"
                        >
                            {btuRange[0] !== undefined ? formatBtu(btuRange[0]) : '…'} –{' '}
                            {btuRange[1] !== undefined ? formatBtu(btuRange[1]) : '…'}
                            <X aria-hidden="true" className="size-3.5" />
                        </button>
                    ) : null}
                    {btus.map((btu) => {
                        const checked = isExactBtu && filters.btuMin === btu
                        return (
                            <Chip
                                key={btu}
                                type="checkbox"
                                name="btu"
                                tech
                                checked={checked}
                                onChange={() =>
                                    checked
                                        ? catalog.setBtuRange(undefined, undefined)
                                        : catalog.setBtuRange(btu, btu)
                                }
                            >
                                {formatBtu(btu)}
                            </Chip>
                        )
                    })}
                </FilterGroup>
            ) : null}

            {facets && facets.voltages.length > 0 ? (
                <FilterGroup legend="Voltaje">
                    <Chip
                        type="radio"
                        name="voltage"
                        checked={filters.voltage === undefined}
                        onChange={() => catalog.setVoltage(undefined)}
                    >
                        Todos
                    </Chip>
                    {facets.voltages.map((voltage) => (
                        <Chip
                            key={voltage}
                            type="radio"
                            name="voltage"
                            tech
                            checked={filters.voltage === voltage}
                            onChange={() => catalog.setVoltage(voltage)}
                        >
                            {voltage}
                        </Chip>
                    ))}
                </FilterGroup>
            ) : null}

            <div className="flex items-center justify-between gap-3">
                <span aria-hidden="true" className={LEGEND_CLASS}>
                    Solo inverter
                </span>
                <Switch
                    checked={filters.inverterOnly}
                    onChange={catalog.setInverterOnly}
                    label="Mostrar solo equipos inverter"
                />
            </div>

            <FilterGroup legend="Precio">
                {PRICE_BRACKETS.map((bracket) => (
                    <Chip
                        key={bracket.id}
                        type="radio"
                        name="price"
                        checked={filters.priceBracket === bracket.id}
                        onChange={() => catalog.setPriceBracket(bracket.id)}
                    >
                        {bracket.label}
                    </Chip>
                ))}
            </FilterGroup>

            <FilterGroup legend="Etiquetas">
                {PRODUCT_TAGS.map((tag) => (
                    <Chip
                        key={tag}
                        type="checkbox"
                        name="tags"
                        checked={filters.tags.includes(tag)}
                        onChange={() => catalog.toggleTag(tag)}
                    >
                        {PRODUCT_TAG_LABELS[tag]}
                    </Chip>
                ))}
            </FilterGroup>

            {catalog.isFiltered ? (
                <Button variant="secondary" size="sm" fullWidth onClick={catalog.clearFilters}>
                    Limpiar filtros
                </Button>
            ) : null}
        </div>
    )
}
