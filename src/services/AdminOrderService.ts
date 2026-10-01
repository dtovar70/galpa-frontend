import type {
    AdminOrder,
    AdminOrderList,
    AdminOrderQueryParams,
    AdminOrdersSummary,
    IssuedAccessLink,
    SubmitPaymentInput,
    TransitionInput,
    WhatsAppMessage,
} from '@/@types/order'
import { apiConfig } from '@/configs/api.config'
import { apiClient } from '@/services/ApiClient'
import { paymentFormData } from '@/services/OrderService'

const ORDERS = '/admin/orders'

function orderPath(code: string, suffix = ''): string {
    return `${ORDERS}/${encodeURIComponent(code)}${suffix}`
}

/** Back-office orders. Every call needs the admin session cookie. */
export const AdminOrderService = {
    getOrders: (params: AdminOrderQueryParams = {}) =>
        apiClient.get<AdminOrderList>(ORDERS, {
            query: {
                status: params.status,
                refundStatus: params.refundStatus,
                search: params.search?.trim(),
                from: params.from,
                to: params.to,
                page: params.page,
                pageSize: params.pageSize,
            },
        }),
    getSummary: () => apiClient.get<AdminOrdersSummary>(`${ORDERS}/summary`),
    getOrder: (code: string) => apiClient.get<AdminOrder>(orderPath(code)),
    /**
     * One allowed status change. `note` is the reason (rejections, cancellations) or tracking;
     * the other options answer what some moves ask (stock conflict, refund, forced reactivation).
     */
    transition: (code: string, { note, refundReference, ...input }: TransitionInput) =>
        apiClient.post<AdminOrder>(orderPath(code, '/transitions'), {
            ...input,
            note: note || undefined,
            refundReference: refundReference || undefined,
        }),
    /** "Registrar pago manualmente": a proof the customer sent by WhatsApp. */
    recordPayment: (code: string, input: SubmitPaymentInput) =>
        apiClient.post<AdminOrder>(orderPath(code, '/payments'), paymentFormData(input)),
    /** "Marcar reembolso realizado". */
    markRefunded: (code: string, reference?: string) =>
        apiClient.post<AdminOrder>(orderPath(code, '/refund'), {
            reference: reference || undefined,
        }),
    addNote: (code: string, body: string) =>
        apiClient.post<AdminOrder>(orderPath(code, '/notes'), { body }),
    /** A new private link for the customer (the old ones keep working). */
    issueAccessLink: (code: string) =>
        apiClient.post<IssuedAccessLink>(orderPath(code, '/access-links')),
    /** "Avisar por WhatsApp": the current status's message, with a fresh link when it uses one. */
    prepareWhatsAppMessage: (code: string) =>
        apiClient.post<WhatsAppMessage>(orderPath(code, '/whatsapp-message')),
    /** The owner opened WhatsApp: leaves an internal note on the order. */
    recordWhatsAppOpened: (code: string) =>
        apiClient.post<AdminOrder>(orderPath(code, '/whatsapp-message/opened')),
    /** The purchase receipt PDF (409 until the payment is verified). */
    getReceipt: (code: string) => apiClient.getBlob(orderPath(code, '/receipt.pdf')),
    /**
     * Absolute URL of a payment screenshot. It is loaded straight into an `<img>`: the session
     * cookie authenticates it and the API streams the file or redirects to a signed URL.
     */
    proofUrl: (proofPath: string) => `${apiConfig.baseUrl}${proofPath}`,
} as const
