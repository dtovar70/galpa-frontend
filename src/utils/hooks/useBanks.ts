import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { Bank } from '@/@types/catalog'
import type { SelectOption } from '@/components/ui'
import { queryKeys } from '@/constants/query-keys.constant'
import { CatalogService } from '@/services/CatalogService'

/** "0134 - Banesco", as the bank selects show them. */
export function bankOptionLabel(bank: Bank): string {
    return `${bank.code} - ${bank.name}`
}

/**
 * The active banks (`GET /catalogs/banks`) for the bank selects of the bolívar methods, plus their options.
 * The admin banks page invalidates this key after every change.
 */
export function useBanks() {
    const query = useQuery({
        queryKey: queryKeys.catalogs.banks(),
        queryFn: ({ signal }) => CatalogService.getBanks(signal),
        staleTime: 10 * 60_000,
    })
    const options = useMemo<SelectOption[]>(
        () =>
            (query.data ?? []).map((bank) => ({ value: bank.code, label: bankOptionLabel(bank) })),
        [query.data],
    )
    return { ...query, banks: query.data ?? [], options }
}
