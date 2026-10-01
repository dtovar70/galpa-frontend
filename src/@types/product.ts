/**
 * Categories are managed from the admin, so any slug the API returns is valid. The alias only
 * documents intent where a string holds a category slug.
 */
export type CategorySlug = string

export const PRODUCT_TAGS = ['nuevo', 'bestseller', 'oferta'] as const
export type ProductTag = (typeof PRODUCT_TAGS)[number]

/** `STOCK` sells what is on the shelf; `ON_ORDER` is sold "bajo pedido" with no stock limit. */
export const STOCK_MODES = ['STOCK', 'ON_ORDER'] as const
export type StockMode = (typeof STOCK_MODES)[number]

/** Computed by the API from `stockMode` and the stock count. */
export const PRODUCT_AVAILABILITIES = ['IN_STOCK', 'ON_ORDER', 'OUT_OF_STOCK'] as const
export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number]

export interface ProductVariant {
    id: string
    /** "12.000 BTU", "220V". */
    label: string
    priceDelta: number
    /** Units of this version in stock (only meaningful for `STOCK` products). */
    stock: number
    sortOrder: number
}

export interface ProductImage {
    id: string
    url: string
    alt: string | null
}

/** One row of the "ficha técnica". */
export interface ProductSpec {
    label: string
    value: string
}

export interface Product {
    id: string
    slug: string
    name: string
    category: CategorySlug
    /** "Daikin", "LG", "Gree". */
    brand: string
    model: string | null
    sku: string | null
    price: number
    compareAtPrice?: number
    description: string
    highlights: string[]
    variants: ProductVariant[]
    tags: ProductTag[]
    stockMode: StockMode
    /** Days until an `ON_ORDER` product arrives; null when unknown or not on order. */
    leadTimeDays: number | null
    /** Cooling capacity (air conditioners); null for parts and accessories. */
    btu: number | null
    /** "110V", "220V", "208-230V". */
    voltage: string | null
    isInverter: boolean | null
    /** "R410A", "R32". */
    refrigerant: string | null
    /** Ordered, at most 30 rows. */
    specs: ProductSpec[]
    availability: ProductAvailability
    /** Units in stock: the sum of the variants' stock when the product has variants. */
    stock: number
    createdAt: string
    /** Uploaded photos in display order; empty means the category placeholder is shown. */
    images: ProductImage[]
}

/** `GET /products/facets?category=`: the values the catalog filters offer. */
export interface ProductFacets {
    brands: string[]
    btus: number[]
    voltages: string[]
    priceRange: { min: number; max: number }
}

export interface Category {
    slug: CategorySlug
    name: string
    tagline: string
    description: string
    colorHex: string
    /** Lucide icon name ("air-vent", "building-2", "wrench", "package"); null uses a default. */
    icon: string | null
    productCount: number
}
