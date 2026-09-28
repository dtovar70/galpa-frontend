/** Mirrors the backend's `GET /admin/telegram` payload (Phase 4: Telegram bot). */
export type TelegramBotMode = 'polling' | 'webhook'

export interface TelegramBotStatus {
    enabled: boolean
    mode: TelegramBotMode
    connected: boolean
    username: string | null
    name: string | null
    /** Spanish sentence explaining why the bot is not connected, or `null`. */
    error: string | null
}

/** A Telegram chat linked to the shop: it receives the payments to verify. */
export interface TelegramChat {
    id: string
    chatId: string
    username: string | null
    firstName: string | null
    /** `false` once Telegram reports the chat blocked the bot. */
    isActive: boolean
    /** Also notify every new order, not only the payments to verify. */
    notifyNewOrders: boolean
    linkedAt: string
    lastSeenAt: string | null
    /** `isActive: false`: that panel account was deactivated, so the chat gets nothing. */
    linkedBy: { id: string; name: string; isActive: boolean } | null
}

export interface TelegramOverview {
    bot: TelegramBotStatus
    chats: TelegramChat[]
}

/** `POST /admin/telegram/link-codes`: a one-time code the owner sends to the bot. */
export interface TelegramLinkCode {
    /** 6 digits. */
    code: string
    expiresAt: string
    expiresInSeconds: number
    botUsername: string
    /** `https://t.me/<bot>?start=<code>` */
    deepLink: string
}

export interface TelegramChatInput {
    notifyNewOrders: boolean
}
