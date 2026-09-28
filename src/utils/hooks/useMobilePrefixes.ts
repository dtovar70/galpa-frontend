import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { SelectOption } from '@/components/ui'
import { queryKeys } from '@/constants/query-keys.constant'
import { CatalogService } from '@/services/CatalogService'

/**
 * The active mobile operator codes (`GET /catalogs/mobile-prefixes`) for `MobilePhoneField`,
 * plus their options. The admin Catálogos page invalidates this key after every change.
 */
export function useMobilePrefixes() {
    const query = useQuery({
        queryKey: queryKeys.catalogs.mobilePrefixes(),
        queryFn: ({ signal }) => CatalogService.getMobilePrefixes(signal),
        staleTime: 10 * 60_000,
    })
    const options = useMemo<SelectOption[]>(
        () => (query.data ?? []).map(({ code }) => ({ value: code, label: code })),
        [query.data],
    )
    return { ...query, prefixes: query.data ?? [], options }
}
