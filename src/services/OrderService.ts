import type {
    CreatedOrder,
    CreateOrderInput,
    PublicOrder,
    SubmitPaymentInput,
} from '@/@types/order'
import { apiClient } from '@/services/ApiClient'

function orderPath(code: string, suffix = ''): string {
    return `/orders/${encodeURIComponent(code)}${suffix}`
}

/** Multipart body of a payment proof (customer page and the admin's manual registration). */
export function paymentFormData(input: SubmitPaymentInput): FormData {
    const form = new FormData()
    form.append('reference', input.reference)
    form.append('payerBankCode', input.payerBankCode)
    form.append('payerPhone', input.payerPhone)
    if (input.payerIdNumber) form.append('payerIdNumber', input.payerIdNumber)
    form.append('paidOn', input.paidOn)
    form.append('amountBs', input.amountBs)
    if (input.proof) form.append('proof', input.proof)
    return form
}

/** Guest checkout and the customer's private order page (`?t=` token, no account). */
export const OrderService = {
    create: (input: CreateOrderInput) => apiClient.post<CreatedOrder>('/orders', input),

    get: (code: string, token: string, signal?: AbortSignal) =>
        apiClient.get<PublicOrder>(orderPath(code), { query: { t: token }, signal }),

    /** The purchase receipt PDF (409 until the payment is verified). */
    getReceipt: (code: string, token: string) =>
        apiClient.getBlob(orderPath(code, '/receipt.pdf'), { query: { t: token } }),

    /**
     * "Consultar mi pedido": always the same answer; when the code and the email match an
     * order, the API emails a fresh private link to it.
     */
    lookup: (input: { code: string; email: string }) =>
        apiClient.post<{ message: string }>('/orders/lookup', input),

    submitPayment: (code: string, token: string, input: SubmitPaymentInput) =>
        apiClient.post<PublicOrder>(orderPath(code, '/payment'), paymentFormData(input), {
            query: { t: token },
        }),
} as const
