import type { UserRole } from '@/@types/admin'

/** A panel account as the "Usuarios" page sees it (`GET /admin/users`). */
export interface AdminUser {
    id: string
    name: string
    email: string
    role: UserRole
    isActive: boolean
    createdAt: string
    updatedAt: string
    /** ISO 8601; null when the user never logged in. */
    lastLoginAt: string | null
    passwordChangedAt: string | null
    /** Telegram chats this user linked (the bot acts on their behalf). */
    telegramChatCount: number
    /** Of those, the ones that still receive payments. */
    activeTelegramChatCount: number
}

/** `PATCH /admin/users/:id/active`. */
export interface SetUserActiveResult extends AdminUser {
    /** Chats switched off by this deactivation (0 when activating). */
    telegramChatsDeactivated: number
}

export interface AdminUserQueryParams {
    search?: string
    page?: number
    pageSize?: number
}

/** Body of `POST /admin/users`. */
export interface UserCreateInput {
    name: string
    email: string
    role: UserRole
    password: string
}

/** Body of `PATCH /admin/users/:id`: the password has its own endpoint. */
export type UserUpdateInput = Partial<Omit<UserCreateInput, 'password'>>

/** Body of `POST /auth/me/password` ("Mi cuenta"). */
export interface ChangePasswordInput {
    currentPassword: string
    newPassword: string
}

/** Body of `POST /auth/password-reset/confirm`. */
export interface PasswordResetConfirmInput {
    email: string
    code: string
    newPassword: string
}
