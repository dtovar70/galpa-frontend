import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import type { Product, ProductTag } from '@/@types/product'
import { AddToCartButton } from '@/components/shared/AddToCartButton'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { PriceTag } from '@/components/shared/PriceTag'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { ProductSpecChips } from '@/components/shared/ProductSpecChips'
import { Badge, Card } from '@/components/ui'
import { leadTimeText, PRODUCT_TAG_LABELS, PRODUCT_TAG_TONES } from '@/constants/product.constant'
import { productPath } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { priceRange } from '@/utils/productPrice'
import { defaultVariant as pickDefaultVariant } from '@/utils/productStock'
import { productDetailQueryOptions } from '@/views/product/hooks/useProduct'

/** Which tag wins the card's corner: a deal first, then news, then best sellers. */
const TAG_PRIORITY: readonly ProductTag[] = ['oferta', 'nuevo', 'bestseller']

export interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const queryClient = useQueryClient()
    // First version available; when all are sold out the button shows "Agotado".
    const defaultVariant = pickDefaultVariant(product)
    const { min: fromPrice, max: toPrice } = priceRange(product)
    const coverImage = product.images.at(0)
    const leadTime = product.availability === 'ON_ORDER' ? leadTimeText(product.leadTimeDays) : null
    const topTag = [...product.tags].sort(
        (a, b) => TAG_PRIORITY.indexOf(a) - TAG_PRIORITY.indexOf(b),
    )[0]

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
            {/* Fixed square frame: photos are contained uncropped, placeholders fill it. */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden border-b border-line bg-white">
                <div className="absolute inset-x-2.5 top-2.5 z-10 flex items-start justify-between gap-1.5 sm:inset-x-4 sm:top-4">
                    <AvailabilityBadge product={product} />
                    {topTag ? (
                        <Badge tone={PRODUCT_TAG_TONES[topTag]} size="sm" className="max-sm:hidden">
                            {PRODUCT_TAG_LABELS[topTag]}
                        </Badge>
                    ) : null}
                </div>

                <ProductMedia
                    category={product.category}
                    image={coverImage}
                    fallbackAlt={product.name}
                    size="lg"
                    sizes="(min-width: 1280px) 18rem, (min-width: 640px) 33vw, 50vw"
                    className={cn(
                        'absolute inset-0 size-full max-w-none rounded-none transition-transform duration-300 motion-reduce:transform-none',
                        coverImage
                            ? 'object-contain px-3 pt-10 pb-3 group-hover:scale-105 sm:px-6 sm:pt-14 sm:pb-6'
                            : 'group-hover:scale-[1.03]',
                    )}
                />
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
                <p className="truncate text-[11px] font-bold tracking-[0.12em] text-brand-700 uppercase sm:text-xs">
                    {product.brand}
                    {product.model ? (
                        <span className="font-tech font-medium tracking-normal text-ink-muted normal-case">
                            {' '}
                            · {product.model}
                        </span>
                    ) : null}
                </p>

                <h3 className="text-sm leading-snug font-semibold text-ink sm:text-base">
                    <Link
                        to={productPath(product.slug)}
                        className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                        {product.name}
                    </Link>
                </h3>

                <ProductSpecChips product={product} />

                {leadTime ? (
                    <p className="text-xs font-medium text-warning-800">{leadTime}</p>
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

                        {defaultVariant || product.variants.length === 0 ? (
                            <AddToCartButton
                                product={product}
                                variantId={defaultVariant?.id ?? null}
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
