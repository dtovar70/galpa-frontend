import { useState } from 'react'
import { cva } from 'class-variance-authority'

import type { Product, ProductVariant } from '@/@types/product'
import { ProductIllustration } from '@/components/shared/ProductIllustration'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { categorySurface } from '@/components/shared/illustration/artwork'
import { Sticker } from '@/components/ui'
import { cldSrcSet, cldUrl } from '@/utils/cloudinary'
import { cn } from '@/utils/cn'
import { isVariantSoldOut } from '@/utils/productStock'
import { useCategory } from '@/views/catalog/hooks/useCategories'

const thumbVariants = cva(
    'flex size-20 items-center justify-center rounded-2xl border-2 bg-white p-1.5 transition duration-200',
    {
        variants: {
            isSelected: {
                true: 'border-blush-400',
                false: 'border-line hover:border-blush-200',
            },
        },
        defaultVariants: { isSelected: false },
    },
)

export interface ProductGalleryProps {
    product: Product
    selectedVariant?: ProductVariant
    onSelectVariant: (variantId: string) => void
}

function resolveColor(product: Product, variant?: ProductVariant): string {
    return variant?.colorHex ?? product.colorHex
}

export function ProductGallery({ product, selectedVariant, onSelectVariant }: ProductGalleryProps) {
    const hasDiscount =
        product.compareAtPrice !== undefined && product.compareAtPrice > product.price
    const [chosenImageId, setChosenImageId] = useState<string | null>(null)
    const hasPhotos = product.images.length > 0
    const activeImage =
        product.images.find((image) => image.id === chosenImageId) ?? product.images.at(0)
    const accentColor = useCategory(product.category)?.colorHex
    const surface = categorySurface(product.category, accentColor ?? product.colorHex)

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    'relative flex items-center justify-center rounded-blob border border-line p-8 sm:p-12',
                    surface.className,
                )}
                style={surface.style}
            >
                {hasDiscount ? (
                    <Sticker tone="blush" size="lg" className="absolute top-5 left-5 shadow-lift">
                        ¡Oferta!
                    </Sticker>
                ) : null}

                <ProductMedia
                    category={product.category}
                    color={resolveColor(product, selectedVariant)}
                    printText={product.printText}
                    accentColor={accentColor}
                    image={activeImage}
                    fallbackAlt={product.name}
                    size="lg"
                    loading="eager"
                    fetchPriority="high"
                    sizes="(min-width: 480px) 24rem, calc(100vw - 6rem)"
                    className="max-w-sm"
                />
            </div>

            {hasPhotos ? (
                product.images.length > 1 ? (
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
                                        className="size-full rounded-xl object-cover"
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null
            ) : (
                <ul className="flex flex-wrap gap-3">
                    {product.variants.map((variant) => (
                        <li key={variant.id}>
                            <button
                                type="button"
                                onClick={() => onSelectVariant(variant.id)}
                                disabled={isVariantSoldOut(variant)}
                                aria-pressed={variant.id === selectedVariant?.id}
                                aria-label={
                                    isVariantSoldOut(variant)
                                        ? `${variant.label} (agotada)`
                                        : `Ver ${variant.label}`
                                }
                                className={cn(
                                    thumbVariants({
                                        isSelected: variant.id === selectedVariant?.id,
                                    }),
                                    'disabled:cursor-not-allowed disabled:opacity-40',
                                )}
                            >
                                <ProductIllustration
                                    category={product.category}
                                    color={resolveColor(product, variant)}
                                    printText={product.printText}
                                    accentColor={accentColor}
                                    size="lg"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
