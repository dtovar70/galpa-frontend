import type {
    AdminCategory,
    AdminProduct,
    AdminProductQueryParams,
    CategoryCreateInput,
    CategoryInput,
    DesignTemplateInput,
    TemplateColorCreateInput,
    TemplateColorInput,
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

function templateColorPath(slug: CategorySlug, colorId: string, suffix = ''): string {
    return categoryPath(slug, `/design-template/colors/${encodeURIComponent(colorId)}${suffix}`)
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

    /** "Plantilla para diseñar": the print size in cm, shared by every garment color. */
    updateCategoryTemplate: (slug: CategorySlug, input: DesignTemplateInput) =>
        apiClient.patch<AdminCategory>(categoryPath(slug, '/design-template'), input),
    /** Adds a garment color with its photo (at most `maxColors`). */
    addTemplateColor: (slug: CategorySlug, input: TemplateColorCreateInput) => {
        const form = new FormData()
        form.append('colorName', input.colorName)
        form.append('colorHex', input.colorHex)
        form.append('file', input.file)
        return apiClient.post<AdminCategory>(categoryPath(slug, '/design-template/colors'), form)
    },
    updateTemplateColor: (slug: CategorySlug, colorId: string, input: TemplateColorInput) =>
        apiClient.patch<AdminCategory>(templateColorPath(slug, colorId), input),
    /** Replaces a color's photo; its print area stays. */
    replaceTemplatePhoto: (slug: CategorySlug, colorId: string, file: File) => {
        const form = new FormData()
        form.append('file', file)
        return apiClient.post<AdminCategory>(templateColorPath(slug, colorId, '/photo'), form)
    },
    deleteTemplateColor: (slug: CategorySlug, colorId: string) =>
        apiClient.delete<AdminCategory>(templateColorPath(slug, colorId)),
    /** `colorIds` must list every color of the category once; the first is the default. */
    reorderTemplateColors: (slug: CategorySlug, colorIds: string[]) =>
        apiClient.patch<AdminCategory>(categoryPath(slug, '/design-template/colors/order'), {
            colorIds,
        }),
} as const
