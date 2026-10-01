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
import { PRODUCT_TAG_LABELS } from '@/constants/product.constant'

const TAG_TONE: Record<ProductTag, NonNullable<BadgeProps['tone']>> = {
    nuevo: 'solid',
    bestseller: 'butter',
    oferta: 'sky',
    personalizable: 'mint',
}

const VISIBLE_TAGS = 2

/** Which tags win the card's limited space: a deal first, then news, then the rest. */
const TAG_PRIORITY: readonly ProductTag[] = ['oferta', 'nuevo', 'bestseller', 'personalizable']

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
                    'relative flex aspect-square items-center justify-center overflow-hidden p-3 sm:p-6',
                    coverImage ? 'bg-white' : surface.className,
                )}
                style={coverImage ? undefined : surface.style}
            >
                {/*
                  Two-column phone grid: one tag only, on a single line, so it never covers the
                  photo; wider cards show two.
                */}
                <ul className="absolute top-2.5 right-2.5 left-2.5 z-10 flex gap-1 overflow-hidden sm:top-4 sm:right-4 sm:left-4 sm:flex-wrap sm:gap-1.5">
                    {[...product.tags]
                        .sort((a, b) => TAG_PRIORITY.indexOf(a) - TAG_PRIORITY.indexOf(b))
                        .slice(0, VISIBLE_TAGS)
                        .map((tag, index) => (
                            <li key={tag} className={cn('shrink-0', index > 0 && 'max-sm:hidden')}>
                                <Badge tone={TAG_TONE[tag]} size="sm">
                                    {PRODUCT_TAG_LABELS[tag]}
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
                    sizes="(min-width: 1280px) 18rem, (min-width: 640px) 33vw, 50vw"
                    className={cn(
                        'transition-transform duration-300 motion-reduce:transform-none',
                        coverImage
                            ? 'absolute inset-0 size-full max-w-none rounded-none object-contain px-3 pt-10 pb-3 group-hover:scale-105 sm:px-6 sm:pt-14 sm:pb-6'
                            : 'group-hover:-translate-y-1',
                    )}
                />
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
                {category ? (
                    <p className="truncate text-[11px] font-semibold tracking-[0.12em] text-blush-700 uppercase sm:text-xs sm:tracking-[0.15em]">
                        {category.name}
                    </p>
                ) : null}

                <h3 className="font-display text-base leading-snug text-ink sm:text-lg">
                    <Link
                        to={productPath(product.slug)}
                        className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                        {product.name}
                    </Link>
                </h3>

                {product.description ? (
                    <p className="line-clamp-2 text-xs text-ink-soft sm:text-sm">
                        {product.description}
                    </p>
                ) : null}

                {/*
                  Price and button share a row only when the card is wide enough; a narrow card
                  (three columns next to the filters) stacks them so the button never covers
                  the price.
                */}
                <div className="@container mt-auto pt-2 sm:pt-3">
                    <div className="flex flex-col gap-2 sm:gap-3 @[18rem]:flex-row @[18rem]:items-end @[18rem]:justify-between">
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
                                // Narrow (two-column phone) cards let a long label wrap instead of overflowing.
                                className="relative z-10 h-auto min-h-9 w-full shrink-0 py-1.5 leading-tight whitespace-normal @[18rem]:w-auto pointer-coarse:min-h-11"
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </Card>
    )
}
