import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { TelegramChat, TelegramOverview } from '@/@types/telegram'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminTelegramService } from '@/services/AdminTelegramService'

/** While a link code is on screen the page polls this often, so a new chat shows up. */
export const TELEGRAM_LINK_POLL_MS = 4000

function replaceChat(
    overview: TelegramOverview | undefined,
    id: string,
    update: (chat: TelegramChat) => TelegramChat,
): TelegramOverview | undefined {
    if (!overview) return overview
    return {
        ...overview,
        chats: overview.chats.map((chat) => (chat.id === id ? update(chat) : chat)),
    }
}

/**
 * Bot status and linked chats. With `pollWhile` (a link code is open) the list refetches every
 * few seconds for as long as it returns `true` for the latest data.
 */
export function useAdminTelegram({
    enabled = true,
    pollWhile,
}: {
    enabled?: boolean
    pollWhile?: (overview: TelegramOverview | undefined) => boolean
} = {}) {
    return useQuery({
        queryKey: queryKeys.admin.telegram(),
        enabled,
        queryFn: AdminTelegramService.getOverview,
        staleTime: 0,
        refetchInterval: (query) => (pollWhile?.(query.state.data) ? TELEGRAM_LINK_POLL_MS : false),
    })
}

export function useCreateTelegramLinkCode() {
    return useMutation({ mutationFn: AdminTelegramService.createLinkCode })
}

/** "Nuevos pedidos": the switch moves right away and rolls back if the save fails. */
export function useUpdateTelegramChat() {
    const queryClient = useQueryClient()
    const key = queryKeys.admin.telegram()

    return useMutation({
        mutationFn: ({ id, notifyNewOrders }: { id: string; notifyNewOrders: boolean }) =>
            AdminTelegramService.updateChat(id, { notifyNewOrders }),
        onMutate: async ({ id, notifyNewOrders }) => {
            await queryClient.cancelQueries({ queryKey: key })
            const previous = queryClient.getQueryData<TelegramOverview>(key)
            queryClient.setQueryData<TelegramOverview>(key, (current) =>
                replaceChat(current, id, (chat) => ({ ...chat, notifyNewOrders })),
            )
            return { previous }
        },
        onError: (_error, _input, context) => {
            if (context?.previous) queryClient.setQueryData(key, context.previous)
        },
        onSuccess: (saved) =>
            queryClient.setQueryData<TelegramOverview>(key, (current) =>
                replaceChat(current, saved.id, () => saved),
            ),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
    })
}

export function useSendTelegramTest() {
    return useMutation({ mutationFn: (id: string) => AdminTelegramService.sendTest(id) })
}

export function useUnlinkTelegramChat() {
    const queryClient = useQueryClient()
    const key = queryKeys.admin.telegram()

    return useMutation({
        mutationFn: (id: string) => AdminTelegramService.unlinkChat(id),
        onSuccess: (_data, id) => {
            queryClient.setQueryData<TelegramOverview>(key, (current) =>
                current
                    ? { ...current, chats: current.chats.filter((chat) => chat.id !== id) }
                    : current,
            )
            return queryClient.invalidateQueries({ queryKey: key })
        },
        // A 404 means the list was stale: refresh it.
        onError: () => queryClient.invalidateQueries({ queryKey: key }),
    })
}
