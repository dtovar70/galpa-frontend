import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { PaymentMethodInfo } from '@/@types/catalog'
import type { PaymentMethod } from '@/@types/order'
import type { SelectOption } from '@/components/ui'
import { queryKeys } from '@/constants/query-keys.constant'
import { CatalogService } from '@/services/CatalogService'
import { prettifyStatusCode } from '@/utils/hooks/useOrderStatusCatalog'

/** `codes` in the order of `catalog` (sorted methods); codes it lacks go last. */
export function sortPaymentMethods(
    codes: readonly PaymentMethod[],
    catalog: readonly PaymentMethodInfo[],
): PaymentMethod[] {
    const position = new Map(catalog.map((method, index) => [method.code, index]))
    const at = (code: PaymentMethod) => position.get(code) ?? catalog.length
    return [...codes].sort((a, b) => at(a) - at(b))
}

/**
 * The payment methods (`GET /catalogs/payment-methods`): names, checkout help texts, icons and
 * order, loaded once per session; editing them in Catálogos refreshes this copy. While loading
 * (or if the request failed) `methods` is empty and `label` prettifies the code.
 */
export function usePaymentMethods() {
    const query = useQuery({
        queryKey: queryKeys.catalogs.paymentMethods(),
        queryFn: ({ signal }) => CatalogService.getPaymentMethods(signal),
        staleTime: 30 * 60_000,
        gcTime: Infinity,
        refetchOnWindowFocus: true,
    })
    const methods = useMemo(
        () => [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
        [query.data],
    )
    return useMemo(() => {
        const byCode = new Map(methods.map((method) => [method.code, method]))
        const label = (code: PaymentMethod): string =>
            byCode.get(code)?.label ?? prettifyStatusCode(code)
        return {
            ...query,
            methods,
            method: (code: PaymentMethod): PaymentMethodInfo | undefined => byCode.get(code),
            label,
            /** The icon name to draw with `PaymentMethodIconGlyph`. */
            iconName: (code: PaymentMethod): string | undefined => byCode.get(code)?.icon,
            /** `codes` in the catalog's order; codes it lacks go last. */
            sort: (codes: readonly PaymentMethod[]): PaymentMethod[] =>
                sortPaymentMethods(codes, methods),
            /** Select options of `codes` (every method by default), in catalog order. */
            options: (codes?: readonly PaymentMethod[]): SelectOption[] =>
                (codes
                    ? sortPaymentMethods(codes, methods)
                    : methods.map((method) => method.code)
                ).map((code) => ({ value: code, label: label(code) })),
        }
    }, [query, methods])
}
