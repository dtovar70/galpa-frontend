import type { ContentSection, SiteContent } from '@/@types/content'
import type {
    Category,
    CategorySlug,
    ProductSpec,
    ProductTag,
    Product,
    StockMode,
} from '@/@types/product'

export type UserRole = 'ADMIN' | 'EDITOR'

export interface AuthUser {
    id: string
    email: string
    name: string
    role: UserRole
    createdAt: string
    updatedAt: string
}

/** Session timing returned with the user by login, refresh and `/auth/me`. */
export interface SessionInfo {
    /** Absolute expiry of the session cookie (ISO 8601, server clock). */
    expiresAt: string
    /** Seconds left when the response was sent; pairs with the local receive time. */
    expiresInSeconds: number
    /** Lifetime of a freshly issued session token. */
    ttlSeconds: number
    /** Inactivity limit before the "extend session?" prompt. */
    idleMinutes: number
    /** Countdown of that prompt before the session is closed. */
    promptSeconds: number
}

/** Body of `POST /auth/login`, `POST /auth/refresh` and `GET /auth/me`. */
export interface AdminSession extends AuthUser {
    session: SessionInfo
}

export interface LoginCredentials {
    email: string
    password: string
}

/** Admin view of a product: hidden products included, plus visibility and edit time. */
export interface AdminProduct extends Product {
    isActive: boolean
    updatedAt: string
}

export interface AdminProductQueryParams {
    search?: string
    category?: CategorySlug
    isActive?: boolean
    page?: number
    pageSize?: number
}

export interface ProductVariantInput {
    /** Sent for an existing variant so orders and carts keep pointing to it. */
    id?: string
    label: string
    priceDelta: number
    stock: number
}

/** Body of `POST /admin/products`; `PATCH` accepts any subset of it. */
export interface ProductInput {
    name: string
    slug?: string
    categorySlug: CategorySlug
    price: number
    /** `null` clears the "before" price on update. */
    compareAtPrice?: number | null
    /** Only for a `STOCK` product without variants; with variants the API uses their sum. */
    stock?: number
    brand: string
    model: string | null
    sku: string | null
    stockMode: StockMode
    leadTimeDays: number | null
    btu: number | null
    voltage: string | null
    isInverter: boolean | null
    refrigerant: string | null
    specs: ProductSpec[]
    description: string
    highlights: string[]
    tags: ProductTag[]
    variants: ProductVariantInput[]
    isActive: boolean
}

/** Admin view of a category: its menu position and every product, hidden ones included. */
export interface AdminCategory extends Category {
    sortOrder: number
    /** Products of any visibility; a category can only be deleted when this is 0. */
    totalProductCount: number
}

/** Body of `POST /admin/categories`. Without `slug` the API derives it from the name. */
export interface CategoryCreateInput {
    name: string
    slug?: string
    tagline: string
    description: string
    colorHex: string
    icon: string | null
    sortOrder?: number
}

/** Body of `PATCH /admin/categories/:slug`; the slug itself cannot change. */
export type CategoryInput = Partial<Omit<CategoryCreateInput, 'slug'>>

/** One section of the site content as the admin sees it (`GET /admin/content`). */
export interface AdminContentSection<K extends ContentSection = ContentSection> {
    section: K
    value: SiteContent[K]
    /** True while nothing is stored and the built-in texts are shown. */
    isDefault: boolean
    /** ISO 8601; null for the built-in texts. */
    updatedAt: string | null
    updatedBy: { id: string; name: string } | null
}

export type AdminContent = { [K in ContentSection]: AdminContentSection<K> }
