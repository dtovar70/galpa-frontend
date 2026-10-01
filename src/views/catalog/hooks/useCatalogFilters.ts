import { useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import type { AvailabilityFilter, ProductQueryParams, SortOption } from '@/@types/common'
import { PRODUCT_TAGS, type CategorySlug, type ProductTag } from '@/@types/product'
import { categoryPath, ROUTES } from '@/constants/route.constant'

export const CATALOG_SEARCH_PARAM = 'search'
export const CATALOG_PAGE_SIZE = 12

/** Query-string keys. `btuMin`/`btuMax` are also what the home BTU calculator links to. */
export const CATALOG_PARAMS = {
    sort: 'sort',
    price: 'price',
    tags: 'tags',
    brand: 'brand',
    availability: 'availability',
    btuMin: 'btuMin',
    btuMax: 'btuMax',
    voltage: 'voltage',
    inverter: 'inverter',
    page: 'page',
} as const

export const SORT_OPTIONS = [
    'relevance',
    'price-asc',
    'price-desc',
    'newest',
] as const satisfies readonly SortOption[]

export const AVAILABILITY_FILTERS = [
    'IN_STOCK',
    'ON_ORDER',
] as const satisfies readonly AvailabilityFilter[]

export type PriceBracketId = 'all' | 'under-300' | '300-to-700' | '700-to-1500' | 'over-1500'

export interface PriceBracket {
    id: PriceBracketId
    label: string
    minPrice?: number
    maxPrice?: number
}

export const PRICE_BRACKETS: readonly PriceBracket[] = [
    { id: 'all', label: 'Todos los precios' },
    { id: 'under-300', label: 'Hasta $300', maxPrice: 300 },
    { id: '300-to-700', label: '$300 – $700', minPrice: 300, maxPrice: 700 },
    { id: '700-to-1500', label: '$700 – $1.500', minPrice: 700, maxPrice: 1500 },
    { id: 'over-1500', label: 'Más de $1.500', minPrice: 1500 },
]

const PRICE_BRACKET_IDS = PRICE_BRACKETS.map((bracket) => bracket.id)

export interface CatalogFilters {
    category?: CategorySlug
    search: string
    sort: SortOption
    priceBracket: PriceBracketId
    tags: ProductTag[]
    brands: string[]
    availability?: AvailabilityFilter
    btuMin?: number
    btuMax?: number
    voltage?: string
    /** Only inverter units. */
    inverterOnly: boolean
    page: number
}

export interface UseCatalogFiltersResult {
    filters: CatalogFilters
    queryParams: ProductQueryParams
    /** Filters besides the category and the search (the badge on the "Filtros" button). */
    activeFilterCount: number
    isFiltered: boolean
    setCategory: (category?: CategorySlug) => void
    setSearch: (search: string) => void
    setSort: (sort: SortOption) => void
    setPriceBracket: (bracket: PriceBracketId) => void
    toggleTag: (tag: ProductTag) => void
    toggleBrand: (brand: string) => void
    setAvailability: (availability?: AvailabilityFilter) => void
    /** A capacity range; `undefined` on both ends clears it. */
    setBtuRange: (min?: number, max?: number) => void
    setVoltage: (voltage?: string) => void
    setInverterOnly: (inverterOnly: boolean) => void
    setPage: (page: number) => void
    clearFilters: () => void
}

function isMember<T extends string>(allowed: readonly T[], value: string | null): value is T {
    return value !== null && (allowed as readonly string[]).includes(value)
}

function positiveInt(value: string | null): number | undefined {
    if (value === null) return undefined
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function list(value: string | null): string[] {
    return (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

function parseFilters(categoryParam: string | undefined, params: URLSearchParams): CatalogFilters {
    const rawSort = params.get(CATALOG_PARAMS.sort)
    const rawPrice = params.get(CATALOG_PARAMS.price)
    const rawAvailability = params.get(CATALOG_PARAMS.availability)

    return {
        // Categories are dynamic: any slug is kept, and the view decides whether it exists.
        category: categoryParam || undefined,
        search: params.get(CATALOG_SEARCH_PARAM)?.trim() ?? '',
        sort: isMember(SORT_OPTIONS, rawSort) ? rawSort : 'relevance',
        priceBracket: isMember(PRICE_BRACKET_IDS, rawPrice) ? rawPrice : 'all',
        tags: list(params.get(CATALOG_PARAMS.tags)).filter((tag): tag is ProductTag =>
            isMember(PRODUCT_TAGS, tag),
        ),
        brands: [...new Set(list(params.get(CATALOG_PARAMS.brand)))],
        availability: isMember(AVAILABILITY_FILTERS, rawAvailability) ? rawAvailability : undefined,
        btuMin: positiveInt(params.get(CATALOG_PARAMS.btuMin)),
        btuMax: positiveInt(params.get(CATALOG_PARAMS.btuMax)),
        voltage: params.get(CATALOG_PARAMS.voltage)?.trim() || undefined,
        inverterOnly: params.get(CATALOG_PARAMS.inverter) === 'true',
        page: positiveInt(params.get(CATALOG_PARAMS.page)) ?? 1,
    }
}

function serializeFilters(filters: CatalogFilters): string {
    const params = new URLSearchParams()

    if (filters.search) params.set(CATALOG_SEARCH_PARAM, filters.search)
    if (filters.sort !== 'relevance') params.set(CATALOG_PARAMS.sort, filters.sort)
    if (filters.priceBracket !== 'all') params.set(CATALOG_PARAMS.price, filters.priceBracket)
    if (filters.tags.length > 0) params.set(CATALOG_PARAMS.tags, filters.tags.join(','))
    if (filters.brands.length > 0) params.set(CATALOG_PARAMS.brand, filters.brands.join(','))
    if (filters.availability) params.set(CATALOG_PARAMS.availability, filters.availability)
    if (filters.btuMin !== undefined) params.set(CATALOG_PARAMS.btuMin, String(filters.btuMin))
    if (filters.btuMax !== undefined) params.set(CATALOG_PARAMS.btuMax, String(filters.btuMax))
    if (filters.voltage) params.set(CATALOG_PARAMS.voltage, filters.voltage)
    if (filters.inverterOnly) params.set(CATALOG_PARAMS.inverter, 'true')
    if (filters.page > 1) params.set(CATALOG_PARAMS.page, String(filters.page))

    const query = params.toString()
    return query ? `?${query}` : ''
}

function toQueryParams(filters: CatalogFilters): ProductQueryParams {
    const bracket = PRICE_BRACKETS.find((candidate) => candidate.id === filters.priceBracket)

    return {
        category: filters.category,
        search: filters.search || undefined,
        sort: filters.sort,
        minPrice: bracket?.minPrice,
        maxPrice: bracket?.maxPrice,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        brands: filters.brands.length > 0 ? filters.brands : undefined,
        availability: filters.availability,
        btuMin: filters.btuMin,
        btuMax: filters.btuMax,
        voltage: filters.voltage,
        inverter: filters.inverterOnly ? true : undefined,
        page: filters.page,
        pageSize: CATALOG_PAGE_SIZE,
    }
}

function countActive(filters: CatalogFilters): number {
    return (
        (filters.priceBracket !== 'all' ? 1 : 0) +
        filters.tags.length +
        filters.brands.length +
        (filters.availability ? 1 : 0) +
        (filters.btuMin !== undefined || filters.btuMax !== undefined ? 1 : 0) +
        (filters.voltage ? 1 : 0) +
        (filters.inverterOnly ? 1 : 0)
    )
}

/** Toggles `value` in `values`. */
function toggled<T>(values: readonly T[], value: T): T[] {
    return values.includes(value)
        ? values.filter((current) => current !== value)
        : [...values, value]
}

/** `/catalogo?btuMin=…&btuMax=…`: the catalog filtered to a capacity range. */
export function catalogBtuPath(btuMin: number, btuMax: number): string {
    const params = new URLSearchParams({
        [CATALOG_PARAMS.btuMin]: String(btuMin),
        [CATALOG_PARAMS.btuMax]: String(btuMax),
    })
    return `${ROUTES.catalog}?${params.toString()}`
}

/**
 * Single owner of the catalog's URL state: the category lives in the path segment
 * (`/catalogo/:category`) and every other filter in the query string, so any view
 * state is shareable as a link.
 */
export function useCatalogFilters(): UseCatalogFiltersResult {
    const { category: categoryParam } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const rawQuery = searchParams.toString()

    const filters = useMemo(
        () => parseFilters(categoryParam, new URLSearchParams(rawQuery)),
        [categoryParam, rawQuery],
    )

    const applyFilters = useCallback(
        (patch: Partial<CatalogFilters>) => {
            const next: CatalogFilters = { ...filters, page: 1, ...patch }
            const pathname = next.category ? categoryPath(next.category) : ROUTES.catalog

            void navigate(`${pathname}${serializeFilters(next)}`, { replace: true })
        },
        [filters, navigate],
    )

    const activeFilterCount = countActive(filters)

    return {
        filters,
        queryParams: toQueryParams(filters),
        activeFilterCount,
        isFiltered:
            filters.category !== undefined ||
            filters.search !== '' ||
            filters.sort !== 'relevance' ||
            activeFilterCount > 0,
        // A brand or capacity of one category may not exist in another: switching clears them.
        setCategory: (category) =>
            applyFilters({ category, brands: [], btuMin: undefined, btuMax: undefined }),
        setSearch: (search) => applyFilters({ search }),
        setSort: (sort) => applyFilters({ sort }),
        setPriceBracket: (priceBracket) => applyFilters({ priceBracket }),
        toggleTag: (tag) => applyFilters({ tags: toggled(filters.tags, tag) }),
        toggleBrand: (brand) => applyFilters({ brands: toggled(filters.brands, brand) }),
        setAvailability: (availability) => applyFilters({ availability }),
        setBtuRange: (btuMin, btuMax) => applyFilters({ btuMin, btuMax }),
        setVoltage: (voltage) => applyFilters({ voltage }),
        setInverterOnly: (inverterOnly) => applyFilters({ inverterOnly }),
        setPage: (page) => applyFilters({ page }),
        clearFilters: () => void navigate(ROUTES.catalog, { replace: true }),
    }
}
