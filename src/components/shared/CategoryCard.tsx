import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { CategoryIconGlyph } from '@/components/shared/CategoryIconGlyph'
import type { Category } from '@/@types/product'
import { categoryPath } from '@/constants/route.constant'

export interface CategoryCardProps {
    category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
    const count = category.productCount

    return (
        <article className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none">
            <div className="flex items-start justify-between gap-3">
                <span className="grid size-14 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                    <CategoryIconGlyph name={category.icon} className="size-7" strokeWidth={1.75} />
                </span>
                <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-ink-muted transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand-600 motion-reduce:transform-none"
                />
            </div>

            <div className="flex flex-1 flex-col gap-2">
                <h3 className="text-xl text-ink">
                    <Link
                        to={categoryPath(category.slug)}
                        className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                        {category.name}
                    </Link>
                </h3>
                {category.tagline ? (
                    <p className="text-sm font-semibold text-brand-700">{category.tagline}</p>
                ) : null}
                <p className="text-sm text-ink-soft">{category.description}</p>
            </div>

            <p className="text-xs font-medium tracking-wide text-ink-muted uppercase tabular-nums">
                {count === 1 ? '1 producto' : `${count} productos`}
            </p>
        </article>
    )
}
