import type {
    AdminBank,
    AdminMobilePrefix,
    AdminOrderStatusCatalog,
    Bank,
    BankCreateInput,
    BankInput,
    MobilePrefix,
    MobilePrefixCreateInput,
    OrderStatusCatalog,
    OrderStatusGroupInput,
    OrderStatusInput,
} from '@/@types/catalog'
import { apiClient } from '@/services/ApiClient'

const ADMIN = '/admin/catalogs'

function codePath(base: string, code: string): string {
    return `${base}/${encodeURIComponent(code)}`
}

/**
 * Business catalogs kept in the database: order statuses (labels, tabs), banks and mobile
 * operator codes.
 */
export const CatalogService = {
    getOrderStatuses: (signal?: AbortSignal) =>
        apiClient.get<OrderStatusCatalog>('/catalogs/order-statuses', { signal }),
    /** Active banks only, in select order. */
    getBanks: (signal?: AbortSignal) => apiClient.get<Bank[]>('/catalogs/banks', { signal }),
    /** Active mobile operator codes only, in select order. */
    getMobilePrefixes: (signal?: AbortSignal) =>
        apiClient.get<MobilePrefix[]>('/catalogs/mobile-prefixes', { signal }),

    /** ADMIN only: the catalog with the WhatsApp templates. */
    getAdminOrderStatuses: () => apiClient.get<AdminOrderStatusCatalog>(`${ADMIN}/order-statuses`),
    /** ADMIN only. Each edit returns the whole (admin) catalog as saved. */
    updateOrderStatus: (code: string, input: OrderStatusInput) =>
        apiClient.patch<AdminOrderStatusCatalog>(codePath(`${ADMIN}/order-statuses`, code), input),
    updateOrderStatusGroup: (code: string, input: OrderStatusGroupInput) =>
        apiClient.patch<AdminOrderStatusCatalog>(
            codePath(`${ADMIN}/order-statuses/groups`, code),
            input,
        ),

    /** Every bank, inactive ones included, with what references it. */
    getAdminBanks: () => apiClient.get<AdminBank[]>(`${ADMIN}/banks`),
    createBank: (input: BankCreateInput) => apiClient.post<AdminBank>(`${ADMIN}/banks`, input),
    updateBank: (code: string, input: BankInput) =>
        apiClient.patch<AdminBank>(codePath(`${ADMIN}/banks`, code), input),
    /** `codes` must list every bank exactly once; returns the list in its new order. */
    reorderBanks: (codes: string[]) =>
        apiClient.patch<AdminBank[]>(`${ADMIN}/banks/order`, { codes }),
    /** Rejected with 409 while a payment or the Pago Móvil details use the bank. */
    deleteBank: (code: string) => apiClient.delete(codePath(`${ADMIN}/banks`, code)),

    /** Every mobile code, inactive ones included, with what uses it. */
    getAdminMobilePrefixes: () => apiClient.get<AdminMobilePrefix[]>(`${ADMIN}/mobile-prefixes`),
    createMobilePrefix: (input: MobilePrefixCreateInput) =>
        apiClient.post<AdminMobilePrefix>(`${ADMIN}/mobile-prefixes`, input),
    setMobilePrefixActive: (code: string, isActive: boolean) =>
        apiClient.patch<AdminMobilePrefix>(codePath(`${ADMIN}/mobile-prefixes`, code), {
            isActive,
        }),
    /** `codes` must list every code exactly once; returns the list in its new order. */
    reorderMobilePrefixes: (codes: string[]) =>
        apiClient.patch<AdminMobilePrefix[]>(`${ADMIN}/mobile-prefixes/order`, { codes }),
    /** Rejected with 409 while an order in progress or the store content uses the code. */
    deleteMobilePrefix: (code: string) =>
        apiClient.delete(codePath(`${ADMIN}/mobile-prefixes`, code)),
} as const
