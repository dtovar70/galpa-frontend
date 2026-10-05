import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type {
    AdminBank,
    AdminContactOption,
    AdminMobilePrefix,
    AdminOrderStatusCatalog,
    BankCreateInput,
    BankInput,
    ContactOptionCreateInput,
    ContactOptionInput,
    ContactOptionKind,
    MobilePrefixCreateInput,
    OrderStatusCatalog,
    OrderStatusGroupInput,
    OrderStatusInput,
    PaymentMethodInfo,
    PaymentMethodInput,
    QuoteStatusInfo,
    QuoteStatusInput,
} from '@/@types/catalog'
import type { OrderStatus } from '@/@types/order'
import type { SelectOption } from '@/components/ui'
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

/**
 * The quote statuses (`GET /admin/catalogs/quote-statuses`), in order, with their select options
 * and a lookup by code (undefined while loading or for a code the catalog lacks). ADMIN and
 * EDITOR may read them; editing them in Catálogos refreshes this copy.
 */
export function useQuoteStatuses() {
    const query = useQuery({
        queryKey: queryKeys.admin.quoteStatuses(),
        queryFn: ({ signal }) => CatalogService.getQuoteStatuses(signal),
        staleTime: 10 * 60_000,
    })
    const statuses = useMemo(
        () => [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
        [query.data],
    )
    const options = useMemo<SelectOption[]>(
        () => statuses.map((status) => ({ value: status.code, label: status.label })),
        [statuses],
    )
    const byCode = useMemo(
        () => new Map(statuses.map((status) => [status.code, status])),
        [statuses],
    )
    return {
        ...query,
        statuses,
        options,
        status: (code: string): QuoteStatusInfo | undefined => byCode.get(code),
    }
}

/** A saved edit returns the whole list: it replaces the cached one, and the quotes refetch labels. */
export function useUpdateQuoteStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, input }: { code: string; input: QuoteStatusInput }) =>
            CatalogService.updateQuoteStatus(code, input),
        onSuccess: (statuses) => {
            queryClient.setQueryData(queryKeys.admin.quoteStatuses(), statuses)
            return queryClient.invalidateQueries({ queryKey: queryKeys.admin.quotes.all() })
        },
    })
}

/** The banks feed the bank selects (payment form, content), so both lists go stale. */
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

/**
 * A saved payment method edit or order returns the whole list: it replaces the session's copy
 * (checkout, the order page, the panel follow), and the orders refetch the names the API sends.
 */
function applyPaymentMethods(
    queryClient: QueryClient,
    methods: PaymentMethodInfo[],
): Promise<void> {
    queryClient.setQueryData(queryKeys.catalogs.paymentMethods(), methods)
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    ]).then(() => undefined)
}

export function useUpdatePaymentMethod() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, input }: { code: string; input: PaymentMethodInput }) =>
            CatalogService.updatePaymentMethod(code, input),
        onSuccess: (methods) => applyPaymentMethods(queryClient, methods),
    })
}

/** Saves the checkout order; the list moves optimistically and rolls back on failure. */
export function useReorderPaymentMethods() {
    const queryClient = useQueryClient()
    const listKey = queryKeys.catalogs.paymentMethods()

    return useMutation({
        mutationFn: (codes: string[]) => CatalogService.reorderPaymentMethods(codes),
        onMutate: async (codes) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const previous = queryClient.getQueryData<PaymentMethodInfo[]>(listKey)
            if (previous) {
                const byCode = new Map(previous.map((method) => [method.code, method]))
                queryClient.setQueryData<PaymentMethodInfo[]>(
                    listKey,
                    codes.flatMap((code, sortOrder) => {
                        const method = byCode.get(code as PaymentMethodInfo['code'])
                        return method ? [{ ...method, sortOrder }] : []
                    }),
                )
            }
            return { previous }
        },
        onError: (_error, _codes, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous)
        },
        onSuccess: (methods) => applyPaymentMethods(queryClient, methods),
        onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
    })
}

/** The options feed the contact form: the admin list and the public copy both go stale. */
function invalidateContactOptionCaches(
    queryClient: QueryClient,
    kind: ContactOptionKind,
): Promise<void> {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.contactOptions(kind) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.contactOptions() }),
    ]).then(() => undefined)
}

/** Every topic or space type of the contact form, inactive ones included. */
export function useAdminContactOptions(kind: ContactOptionKind) {
    return useQuery({
        queryKey: queryKeys.admin.contactOptions(kind),
        queryFn: () => CatalogService.getAdminContactOptions(kind),
    })
}

export function useCreateContactOption(kind: ContactOptionKind) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: ContactOptionCreateInput) =>
            CatalogService.createContactOption(kind, input),
        onSuccess: (option) => {
            queryClient.setQueryData<AdminContactOption[]>(
                queryKeys.admin.contactOptions(kind),
                (current) => (current ? [...current, option] : current),
            )
            return invalidateContactOptionCaches(queryClient, kind)
        },
    })
}

export function useUpdateContactOption(kind: ContactOptionKind) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ code, input }: { code: string; input: ContactOptionInput }) =>
            CatalogService.updateContactOption(kind, code, input),
        onSuccess: (option) => {
            queryClient.setQueryData<AdminContactOption[]>(
                queryKeys.admin.contactOptions(kind),
                (current) => current?.map((item) => (item.code === option.code ? option : item)),
            )
            return invalidateContactOptionCaches(queryClient, kind)
        },
    })
}

export function useDeleteContactOption(kind: ContactOptionKind) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => CatalogService.deleteContactOption(kind, code),
        onSuccess: (_data, code) => {
            queryClient.setQueryData<AdminContactOption[]>(
                queryKeys.admin.contactOptions(kind),
                (current) => current?.filter((item) => item.code !== code),
            )
            return invalidateContactOptionCaches(queryClient, kind)
        },
        // A 409 means the list shown was stale: refresh it.
        onError: () =>
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.contactOptions(kind) }),
    })
}

/** Saves the form order; the admin list moves optimistically and rolls back on failure. */
export function useReorderContactOptions(kind: ContactOptionKind) {
    const queryClient = useQueryClient()
    const listKey = queryKeys.admin.contactOptions(kind)

    return useMutation({
        mutationFn: (codes: string[]) => CatalogService.reorderContactOptions(kind, codes),
        onMutate: async (codes) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const previous = queryClient.getQueryData<AdminContactOption[]>(listKey)
            if (previous) {
                const byCode = new Map(previous.map((option) => [option.code, option]))
                queryClient.setQueryData<AdminContactOption[]>(
                    listKey,
                    codes.flatMap((code, sortOrder) => {
                        const option = byCode.get(code)
                        return option ? [{ ...option, sortOrder }] : []
                    }),
                )
            }
            return { previous }
        },
        onError: (_error, _codes, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous)
        },
        onSuccess: (options) => queryClient.setQueryData<AdminContactOption[]>(listKey, options),
        onSettled: () => invalidateContactOptionCaches(queryClient, kind),
    })
}
