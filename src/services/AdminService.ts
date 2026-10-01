import type {
    AdminCategory,
    AdminProduct,
    AdminProductQueryParams,
    CategoryCreateInput,
    CategoryInput,
    ProductInput,
} from '@/@types/admin'
import type { Paginated } from '@/@types/common'
import type { CategorySlug } from '@/@types/product'
import { apiClient } from '@/services/ApiClient'

const PRODUCTS = '/admin/products'
const CATEGORIES = '/admin/categories'

function categoryPath(slug: CategorySlug, suffix = ''): string {
    return `${CATEGORIES}/${encodeURIComponent(slug)}${suffix}`
}

function productPath(id: string, suffix = ''): string {
    return `${PRODUCTS}/${encodeURIComponent(id)}${suffix}`
}

/** Back-office endpoints. Every call needs the admin session cookie. */
export const AdminService = {
    getProducts: (params: AdminProductQueryParams = {}) =>
        apiClient.get<Paginated<AdminProduct>>(PRODUCTS, {
            query: {
                search: params.search?.trim(),
                category: params.category,
                isActive: params.isActive,
                page: params.page,
                pageSize: params.pageSize,
            },
        }),
    getProduct: (id: string) => apiClient.get<AdminProduct>(productPath(id)),
    createProduct: (input: ProductInput) => apiClient.post<AdminProduct>(PRODUCTS, input),
    updateProduct: (id: string, input: Partial<ProductInput>) =>
        apiClient.patch<AdminProduct>(productPath(id), input),
    setProductActive: (id: string, isActive: boolean) =>
        apiClient.patch<AdminProduct>(productPath(id, '/active'), { isActive }),
    deleteProduct: (id: string) => apiClient.delete(productPath(id)),

    uploadProductImages: (id: string, files: File[]) => {
        const form = new FormData()
        for (const file of files) form.append('files', file)
        return apiClient.post<AdminProduct>(productPath(id, '/images'), form)
    },
    reorderProductImages: (id: string, imageIds: string[]) =>
        apiClient.patch<AdminProduct>(productPath(id, '/images/order'), { imageIds }),
    deleteProductImage: (id: string, imageId: string) =>
        apiClient.delete<AdminProduct>(productPath(id, `/images/${encodeURIComponent(imageId)}`)),

    getCategories: () => apiClient.get<AdminCategory[]>(CATEGORIES),
    createCategory: (input: CategoryCreateInput) =>
        apiClient.post<AdminCategory>(CATEGORIES, input),
    updateCategory: (slug: CategorySlug, input: CategoryInput) =>
        apiClient.patch<AdminCategory>(categoryPath(slug), input),
    /** `slugs` must list every category exactly once; returns the list in its new order. */
    reorderCategories: (slugs: CategorySlug[]) =>
        apiClient.patch<AdminCategory[]>(`${CATEGORIES}/order`, { slugs }),
    /** Rejected with 409 while the category still has products, hidden ones included. */
    deleteCategory: (slug: CategorySlug) => apiClient.delete(categoryPath(slug)),
} as const
