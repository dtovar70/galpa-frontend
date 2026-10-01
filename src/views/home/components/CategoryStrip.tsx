import { PackageOpen } from 'lucide-react'

import { CategoryCard } from '@/components/shared/CategoryCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button, Skeleton } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { cn } from '@/utils/cn'
import { categoryCountPhrase, fillPlaceholdersInSentence } from '@/utils/content'
import { useFillPlaceholders, useSiteContent } from '@/utils/hooks/useSiteContent'
import { useCategories } from '@/views/catalog/hooks/useCategories'

const SKELETON_COUNT = 4

export function CategoryStrip() {
    const { data: categories, isPending, isError, refetch } = useCategories()
    const { home } = useSiteContent()
    const fill = useFillPlaceholders()
    // "{categorias}" is the live category count (categories are managed in the admin).
    const description = fillPlaceholdersInSentence(fill(home.categoriesDescription), {
        categorias: categoryCountPhrase(categories?.length),
    })

    return (
        <section aria-labelledby="categories-heading" className="py-16 lg:py-24">
            <div className={cn(CONTAINER, 'space-y-10')}>
                <SectionHeading
                    headingId="categories-heading"
                    eyebrow={home.categoriesEyebrow}
                    title={home.categoriesTitle}
                    description={description}
                />

                {isError ? (
                    <EmptyState
                        title="No pudimos cargar las categorías"
                        description="Revisa tu conexión e inténtalo otra vez."
                        icon={<PackageOpen className="size-6" />}
                        action={
                            <Button variant="secondary" onClick={() => void refetch()}>
                                Reintentar
                            </Button>
                        }
                    />
                ) : (
                    <ul
                        className={cn(
                            'grid gap-6',
                            // Four cards read better as 2x2 / 1x4 than as a row of three plus one.
                            categories?.length === 4 || isPending
                                ? 'sm:grid-cols-2 xl:grid-cols-4'
                                : 'sm:grid-cols-2 lg:grid-cols-3',
                        )}
                    >
                        {isPending
                            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                                  <li key={index}>
                                      <Skeleton shape="block" className="h-64 w-full" />
                                  </li>
                              ))
                            : (categories ?? []).map((category) => (
                                  <li key={category.slug} className="h-full">
                                      <CategoryCard category={category} />
                                  </li>
                              ))}
                    </ul>
                )}
            </div>
        </section>
    )
}
