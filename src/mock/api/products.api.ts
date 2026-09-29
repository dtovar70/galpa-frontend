import type { Paginated, ProductQueryParams, SortOption } from '@/@types/common'
import type { Category, Product } from '@/@types/product'
import { categories } from '@/mock/data/categories.data'
import { products } from '@/mock/data/products.data'
import { NotFoundError } from '@/services/errors'

const MIN_LATENCY_MS = 250
const MAX_LATENCY_MS = 600
const DEFAULT_PAGE_SIZE = 12

function delay(): Promise<void> {
    const ms = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

function normalize(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

function matchesSearch(product: Product, search: string): boolean {
    const haystack = normalize(
        [product.name, product.description, product.printText, ...product.tags].join(' '),
    )
    return normalize(search)
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => haystack.includes(term))
}

function applyFilters(source: Product[], params: ProductQueryParams): Product[] {
    const { category, search, minPrice, maxPrice, tags } = params

    return source.filter((product) => {
        if (category && product.category !== category) return false
        if (search && !matchesSearch(product, search)) return false
        if (minPrice !== undefined && product.price < minPrice) return false
        if (maxPrice !== undefined && product.price > maxPrice) return false
        if (tags?.length && !tags.every((tag) => product.tags.includes(tag))) return false
        return true
    })
}

/** Relevance ranks bestsellers first, then new products; ties show the newest first. */
function relevanceScore(product: Product): number {
    const bestsellerBoost = product.tags.includes('bestseller') ? 10 : 0
    const newBoost = product.tags.includes('nuevo') ? 4 : 0
    return bestsellerBoost + newBoost
}

function byNewest(a: Product, b: Product): number {
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
}

const comparators: Record<SortOption, (a: Product, b: Product) => number> = {
    relevance: (a, b) => relevanceScore(b) - relevanceScore(a) || byNewest(a, b),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    newest: byNewest,
}

function applySort(source: Product[], sort: SortOption): Product[] {
    return [...source].sort(comparators[sort])
}

export async function fetchProducts(params: ProductQueryParams = {}): Promise<Paginated<Product>> {
    await delay()

    const { sort = 'relevance', page = 1, pageSize = DEFAULT_PAGE_SIZE } = params
    const filtered = applySort(applyFilters(products, params), sort)

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const offset = (safePage - 1) * pageSize

    return {
        items: filtered.slice(offset, offset + pageSize),
        page: safePage,
        pageSize,
        total,
        totalPages,
    }
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
    await delay()

    const product = products.find((candidate) => candidate.slug === slug)
    if (!product) {
        throw new NotFoundError('el producto', slug)
    }
    return product
}

export async function fetchFeaturedProducts(limit = 8): Promise<Product[]> {
    await delay()

    return [...products].sort(comparators.relevance).slice(0, limit)
}

export async function fetchRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
    await delay()

    const product = products.find((candidate) => candidate.slug === slug)
    if (!product) {
        throw new NotFoundError('el producto', slug)
    }

    const sameCategory = products.filter(
        (candidate) => candidate.category === product.category && candidate.id !== product.id,
    )
    const fallback = products.filter(
        (candidate) => candidate.category !== product.category && candidate.id !== product.id,
    )

    return [...applySort(sameCategory, 'relevance'), ...applySort(fallback, 'relevance')].slice(
        0,
        limit,
    )
}

export async function fetchCategories(): Promise<Category[]> {
    await delay()

    return categories
}
