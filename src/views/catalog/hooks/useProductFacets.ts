import { useQuery } from '@tanstack/react-query'

import type { CategorySlug } from '@/@types/product'
import { queryKeys } from '@/constants/query-keys.constant'
import { ProductService } from '@/services/ProductService'

/** Brands, capacities and voltages the catalog filters offer (for one category, or all). */
export function useProductFacets(category?: CategorySlug) {
    return useQuery({
        queryKey: queryKeys.products.facets(category),
        queryFn: ({ signal }) => ProductService.getFacets(category, signal),
        staleTime: 5 * 60_000,
    })
}
