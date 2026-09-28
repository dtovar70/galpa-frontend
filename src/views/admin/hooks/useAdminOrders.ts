import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
    AdminOrder,
    AdminOrderQueryParams,
    SubmitPaymentInput,
    TransitionInput,
} from '@/@types/order'
import { ADMIN_ORDERS_POLL_MS } from '@/constants/order.constant'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminOrderService } from '@/services/AdminOrderService'

export function useAdminOrders(params: AdminOrderQueryParams, { enabled = true } = {}) {
    return useQuery({
        queryKey: queryKeys.admin.orders.list(params),
        queryFn: () => AdminOrderService.getOrders(params),
        enabled,
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchInterval: ADMIN_ORDERS_POLL_MS,
        refetchOnWindowFocus: true,
    })
}

/** Nav badge and page warnings; polled so new payments show up without a reload. */
export function useAdminOrdersSummary() {
    return useQuery({
        queryKey: queryKeys.admin.orders.summary(),
        queryFn: AdminOrderService.getSummary,
        staleTime: 0,
        refetchInterval: ADMIN_ORDERS_POLL_MS,
        refetchOnWindowFocus: true,
    })
}

export function useAdminOrder(code: string) {
    return useQuery({
        queryKey: queryKeys.admin.orders.detail(code),
        queryFn: () => AdminOrderService.getOrder(code),
        enabled: code.length > 0,
        staleTime: 0,
        refetchOnWindowFocus: true,
    })
}

function useSyncOrder() {
    const queryClient = useQueryClient()
    return (order: AdminOrder) => {
        queryClient.setQueryData(queryKeys.admin.orders.detail(order.code), order)
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.lists() })
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.summary() })
        // Stock may have been restored or taken again.
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all() })
        void queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    }
}

export function useTransitionOrder(code: string) {
    const sync = useSyncOrder()
    return useMutation({
        mutationFn: (input: TransitionInput) => AdminOrderService.transition(code, input),
        onSuccess: sync,
    })
}

/** "Registrar pago manualmente" (proof received by WhatsApp). */
export function useRecordPayment(code: string) {
    const sync = useSyncOrder()
    return useMutation({
        mutationFn: (input: SubmitPaymentInput) => AdminOrderService.recordPayment(code, input),
        onSuccess: sync,
    })
}

/** "Marcar reembolso realizado". */
export function useMarkRefunded(code: string) {
    const sync = useSyncOrder()
    return useMutation({
        mutationFn: (reference?: string) => AdminOrderService.markRefunded(code, reference),
        onSuccess: sync,
    })
}

export function useAddOrderNote(code: string) {
    const sync = useSyncOrder()
    return useMutation({
        mutationFn: (body: string) => AdminOrderService.addNote(code, body),
        onSuccess: sync,
    })
}

/** "Avisar por WhatsApp": renders the message (a POST: it may issue a fresh customer link). */
export function usePrepareWhatsAppMessage(code: string) {
    return useMutation({ mutationFn: () => AdminOrderService.prepareWhatsAppMessage(code) })
}

/** A fresh private customer link (e.g. for the order QR); the older links keep working. */
export function useIssueAccessLink(code: string) {
    return useMutation({ mutationFn: () => AdminOrderService.issueAccessLink(code) })
}

/** Leaves the "Aviso por WhatsApp preparado" note once WhatsApp is opened. */
export function useRecordWhatsAppOpened(code: string) {
    const sync = useSyncOrder()
    return useMutation({
        mutationFn: () => AdminOrderService.recordWhatsAppOpened(code),
        onSuccess: sync,
    })
}
