import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaymentMethod, SubmitPaymentInput } from '@/@types/order'
import { ORDER_POLL_MS } from '@/constants/order.constant'
import { queryKeys } from '@/constants/query-keys.constant'
import { OrderService } from '@/services/OrderService'

/**
 * The customer's order. While a payment proof is being verified it refreshes itself (and on
 * every return to the tab), so the page follows the admin's decision without a reload.
 */
export function useOrder(code: string, token: string) {
    return useQuery({
        queryKey: queryKeys.orders.detail(code),
        queryFn: ({ signal }) => OrderService.get(code, token, signal),
        enabled: code.length > 0 && token.length > 0,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: (query) =>
            query.state.data?.status === 'PENDIENTE_VERIFICACION' ? ORDER_POLL_MS : false,
    })
}

export function useSubmitPayment(code: string, token: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: SubmitPaymentInput) => OrderService.submitPayment(code, token, input),
        onSuccess: (order) => {
            queryClient.setQueryData(queryKeys.orders.detail(code), order)
        },
    })
}

export function useChangePaymentMethod(code: string, token: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (method: PaymentMethod) =>
            OrderService.changePaymentMethod(code, token, method),
        onSuccess: (order) => {
            queryClient.setQueryData(queryKeys.orders.detail(code), order)
        },
    })
}
