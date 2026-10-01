import { ProductGrid } from '@/components/shared/ProductGrid'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { RELATED_LIMIT, useRelatedProducts } from '@/views/product/hooks/useRelatedProducts'

export interface RelatedProductsProps {
    slug: string
}

export function RelatedProducts({ slug }: RelatedProductsProps) {
    const { data: products, isPending, isError } = useRelatedProducts(slug)

    if (isError) return null

    return (
        <section aria-labelledby="related-heading" className="space-y-8">
            <SectionHeading
                headingId="related-heading"
                level="h3"
                eyebrow="Productos relacionados"
                title="También te puede *interesar*"
            />

            <ProductGrid
                products={products ?? []}
                isPending={isPending}
                skeletonCount={RELATED_LIMIT}
            />
        </section>
    )
}
