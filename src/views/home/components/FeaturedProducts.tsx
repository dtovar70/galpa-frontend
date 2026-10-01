import { PackageOpen } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ProductGrid } from '@/components/shared/ProductGrid'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button, ButtonLink } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { FEATURED_LIMIT, useFeaturedProducts } from '@/views/home/hooks/useFeaturedProducts'

export function FeaturedProducts() {
    const { data: products, isPending, isError, refetch } = useFeaturedProducts()
    const { home } = useSiteContent()

    return (
        <section aria-labelledby="featured-heading" className="bg-mist/60 py-16 lg:py-24">
            <div className={cn(CONTAINER, 'space-y-10')}>
                <SectionHeading
                    headingId="featured-heading"
                    eyebrow={home.featuredEyebrow}
                    title={home.featuredTitle}
                    description={home.featuredDescription}
                    action={
                        <ButtonLink to={ROUTES.catalog} variant="secondary">
                            {home.featuredCta}
                        </ButtonLink>
                    }
                />

                {isError ? (
                    <EmptyState
                        title="No pudimos cargar los productos"
                        description="Algo falló al traer los destacados. Inténtalo de nuevo."
                        icon={<PackageOpen className="size-6" />}
                        action={
                            <Button variant="secondary" onClick={() => void refetch()}>
                                Reintentar
                            </Button>
                        }
                    />
                ) : (
                    <ProductGrid
                        products={products ?? []}
                        isPending={isPending}
                        skeletonCount={FEATURED_LIMIT}
                    />
                )}
            </div>
        </section>
    )
}
