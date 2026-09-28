import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AdminUserQueryParams, UserCreateInput, UserUpdateInput } from '@/@types/user'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminUsersService } from '@/services/AdminUsersService'

export function useAdminUsers(params: AdminUserQueryParams, { enabled = true } = {}) {
    return useQuery({
        queryKey: queryKeys.admin.users.list(params),
        enabled,
        queryFn: () => AdminUsersService.getUsers(params),
        placeholderData: keepPreviousData,
        staleTime: 0,
    })
}

/** Every write refreshes the list; Telegram counts and chats may have changed too. */
function useInvalidateUsers() {
    const queryClient = useQueryClient()
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all() }),
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.telegram() }),
        ])
}

export function useCreateUser() {
    const invalidate = useInvalidateUsers()
    return useMutation({
        mutationFn: (input: UserCreateInput) => AdminUsersService.createUser(input),
        onSuccess: () => invalidate(),
    })
}

export function useUpdateUser() {
    const invalidate = useInvalidateUsers()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) =>
            AdminUsersService.updateUser(id, input),
        onSuccess: () => invalidate(),
    })
}

export function useSetUserPassword() {
    const invalidate = useInvalidateUsers()
    return useMutation({
        mutationFn: ({ id, password }: { id: string; password: string }) =>
            AdminUsersService.setPassword(id, password),
        onSuccess: () => invalidate(),
    })
}

export function useSetUserActive() {
    const invalidate = useInvalidateUsers()
    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            AdminUsersService.setActive(id, isActive),
        onSuccess: () => invalidate(),
    })
}
