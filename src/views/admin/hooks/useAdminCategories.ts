import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type { AdminCategory, CategoryCreateInput, CategoryInput } from '@/@types/admin'
import type { CategorySlug } from '@/@types/product'
import { queryKeys } from '@/constants/query-keys.constant'
import { AdminService } from '@/services/AdminService'

/**
 * Categories feed the storefront menus, filters and home strip, and products embed their
 * category, so a category change marks the public lists stale along with the admin ones.
 */
function invalidateCategoryCaches(queryClient: QueryClient): Promise<void> {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]).then(() => undefined)
}

export function useAdminCategories() {
    return useQuery({
        queryKey: queryKeys.admin.categories(),
        queryFn: AdminService.getCategories,
    })
}

export function useCreateCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CategoryCreateInput) => AdminService.createCategory(input),
        onSuccess: (category) => {
            queryClient.setQueryData<AdminCategory[]>(queryKeys.admin.categories(), (current) =>
                current
                    ? [...current, category].sort(
                          (a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug),
                      )
                    : current,
            )
            return invalidateCategoryCaches(queryClient)
        },
    })
}

export function useUpdateCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ slug, input }: { slug: CategorySlug; input: CategoryInput }) =>
            AdminService.updateCategory(slug, input),
        onSuccess: (category) => {
            queryClient.setQueryData<AdminCategory[]>(queryKeys.admin.categories(), (current) =>
                current?.map((item) => (item.slug === category.slug ? category : item)),
            )
            return invalidateCategoryCaches(queryClient)
        },
    })
}

export function useDeleteCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (slug: CategorySlug) => AdminService.deleteCategory(slug),
        onSuccess: (_data, slug) => {
            queryClient.setQueryData<AdminCategory[]>(queryKeys.admin.categories(), (current) =>
                current?.filter((item) => item.slug !== slug),
            )
            return invalidateCategoryCaches(queryClient)
        },
        // A 409 means the counts shown were stale (someone added a product): refresh them.
        onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories() }),
    })
}

/**
 * Saves the menu order. The admin list is reordered optimistically and rolled back if the API
 * refuses; the public list (which also feeds the header and footer menus) is refreshed after.
 */
export function useReorderCategories() {
    const queryClient = useQueryClient()
    const listKey = queryKeys.admin.categories()

    return useMutation({
        mutationFn: (slugs: CategorySlug[]) => AdminService.reorderCategories(slugs),
        onMutate: async (slugs) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const previous = queryClient.getQueryData<AdminCategory[]>(listKey)
            if (previous) {
                const bySlug = new Map(previous.map((category) => [category.slug, category]))
                const next = slugs.flatMap((slug, sortOrder) => {
                    const category = bySlug.get(slug)
                    return category ? [{ ...category, sortOrder }] : []
                })
                queryClient.setQueryData<AdminCategory[]>(listKey, next)
            }
            return { previous }
        },
        onError: (_error, _slugs, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous)
        },
        onSuccess: (categories) => {
            queryClient.setQueryData<AdminCategory[]>(listKey, categories)
        },
        onSettled: () => invalidateCategoryCaches(queryClient),
    })
}
