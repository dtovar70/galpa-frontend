import type { Paginated } from '@/@types/common'
import type {
    AdminUser,
    AdminUserQueryParams,
    SetUserActiveResult,
    UserCreateInput,
    UserUpdateInput,
} from '@/@types/user'
import { apiClient } from '@/services/ApiClient'

const BASE = '/admin/users'

function userPath(id: string, suffix = ''): string {
    return `${BASE}/${encodeURIComponent(id)}${suffix}`
}

/** ADMIN only: panel accounts. There is no delete; deactivating keeps the history. */
export const AdminUsersService = {
    getUsers: (params: AdminUserQueryParams = {}) =>
        apiClient.get<Paginated<AdminUser>>(BASE, {
            query: {
                search: params.search?.trim(),
                page: params.page,
                pageSize: params.pageSize,
            },
        }),
    createUser: (input: UserCreateInput) => apiClient.post<AdminUser>(BASE, input),
    updateUser: (id: string, input: UserUpdateInput) =>
        apiClient.patch<AdminUser>(userPath(id), input),
    /** Closes every session of that user. */
    setPassword: (id: string, password: string) =>
        apiClient.post<void>(userPath(id, '/password'), { password }),
    setActive: (id: string, isActive: boolean) =>
        apiClient.patch<SetUserActiveResult>(userPath(id, '/active'), { isActive }),
} as const
