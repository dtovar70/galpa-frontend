import type { AdminSession, LoginCredentials } from '@/@types/admin'
import type { ChangePasswordInput, PasswordResetConfirmInput } from '@/@types/user'
import { apiClient } from '@/services/ApiClient'
import { isApiError } from '@/services/errors'

/** Resolves to `null` when there is no valid session (HTTP 401) instead of throwing. */
async function getSession(): Promise<AdminSession | null> {
    try {
        return await apiClient.get<AdminSession>('/auth/me')
    } catch (error) {
        if (isApiError(error, 401)) return null
        throw error
    }
}

export const AuthService = {
    getSession,
    login: (credentials: LoginCredentials) =>
        apiClient.post<AdminSession>('/auth/login', credentials),
    /** Re-issues the session cookie for another full idle period. */
    refresh: () => apiClient.post<AdminSession>('/auth/refresh'),
    logout: () => apiClient.post<void>('/auth/logout'),
    /** "Mi cuenta": any role may rename themselves. */
    updateMe: (input: { name: string }) => apiClient.patch<AdminSession>('/auth/me', input),
    /** Closes every other session; this one gets a new cookie. */
    changePassword: (input: ChangePasswordInput) =>
        apiClient.post<AdminSession>('/auth/me/password', input),
    /**
     * "¿Olvidaste tu contraseña?": always answers the same (202), whether or not the email
     * belongs to an account that can receive the code.
     */
    requestPasswordReset: (email: string) =>
        apiClient.post<{ message: string }>('/auth/password-reset/request', { email }),
    /** Sets the new password with the code; no session is created (the user logs in after). */
    confirmPasswordReset: (input: PasswordResetConfirmInput) =>
        apiClient.post<void>('/auth/password-reset/confirm', input),
} as const
