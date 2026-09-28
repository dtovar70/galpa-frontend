import type {
    TelegramChat,
    TelegramChatInput,
    TelegramLinkCode,
    TelegramOverview,
} from '@/@types/telegram'
import { apiClient } from '@/services/ApiClient'

const BASE = '/admin/telegram'

function chatPath(id: string, suffix = ''): string {
    return `${BASE}/chats/${encodeURIComponent(id)}${suffix}`
}

/** ADMIN only: the Telegram bot status and the chats linked to it. */
export const AdminTelegramService = {
    getOverview: () => apiClient.get<TelegramOverview>(BASE),
    /** Rejected with 503 while the bot is not connected. */
    createLinkCode: () => apiClient.post<TelegramLinkCode>(`${BASE}/link-codes`),
    updateChat: (id: string, input: TelegramChatInput) =>
        apiClient.patch<TelegramChat>(chatPath(id), input),
    /** 502/503 with a Spanish `message` when Telegram rejects or cannot be reached. */
    sendTest: (id: string) => apiClient.post<{ ok: true }>(chatPath(id, '/test')),
    unlinkChat: (id: string) => apiClient.delete(chatPath(id)),
} as const
