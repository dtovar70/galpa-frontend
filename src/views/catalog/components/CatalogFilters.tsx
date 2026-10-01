import { cva } from 'class-variance-authority'

import type { CategorySlug, ProductTag } from '@/@types/product'
import { Button } from '@/components/ui'
import { useCategories } from '@/views/catalog/hooks/useCategories'
import {
    PRICE_BRACKETS,
    PRODUCT_TAGS,
    type CatalogFilters as CatalogFiltersState,
    type PriceBracketId,
} from '@/views/catalog/hooks/useCatalogFilters'
import { PRODUCT_TAG_LABELS } from '@/constants/product.constant'

const chipVariants = cva(
    'inline-flex cursor-pointer items-center rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition duration-200 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-blush-400 has-[input:focus-visible]:ring-offset-2',
    {
        variants: {
            isSelected: {
                true: 'border-blush-400 bg-blush-100 text-blush-700',
                false: 'border-line bg-white text-ink-soft hover:border-blush-200 hover:text-ink',
            },
        },
        defaultVariants: { isSelected: false },
    },
)

export interface CatalogFiltersProps {
    filters: CatalogFiltersState
    isFiltered: boolean
    onCategoryChange: (category?: CategorySlug) => void
    onPriceBracketChange: (bracket: PriceBracketId) => void
    onTagToggle: (tag: ProductTag) => void
    onClear: () => void
}

export function CatalogFilters({
    filters,
    isFiltered,
    onCategoryChange,
    onPriceBracketChange,
    onTagToggle,
    onClear,
}: CatalogFiltersProps) {
    const { data: categories } = useCategories()

    return (
        <div className="space-y-7">
            <fieldset className="space-y-3">
                <legend className="font-display text-base text-ink">Categoría</legend>
                <div className="flex flex-wrap gap-2">
                    <label className={chipVariants({ isSelected: filters.category === undefined })}>
                        <input
                            type="radio"
                            name="category"
                            className="sr-only"
                            checked={filters.category === undefined}
                            onChange={() => onCategoryChange(undefined)}
                        />
                        Todas
                    </label>

                    {(categories ?? []).map((category) => (
                        <label
                            key={category.slug}
                            className={chipVariants({
                                isSelected: filters.category === category.slug,
                            })}
                        >
                            <input
                                type="radio"
                                name="category"
                                className="sr-only"
                                checked={filters.category === category.slug}
                                onChange={() => onCategoryChange(category.slug)}
                            />
                            {category.name}
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="font-display text-base text-ink">Precio</legend>
                <div className="flex flex-wrap gap-2">
                    {PRICE_BRACKETS.map((bracket) => (
                        <label
                            key={bracket.id}
                            className={chipVariants({
                                isSelected: filters.priceBracket === bracket.id,
                            })}
                        >
                            <input
                                type="radio"
                                name="price"
                                className="sr-only"
                                checked={filters.priceBracket === bracket.id}
                                onChange={() => onPriceBracketChange(bracket.id)}
                            />
                            {bracket.label}
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="font-display text-base text-ink">Etiquetas</legend>
                <div className="flex flex-wrap gap-2">
                    {PRODUCT_TAGS.map((tag) => (
                        <label
                            key={tag}
                            className={chipVariants({ isSelected: filters.tags.includes(tag) })}
                        >
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={filters.tags.includes(tag)}
                                onChange={() => onTagToggle(tag)}
                            />
                            {PRODUCT_TAG_LABELS[tag]}
                        </label>
                    ))}
                </div>
            </fieldset>

            {isFiltered ? (
                <Button variant="secondary" size="sm" fullWidth onClick={onClear}>
                    Limpiar filtros
                </Button>
            ) : null}
        </div>
    )
}
