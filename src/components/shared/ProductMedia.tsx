import { cva, type VariantProps } from 'class-variance-authority'

import type { CategorySlug } from '@/@types/product'
import { ProductPlaceholder } from '@/components/shared/ProductPlaceholder'
import { placeholderArtFor } from '@/constants/category.constant'
import { useCategory } from '@/views/catalog/hooks/useCategories'
import { cldSrcSet, cldUrl } from '@/utils/cloudinary'
import { cn } from '@/utils/cn'

/** Same width caps as `ProductPlaceholder`, so a photo and a drawing occupy the same slot. */
const photoVariants = cva('aspect-square w-full rounded-2xl bg-white object-contain select-none', {
    variants: {
        size: {
            sm: 'max-w-16 rounded-xl',
            md: 'max-w-60',
            lg: 'max-w-full',
        },
    },
    defaultVariants: {
        size: 'md',
    },
})

type PhotoSize = 'sm' | 'md' | 'lg'

/**
 * Candidate widths (for `srcSet`) and the default `sizes` of each slot. Phones with 2-3x screens
 * pick the larger candidates; nothing ever downloads the full-size upload.
 */
const RESPONSIVE: Record<PhotoSize, { widths: number[]; sizes: string }> = {
    sm: { widths: [64, 128, 192], sizes: '64px' },
    md: { widths: [240, 360, 480, 720], sizes: '240px' },
    lg: { widths: [400, 640, 800, 1200], sizes: '(min-width: 640px) 24rem, 100vw' },
}

export interface ProductMediaImage {
    url: string
    alt?: string | null
}

export interface ProductMediaProps extends VariantProps<typeof photoVariants> {
    category: CategorySlug
    /** Uploaded photo; when missing, the category's line-art placeholder is drawn instead. */
    image?: ProductMediaImage
    /** Accessible name for the photo when it has no `alt` of its own. */
    fallbackAlt?: string
    className?: string
    loading?: 'eager' | 'lazy'
    /** `sizes` of the photo when its slot is not the size variant's default width. */
    sizes?: string
    /** Hint for the most important photo of the page (the gallery's main image). */
    fetchPriority?: 'high' | 'low' | 'auto'
}

/** A product's photo when it has one, otherwise its category placeholder. */
export function ProductMedia({
    category,
    image,
    fallbackAlt,
    size,
    className,
    loading = 'lazy',
    sizes,
    fetchPriority,
}: ProductMediaProps) {
    const categoryInfo = useCategory(category)

    if (!image) {
        return (
            <ProductPlaceholder
                art={placeholderArtFor(category, categoryInfo)}
                size={size}
                className={className}
            />
        )
    }

    const responsive = RESPONSIVE[size ?? 'md']
    const srcSet = cldSrcSet(image.url, responsive.widths)

    return (
        <img
            src={cldUrl(image.url, responsive.widths.at(-1) ?? 800)}
            srcSet={srcSet}
            sizes={srcSet ? (sizes ?? responsive.sizes) : undefined}
            alt={image.alt || fallbackAlt || ''}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            draggable={false}
            className={cn(photoVariants({ size }), className)}
        />
    )
}
