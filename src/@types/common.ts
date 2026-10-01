import type { CategorySlug, ProductTag } from '@/@types/product'

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest'

export interface Paginated<T> {
    items: T[]
    page: number
    pageSize: number
    total: number
    totalPages: number
}

/** Availability filter of the catalog (out-of-stock products are never filtered for). */
export type AvailabilityFilter = 'IN_STOCK' | 'ON_ORDER'

export interface ProductQueryParams {
    category?: CategorySlug
    search?: string
    sort?: SortOption
    minPrice?: number
    maxPrice?: number
    tags?: ProductTag[]
    brands?: string[]
    availability?: AvailabilityFilter
    btuMin?: number
    btuMax?: number
    voltage?: string
    inverter?: boolean
    page?: number
    pageSize?: number
}
