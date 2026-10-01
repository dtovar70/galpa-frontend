import type { Product } from '@/@types/product'
import { ProductCard } from '@/components/shared/ProductCard'
import { ProductCardSkeleton } from '@/components/shared/ProductCardSkeleton'
import { cn } from '@/utils/cn'

const DEFAULT_SKELETON_COUNT = 8

export interface ProductGridProps {
    products: Product[]
    isPending?: boolean
    skeletonCount?: number
    className?: string
}

export function ProductGrid({
    products,
    isPending = false,
    skeletonCount = DEFAULT_SKELETON_COUNT,
    className,
}: ProductGridProps) {
    const gridClassName = cn(
        'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4',
        className,
    )

    if (isPending) {
        return (
            <div className={gridClassName} aria-busy="true" aria-label="Cargando productos">
                {Array.from({ length: skeletonCount }, (_, index) => (
                    <ProductCardSkeleton key={index} />
                ))}
            </div>
        )
    }

    return (
        <ul className={gridClassName}>
            {products.map((product) => (
                <li key={product.id} className="h-full">
                    <ProductCard product={product} />
                </li>
            ))}
        </ul>
    )
}
