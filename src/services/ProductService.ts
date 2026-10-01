import type { CartAvailability } from '@/@types/cart'
import type { Paginated, ProductQueryParams } from '@/@types/common'
import type { Category, Product } from '@/@types/product'
import { apiClient } from '@/services/ApiClient'
import { isApiError, NotFoundError } from '@/services/errors'

function encodeSlug(slug: string): string {
    return encodeURIComponent(slug)
}

/** Maps an HTTP 404 to `NotFoundError`, which the product view renders as its 404 page. */
async function withNotFound<T>(promise: Promise<T>, slug: string): Promise<T> {
    try {
        return await promise
    } catch (error) {
        if (isApiError(error, 404)) throw new NotFoundError('el producto', slug)
        throw error
    }
}

async function getProducts(params: ProductQueryParams = {}): Promise<Paginated<Product>> {
    return apiClient.get<Paginated<Product>>('/products', {
        query: {
            category: params.category,
            search: params.search?.trim(),
            sort: params.sort,
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
            tags: params.tags,
            page: params.page,
            pageSize: params.pageSize,
        },
    })
}

function getProductBySlug(slug: string): Promise<Product> {
    return withNotFound(apiClient.get<Product>(`/products/${encodeSlug(slug)}`), slug)
}

function getFeaturedProducts(limit = 8): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/featured', { query: { limit } })
}

function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
    return withNotFound(
        apiClient.get<Product[]>(`/products/${encodeSlug(slug)}/related`, { query: { limit } }),
        slug,
    )
}

/** Live stock of cart lines, in the order given (at most 50 lines per call). */
async function getCartAvailability(
    items: readonly { productId: string; variantId?: string }[],
    signal?: AbortSignal,
): Promise<CartAvailability[]> {
    const response = await apiClient.post<{ items: CartAvailability[] }>(
        '/products/availability',
        { items },
        { signal },
    )
    return response.items
}

function getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories')
}

/**
 * Single seam between the views and the products and categories of the API.
 */
export const ProductService = {
    getProducts,
    getProductBySlug,
    getFeaturedProducts,
    getRelatedProducts,
    getCartAvailability,
    getCategories,
} as const

export { NotFoundError } from '@/services/errors'
