import type {
    AdminBank,
    AdminContactOption,
    AdminMobilePrefix,
    AdminOrderStatusCatalog,
    Bank,
    BankCreateInput,
    BankInput,
    ContactOptionCreateInput,
    ContactOptionInput,
    ContactOptionKind,
    ContactOptions,
    MobilePrefix,
    MobilePrefixCreateInput,
    OrderStatusCatalog,
    OrderStatusGroupInput,
    OrderStatusInput,
    PaymentMethodInfo,
    PaymentMethodInput,
    QuoteStatusInfo,
    QuoteStatusInput,
} from '@/@types/catalog'
import { apiClient } from '@/services/ApiClient'

const ADMIN = '/admin/catalogs'

function codePath(base: string, code: string): string {
    return `${base}/${encodeURIComponent(code)}`
}

/**
 * Business catalogs kept in the database: order statuses (labels, tabs), quote statuses, payment
 * methods, banks, mobile operator codes and the contact form options.
 */
export const CatalogService = {
    getOrderStatuses: (signal?: AbortSignal) =>
        apiClient.get<OrderStatusCatalog>('/catalogs/order-statuses', { signal }),
    /** Active banks only, in select order. */
    getBanks: (signal?: AbortSignal) => apiClient.get<Bank[]>('/catalogs/banks', { signal }),
    /** Active mobile operator codes only, in select order. */
    getMobilePrefixes: (signal?: AbortSignal) =>
        apiClient.get<MobilePrefix[]>('/catalogs/mobile-prefixes', { signal }),
    /** Every payment method (name, help text, icon, currency), in checkout order. */
    getPaymentMethods: (signal?: AbortSignal) =>
        apiClient.get<PaymentMethodInfo[]>('/catalogs/payment-methods', { signal }),
    /** Active topics and space types of the contact form, in form order. */
    getContactOptions: (signal?: AbortSignal) =>
        apiClient.get<ContactOptions>('/catalogs/contact-options', { signal }),

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

    /** ADMIN and EDITOR: every quote status, in order. */
    getQuoteStatuses: (signal?: AbortSignal) =>
        apiClient.get<QuoteStatusInfo[]>(`${ADMIN}/quote-statuses`, { signal }),
    /** ADMIN only. Returns the whole list as saved. */
    updateQuoteStatus: (code: string, input: QuoteStatusInput) =>
        apiClient.patch<QuoteStatusInfo[]>(codePath(`${ADMIN}/quote-statuses`, code), input),

    /** ADMIN only. Each edit returns the whole list as saved. */
    updatePaymentMethod: (code: string, input: PaymentMethodInput) =>
        apiClient.patch<PaymentMethodInfo[]>(codePath(`${ADMIN}/payment-methods`, code), input),
    /** `codes` must list every method exactly once; returns the list in its new order. */
    reorderPaymentMethods: (codes: string[]) =>
        apiClient.patch<PaymentMethodInfo[]>(`${ADMIN}/payment-methods/order`, { codes }),

    /** ADMIN only: every topic or space type, inactive ones included. */
    getAdminContactOptions: (kind: ContactOptionKind) =>
        apiClient.get<AdminContactOption[]>(`${ADMIN}/${kind}`),
    createContactOption: (kind: ContactOptionKind, input: ContactOptionCreateInput) =>
        apiClient.post<AdminContactOption>(`${ADMIN}/${kind}`, input),
    /** Rejected with 409 when it would leave the form without an active topic. */
    updateContactOption: (kind: ContactOptionKind, code: string, input: ContactOptionInput) =>
        apiClient.patch<AdminContactOption>(codePath(`${ADMIN}/${kind}`, code), input),
    reorderContactOptions: (kind: ContactOptionKind, codes: string[]) =>
        apiClient.patch<AdminContactOption[]>(`${ADMIN}/${kind}/order`, { codes }),
    /** Rejected with 409 when it is the only active topic. */
    deleteContactOption: (kind: ContactOptionKind, code: string) =>
        apiClient.delete(codePath(`${ADMIN}/${kind}`, code)),

    /** Every bank, inactive ones included, with what references it. */
    getAdminBanks: () => apiClient.get<AdminBank[]>(`${ADMIN}/banks`),
    createBank: (input: BankCreateInput) => apiClient.post<AdminBank>(`${ADMIN}/banks`, input),
    updateBank: (code: string, input: BankInput) =>
        apiClient.patch<AdminBank>(codePath(`${ADMIN}/banks`, code), input),
    /** `codes` must list every bank exactly once; returns the list in its new order. */
    reorderBanks: (codes: string[]) =>
        apiClient.patch<AdminBank[]>(`${ADMIN}/banks/order`, { codes }),
    /** Rejected with 409 while a payment or the store's payment details use the bank. */
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
