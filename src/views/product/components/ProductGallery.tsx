import { useState } from 'react'
import { cva } from 'class-variance-authority'

import type { Product } from '@/@types/product'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { Badge } from '@/components/ui'
import { cldSrcSet, cldUrl } from '@/utils/cloudinary'

const thumbVariants = cva(
    'flex size-20 items-center justify-center rounded-xl border bg-white p-1.5 transition duration-200',
    {
        variants: {
            isSelected: {
                true: 'border-brand-500 ring-2 ring-brand-100',
                false: 'border-line hover:border-line-strong',
            },
        },
        defaultVariants: { isSelected: false },
    },
)

export interface ProductGalleryProps {
    product: Product
}

/** The main photo with its thumbnails, or the category line-art when there are no photos. */
export function ProductGallery({ product }: ProductGalleryProps) {
    const hasDiscount =
        product.compareAtPrice !== undefined && product.compareAtPrice > product.price
    const [chosenImageId, setChosenImageId] = useState<string | null>(null)
    const activeImage =
        product.images.find((image) => image.id === chosenImageId) ?? product.images.at(0)

    return (
        <div className="space-y-4">
            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-white p-6 sm:p-10">
                {hasDiscount ? (
                    <Badge tone="danger" className="absolute top-4 left-4 z-10">
                        Oferta
                    </Badge>
                ) : null}

                <ProductMedia
                    category={product.category}
                    image={activeImage}
                    fallbackAlt={product.name}
                    size="lg"
                    loading="eager"
                    fetchPriority="high"
                    sizes="(min-width: 480px) 28rem, calc(100vw - 5rem)"
                    className="max-w-md"
                />
            </div>

            {product.images.length > 1 ? (
                <ul className="flex flex-wrap gap-3">
                    {product.images.map((image, index) => (
                        <li key={image.id}>
                            <button
                                type="button"
                                onClick={() => setChosenImageId(image.id)}
                                aria-pressed={image.id === activeImage?.id}
                                aria-label={`Ver foto ${index + 1} de ${product.images.length}`}
                                className={thumbVariants({
                                    isSelected: image.id === activeImage?.id,
                                })}
                            >
                                <img
                                    src={cldUrl(image.url, 160)}
                                    srcSet={cldSrcSet(image.url, [80, 160, 240])}
                                    sizes="68px"
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    draggable={false}
                                    className="size-full rounded-lg object-contain"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}
