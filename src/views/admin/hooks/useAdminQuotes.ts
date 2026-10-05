import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
    Quote,
    QuoteConvertInput,
    QuoteInput,
    QuoteQueryParams,
    QuoteStatusInput,
} from '@/@types/quote'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminQuoteService } from '@/services/AdminQuoteService'

/** `enabled: false` holds the request (e.g. until the status filter can be validated). */
export function useAdminQuotes(params: QuoteQueryParams, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: queryKeys.admin.quotes.list(params),
        queryFn: () => AdminQuoteService.getQuotes(params),
        enabled: options.enabled ?? true,
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: true,
    })
}

export function useAdminQuote(code: string | undefined) {
    return useQuery({
        queryKey: queryKeys.admin.quotes.detail(code ?? ''),
        queryFn: () => AdminQuoteService.getQuote(code ?? ''),
        enabled: Boolean(code),
        staleTime: 0,
    })
}

/** Puts a returned quote in its detail cache and marks the lists stale. */
function useSyncQuote() {
    const queryClient = useQueryClient()
    return (quote: Quote) => {
        queryClient.setQueryData(queryKeys.admin.quotes.detail(quote.code), quote)
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.quotes.lists() })
    }
}

export function useSaveQuote(code: string | undefined) {
    const sync = useSyncQuote()
    return useMutation({
        mutationFn: (input: QuoteInput) =>
            code
                ? AdminQuoteService.updateQuote(code, input)
                : AdminQuoteService.createQuote(input),
        onSuccess: sync,
    })
}

export function useChangeQuoteStatus(code: string) {
    const sync = useSyncQuote()
    return useMutation({
        mutationFn: (input: QuoteStatusInput) => AdminQuoteService.changeStatus(code, input),
        onSuccess: sync,
    })
}

export function useSendQuote(code: string) {
    const sync = useSyncQuote()
    return useMutation({
        mutationFn: () => AdminQuoteService.send(code),
        onSuccess: sync,
    })
}

export function useQuoteWhatsApp(code: string) {
    return useMutation({ mutationFn: () => AdminQuoteService.prepareWhatsAppMessage(code) })
}

export function useConvertQuote(code: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: QuoteConvertInput) => AdminQuoteService.convert(code, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.admin.quotes.all() })
            void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all() })
        },
    })
}

export function useDeleteQuote() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => AdminQuoteService.deleteQuote(code),
        onSuccess: (_data, code) => {
            queryClient.removeQueries({ queryKey: queryKeys.admin.quotes.detail(code) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.admin.quotes.lists() })
        },
    })
}
