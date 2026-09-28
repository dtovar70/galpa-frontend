import type { TelegramChat } from '@/@types/telegram'

/** "Daniela", "@dani" or, for a chat with neither, "Chat 123456789". */
export function chatDisplayName(chat: Pick<TelegramChat, 'firstName' | 'username' | 'chatId'>) {
    if (chat.firstName) return chat.firstName
    if (chat.username) return `@${chat.username}`
    return `Chat ${chat.chatId}`
}

/** 581_000 -> "9:41" (rounded up, so the last second reads "0:01", not "0:00"). */
export function formatClock(ms: number): string {
    const seconds = Math.ceil(ms / 1000)
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function telegramUserUrl(username: string): string {
    return `https://t.me/${encodeURIComponent(username)}`
}
