/**
 * Categories are managed from the admin, so any slug the API returns is valid. The alias only
 * documents intent where a string holds a category slug.
 */
export type CategorySlug = string

export type ProductTag = 'nuevo' | 'bestseller' | 'oferta' | 'personalizable'

export interface ProductVariant {
    id: string
    label: string
    priceDelta: number
    colorHex?: string
    /** Units of this version in stock; 0 means it is sold out ("Agotada"). */
    stock: number
}

export interface ProductImage {
    id: string
    url: string
    alt: string | null
}

export interface Product {
    id: string
    slug: string
    name: string
    category: CategorySlug
    price: number
    compareAtPrice?: number
    printText: string
    colorHex: string
    description: string
    highlights: string[]
    variants: ProductVariant[]
    tags: ProductTag[]
    /** Units in stock: the sum of the variants' stock when the product has variants. */
    stock: number
    createdAt: string
    /** Uploaded photos in display order; empty means the generated illustration is shown. */
    images: ProductImage[]
}

/** A rectangle relative to a photo: (0, 0) is its top-left corner, 1 its full width/height. */
export interface DesignPrintArea {
    x: number
    y: number
    width: number
    height: number
}

/** "Plantilla para diseñar": the photo of the blank product in one garment color. */
export interface DesignTemplateColor {
    id: string
    /** "Negro", as the customer reads it. */
    name: string
    /** `#RRGGBB`: the swatch. */
    hex: string
    imageUrl: string
    /** Pixel size of the photo. */
    width: number
    height: number
    printArea: DesignPrintArea
}

/** The template photos the design editor draws on: one per garment color, same print size. */
export interface CategoryDesignTemplate {
    printWidthCm: number
    printHeightCm: number
    /** In the admin's order; the first one is the default. Never empty. */
    colors: DesignTemplateColor[]
}

export interface Category {
    slug: CategorySlug
    name: string
    tagline: string
    description: string
    colorHex: string
    productCount: number
    /** Personalizable products of this category offer "Diseñar con mi imagen". */
    designEnabled: boolean
    /** The template photos; null means the generated illustration (when `designEnabled`). */
    designTemplate: CategoryDesignTemplate | null
    /** Effective print size in cm; null when the category is not designable. */
    designPrintSize: { widthCm: number; heightCm: number } | null
}

export interface Review {
    id: string
    productId: string
    author: string
    rating: number
    comment: string
    createdAt: string
}
