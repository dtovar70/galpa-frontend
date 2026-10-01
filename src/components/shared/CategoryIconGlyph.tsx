import { createElement } from 'react'
import type { LucideProps } from 'lucide-react'

import { categoryIcon } from '@/constants/category.constant'

export interface CategoryIconGlyphProps extends Omit<LucideProps, 'name'> {
    /** The category's lucide icon name; unknown or empty draws the default. */
    name: string | null | undefined
}

/** A category's icon, looked up by the name the API stores. Decorative by default. */
export function CategoryIconGlyph({ name, ...props }: CategoryIconGlyphProps) {
    return createElement(categoryIcon(name), { 'aria-hidden': true, ...props })
}
