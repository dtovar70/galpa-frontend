import { Palette } from 'lucide-react'

import type { GarmentColor } from '@/@types/design'
import { Badge } from '@/components/ui'
import { cn } from '@/utils/cn'

/** Marks a line printed with the customer's own image. */
export function DesignBadge({ className }: { className?: string }) {
    return (
        <Badge tone="lilac" size="sm" className={cn('w-fit', className)}>
            <Palette aria-hidden="true" className="size-3" />
            Diseño propio
        </Badge>
    )
}

/**
 * "Color de la prenda: Negro" with its swatch, under a design line. The color is not
 * stock-tracked: it only tells the workshop which garment to print on.
 */
export function GarmentColorNote({
    color,
    className,
}: {
    color: GarmentColor
    className?: string
}) {
    return (
        <p className={cn('flex items-center gap-1.5 text-xs text-ink-soft', className)}>
            <span
                aria-hidden="true"
                className="inline-block size-3 shrink-0 rounded-full border border-line"
                style={{ backgroundColor: color.hex }}
            />
            <span className="min-w-0 break-words">
                Color: <span className="font-semibold text-ink">{color.name}</span>
            </span>
        </p>
    )
}
