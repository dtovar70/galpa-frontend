import type {
    Quote,
    QuoteConvertInput,
    QuoteConvertResult,
    QuoteInput,
    QuoteList,
    QuoteQueryParams,
    QuoteStatusInput,
    QuoteWhatsAppMessage,
} from '@/@types/quote'
import { apiClient } from '@/services/ApiClient'

const QUOTES = '/admin/quotes'

function quotePath(code: string, suffix = ''): string {
    return `${QUOTES}/${encodeURIComponent(code)}${suffix}`
}

/** Back-office quotes ("Cotizaciones"). Every call needs the admin session cookie. */
export const AdminQuoteService = {
    getQuotes: (params: QuoteQueryParams = {}) =>
        apiClient.get<QuoteList>(QUOTES, {
            query: { status: params.status, search: params.search?.trim(), page: params.page },
        }),
    getQuote: (code: string) => apiClient.get<Quote>(quotePath(code)),
    createQuote: (input: QuoteInput) => apiClient.post<Quote>(QUOTES, input),
    /** Only while the quote is a draft or sent. */
    updateQuote: (code: string, input: QuoteInput) => apiClient.put<Quote>(quotePath(code), input),
    changeStatus: (code: string, input: QuoteStatusInput) =>
        apiClient.post<Quote>(quotePath(code, '/status'), input),
    /** The branded PDF. */
    getPdf: (code: string) => apiClient.getBlob(quotePath(code, '/pdf')),
    /** Emails the PDF to the customer and marks the quote as sent. */
    send: (code: string) => apiClient.post<Quote>(quotePath(code, '/send')),
    /** The message (with the public PDF link) and the `wa.me` link to the customer. */
    prepareWhatsAppMessage: (code: string) =>
        apiClient.post<QuoteWhatsAppMessage>(quotePath(code, '/whatsapp-message')),
    /** Creates a pending-payment order from the quote's lines. */
    convert: (code: string, input: QuoteConvertInput) =>
        apiClient.post<QuoteConvertResult>(quotePath(code, '/convert'), input),
    /** Only drafts can be deleted. */
    deleteQuote: (code: string) => apiClient.delete(quotePath(code)),
} as const
