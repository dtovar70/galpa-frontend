import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import type { Product, ProductTag } from '@/@types/product'
import { AddToCartButton } from '@/components/shared/AddToCartButton'
import { PriceTag } from '@/components/shared/PriceTag'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { categorySurface } from '@/components/shared/illustration/artwork'
import { Badge, Card, type BadgeProps } from '@/components/ui'
import { productPath } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { priceRange } from '@/utils/productPrice'
import { defaultVariant as pickDefaultVariant } from '@/utils/productStock'
import { useCategory } from '@/views/catalog/hooks/useCategories'
import { productDetailQueryOptions } from '@/views/product/hooks/useProduct'

const TAG_TONE: Record<ProductTag, NonNullable<BadgeProps['tone']>> = {
    nuevo: 'solid',
    bestseller: 'butter',
    oferta: 'sky',
    personalizable: 'mint',
}

const VISIBLE_TAGS = 2

export interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const queryClient = useQueryClient()
    // First version in stock; when all are sold out the button shows "Agotado".
    const defaultVariant = pickDefaultVariant(product)
    const { min: fromPrice, max: toPrice } = priceRange(product)
    const category = useCategory(product.category)
    const accentColor = category?.colorHex
    const surface = categorySurface(product.category, accentColor ?? product.colorHex)
    const coverImage = product.images.at(0)

    const prefetchDetail = () => {
        void queryClient.prefetchQuery(productDetailQueryOptions(product.slug))
    }

    return (
        <Card
            padding="none"
            interactive
            onMouseEnter={prefetchDetail}
            onFocus={prefetchDetail}
            className="group relative flex h-full flex-col overflow-hidden"
        >
            {/*
              Fixed square frame. Photos (usually shot on white) get a white surface and are
              contained below the badges, uncropped; drawings keep the category surface.
            */}
            <div
                className={cn(
                    'relative flex aspect-square items-center justify-center overflow-hidden px-6 py-6',
                    coverImage ? 'bg-white' : surface.className,
                )}
                style={coverImage ? undefined : surface.style}
            >
                <ul className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                    {product.tags.slice(0, VISIBLE_TAGS).map((tag) => (
                        <li key={tag}>
                            <Badge tone={TAG_TONE[tag]} size="sm">
                                {tag}
                            </Badge>
                        </li>
                    ))}
                </ul>

                <ProductMedia
                    category={product.category}
                    color={product.colorHex}
                    printText={product.printText}
                    accentColor={accentColor}
                    image={coverImage}
                    fallbackAlt={product.name}
                    size="md"
                    className={cn(
                        'transition-transform duration-300 motion-reduce:transform-none',
                        coverImage
                            ? 'absolute inset-0 size-full max-w-none rounded-none object-contain px-6 pt-14 pb-6 group-hover:scale-105'
                            : 'group-hover:-translate-y-1',
                    )}
                />
            </div>

            <div className="flex flex-1 flex-col gap-2 p-5">
                {category ? (
                    <p className="text-xs font-semibold tracking-[0.15em] text-blush-500 uppercase">
                        {category.name}
                    </p>
                ) : null}

                <h3 className="font-display text-lg leading-snug text-ink">
                    <Link
                        to={productPath(product.slug)}
                        className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                        {product.name}
                    </Link>
                </h3>

                {product.description ? (
                    <p className="line-clamp-2 text-sm text-ink-soft">{product.description}</p>
                ) : null}

                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <PriceTag
                        price={fromPrice}
                        isFromPrice={fromPrice !== toPrice}
                        compareAtPrice={product.compareAtPrice}
                        className="min-w-0"
                    />

                    {defaultVariant ? (
                        <AddToCartButton
                            product={product}
                            variantId={defaultVariant.id}
                            size="sm"
                            className="relative z-10 shrink-0"
                        />
                    ) : null}
                </div>
            </div>
        </Card>
    )
}
