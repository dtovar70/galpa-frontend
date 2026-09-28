import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AdminSession, LoginCredentials } from '@/@types/admin'
import type { ChangePasswordInput } from '@/@types/user'
import { queryKeys } from '@/constants/query-keys.constant'
import { AuthService } from '@/services/AuthService'

/** Current admin user, `null` when logged out, `undefined` while the first check runs. */
export function useSession() {
    return useQuery<AdminSession | null>({
        queryKey: queryKeys.session,
        queryFn: AuthService.getSession,
        staleTime: 5 * 60_000,
        retry: false,
    })
}

export function useLogin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
        onSuccess: (user) => {
            queryClient.setQueryData(queryKeys.session, user)
        },
    })
}

/** Forgets the session and every admin cache locally (no request). */
export function useClearSession() {
    const queryClient = useQueryClient()

    return useCallback(() => {
        queryClient.removeQueries({ queryKey: queryKeys.admin.all })
        queryClient.setQueryData(queryKeys.session, null)
    }, [queryClient])
}

export function useLogout() {
    const clearSession = useClearSession()

    return useMutation({
        mutationFn: () => AuthService.logout(),
        // Even if the request fails, the user asked to leave: forget the session locally.
        onSettled: clearSession,
    })
}

/** "Mi cuenta": rename yourself; the sidebar picks the new name up at once. */
export function useUpdateMe() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: { name: string }) => AuthService.updateMe(input),
        onSuccess: (session) => {
            queryClient.setQueryData(queryKeys.session, session)
            return queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all() })
        },
    })
}

/**
 * "Mi cuenta": change your password. The API closes every other session and sends this one a
 * new cookie, so the stored session is replaced with the fresh timing.
 */
export function useChangePassword() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: ChangePasswordInput) => AuthService.changePassword(input),
        onSuccess: (session) => queryClient.setQueryData(queryKeys.session, session),
    })
}
