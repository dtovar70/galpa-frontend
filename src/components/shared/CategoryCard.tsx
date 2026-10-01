import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import type { Category } from '@/@types/product'
import { ProductIllustration } from '@/components/shared/ProductIllustration'
import { Badge, Card } from '@/components/ui'
import { categoryPath } from '@/constants/route.constant'

export interface CategoryCardProps {
    category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
    return (
        <Card
            tone="cream"
            interactive
            padding="none"
            className="group relative flex h-full flex-col overflow-hidden"
        >
            <div className="flex items-center justify-center bg-white/70 px-6 py-8">
                <ProductIllustration
                    category={category.slug}
                    color={category.colorHex}
                    accentColor={category.colorHex}
                    printText={category.name}
                    size="md"
                    className="transition-transform duration-300 group-hover:-rotate-3 motion-reduce:transform-none"
                />
            </div>

            <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-2xl text-ink">
                        <Link
                            to={categoryPath(category.slug)}
                            className="rounded-sm after:absolute after:inset-0 after:content-['']"
                        >
                            {category.name}
                        </Link>
                    </h3>
                    <ArrowUpRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-blush-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transform-none"
                    />
                </div>

                <p className="text-sm font-semibold text-blush-700">{category.tagline}</p>
                <p className="text-sm text-ink-soft">{category.description}</p>

                <Badge tone="neutral" size="sm" className="mt-auto self-start">
                    {category.productCount} diseños listos
                </Badge>
            </div>
        </Card>
    )
}
