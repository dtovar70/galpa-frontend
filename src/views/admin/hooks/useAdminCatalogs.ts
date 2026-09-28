import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type {
    AdminBank,
    AdminMobilePrefix,
    AdminOrderStatusCatalog,
    BankCreateInput,
    BankInput,
    MobilePrefixCreateInput,
    OrderStatusCatalog,
    OrderStatusGroupInput,
    OrderStatusInput,
} from '@/@types/catalog'
import type { OrderStatus } from '@/@types/order'
import { queryKeys } from '@/constants/query-keys.constant'
import { CatalogService } from '@/services/CatalogService'
import { resolveOrderStatusCatalog } from '@/utils/hooks/useOrderStatusCatalog'

/** Drops the admin-only fields: what `GET /catalogs/order-statuses` returns. */
function toPublicCatalog(catalog: AdminOrderStatusCatalog): OrderStatusCatalog {
    return {
        groups: catalog.groups,
        statuses: catalog.statuses.map(({ whatsappTemplate: _template, ...status }) => status),
    }
}

/**
 * The catalog page reads the admin catalog (it carries the WhatsApp templates) and always starts
 * from the saved state, not from the session's copy.
 */
export function useEditableOrderStatusCatalog() {
    return useQuery({
        queryKey: queryKeys.admin.orderStatuses(),
        queryFn: CatalogService.getAdminOrderStatuses,
        refetchOnMount: 'always',
        select: (catalog) => {
            const templates = new Map(
                catalog.statuses.map((status) => [status.code, status.whatsappTemplate]),
            )
            return {
                ...resolveOrderStatusCatalog(toPublicCatalog(catalog)),
                whatsappTemplate: (code: OrderStatus) => templates.get(code) ?? '',
            }
        },
    })
}

/**
 * A saved edit returns the whole catalog: it replaces the cached one right away (badges, tabs
 * and the customer page follow), and the admin orders refetch the labels the API sends.
 */
function applyCatalog(queryClient: QueryClient, catalog: AdminOrderStatusCatalog): Promise<void> {
    queryClient.setQueryData(queryKeys.admin.orderStatuses(), catalog)
    queryClient.setQueryData(queryKeys.catalogs.orderStatuses(), toPublicCatalog(catalog))
    return queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all() })
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, input }: { code: string; input: OrderStatusInput }) =>
            CatalogService.updateOrderStatus(code, input),
        onSuccess: (catalog) => applyCatalog(queryClient, catalog),
    })
}

export function useUpdateOrderStatusGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, input }: { code: string; input: OrderStatusGroupInput }) =>
            CatalogService.updateOrderStatusGroup(code, input),
        onSuccess: (catalog) => applyCatalog(queryClient, catalog),
    })
}

/**
 * Swaps the positions of two tabs (two saves). The catalog is refreshed at the end either way,
 * so a half-applied swap never lingers on screen.
 */
export function useSwapOrderStatusGroups() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ([first, second]: [
            { code: string; sortOrder: number },
            { code: string; sortOrder: number },
        ]) => {
            await CatalogService.updateOrderStatusGroup(first.code, {
                sortOrder: second.sortOrder,
            })
            return CatalogService.updateOrderStatusGroup(second.code, {
                sortOrder: first.sortOrder,
            })
        },
        onSuccess: (catalog) => applyCatalog(queryClient, catalog),
        onError: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.admin.orderStatuses() }),
                queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.orderStatuses() }),
            ]),
    })
}

/** The banks feed the Pago Móvil selects (payment form, content), so both lists go stale. */
function invalidateBankCaches(queryClient: QueryClient): Promise<void> {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.banks() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.banks() }),
    ]).then(() => undefined)
}

export function useAdminBanks() {
    return useQuery({ queryKey: queryKeys.admin.banks(), queryFn: CatalogService.getAdminBanks })
}

export function useCreateBank() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: BankCreateInput) => CatalogService.createBank(input),
        onSuccess: (bank) => {
            queryClient.setQueryData<AdminBank[]>(queryKeys.admin.banks(), (current) =>
                current ? [...current, bank] : current,
            )
            return invalidateBankCaches(queryClient)
        },
    })
}

export function useUpdateBank() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, input }: { code: string; input: BankInput }) =>
            CatalogService.updateBank(code, input),
        onSuccess: (bank) => {
            queryClient.setQueryData<AdminBank[]>(queryKeys.admin.banks(), (current) =>
                current?.map((item) => (item.code === bank.code ? bank : item)),
            )
            return invalidateBankCaches(queryClient)
        },
    })
}

export function useDeleteBank() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => CatalogService.deleteBank(code),
        onSuccess: (_data, code) => {
            queryClient.setQueryData<AdminBank[]>(queryKeys.admin.banks(), (current) =>
                current?.filter((item) => item.code !== code),
            )
            return invalidateBankCaches(queryClient)
        },
        // A 409 means the usage shown was stale: refresh it.
        onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.banks() }),
    })
}

/** Saves the select order; the admin list moves optimistically and rolls back on failure. */
export function useReorderBanks() {
    const queryClient = useQueryClient()
    const listKey = queryKeys.admin.banks()

    return useMutation({
        mutationFn: (codes: string[]) => CatalogService.reorderBanks(codes),
        onMutate: async (codes) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const previous = queryClient.getQueryData<AdminBank[]>(listKey)
            if (previous) {
                const byCode = new Map(previous.map((bank) => [bank.code, bank]))
                queryClient.setQueryData<AdminBank[]>(
                    listKey,
                    codes.flatMap((code, sortOrder) => {
                        const bank = byCode.get(code)
                        return bank ? [{ ...bank, sortOrder }] : []
                    }),
                )
            }
            return { previous }
        },
        onError: (_error, _codes, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous)
        },
        onSuccess: (banks) => queryClient.setQueryData<AdminBank[]>(listKey, banks),
        onSettled: () => invalidateBankCaches(queryClient),
    })
}

/** The codes feed every mobile phone field (content, checkout, payments): both lists go stale. */
function invalidateMobilePrefixCaches(queryClient: QueryClient): Promise<void> {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.mobilePrefixes() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.mobilePrefixes() }),
    ]).then(() => undefined)
}

export function useAdminMobilePrefixes() {
    return useQuery({
        queryKey: queryKeys.admin.mobilePrefixes(),
        queryFn: CatalogService.getAdminMobilePrefixes,
    })
}

export function useCreateMobilePrefix() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: MobilePrefixCreateInput) => CatalogService.createMobilePrefix(input),
        onSuccess: (prefix) => {
            queryClient.setQueryData<AdminMobilePrefix[]>(
                queryKeys.admin.mobilePrefixes(),
                (current) => (current ? [...current, prefix] : current),
            )
            return invalidateMobilePrefixCaches(queryClient)
        },
    })
}

export function useSetMobilePrefixActive() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, isActive }: { code: string; isActive: boolean }) =>
            CatalogService.setMobilePrefixActive(code, isActive),
        onSuccess: (prefix) => {
            queryClient.setQueryData<AdminMobilePrefix[]>(
                queryKeys.admin.mobilePrefixes(),
                (current) => current?.map((item) => (item.code === prefix.code ? prefix : item)),
            )
            return invalidateMobilePrefixCaches(queryClient)
        },
    })
}

export function useDeleteMobilePrefix() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => CatalogService.deleteMobilePrefix(code),
        onSuccess: (_data, code) => {
            queryClient.setQueryData<AdminMobilePrefix[]>(
                queryKeys.admin.mobilePrefixes(),
                (current) => current?.filter((item) => item.code !== code),
            )
            return invalidateMobilePrefixCaches(queryClient)
        },
        // A 409 means the usage shown was stale: refresh it.
        onError: () =>
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.mobilePrefixes() }),
    })
}

/** Saves the select order; the admin list moves optimistically and rolls back on failure. */
export function useReorderMobilePrefixes() {
    const queryClient = useQueryClient()
    const listKey = queryKeys.admin.mobilePrefixes()

    return useMutation({
        mutationFn: (codes: string[]) => CatalogService.reorderMobilePrefixes(codes),
        onMutate: async (codes) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const previous = queryClient.getQueryData<AdminMobilePrefix[]>(listKey)
            if (previous) {
                const byCode = new Map(previous.map((prefix) => [prefix.code, prefix]))
                queryClient.setQueryData<AdminMobilePrefix[]>(
                    listKey,
                    codes.flatMap((code, sortOrder) => {
                        const prefix = byCode.get(code)
                        return prefix ? [{ ...prefix, sortOrder }] : []
                    }),
                )
            }
            return { previous }
        },
        onError: (_error, _codes, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous)
        },
        onSuccess: (prefixes) => queryClient.setQueryData<AdminMobilePrefix[]>(listKey, prefixes),
        onSettled: () => invalidateMobilePrefixCaches(queryClient),
    })
}
