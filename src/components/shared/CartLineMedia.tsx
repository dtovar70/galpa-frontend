import { useState } from 'react'

import type { CartItem } from '@/@types/cart'
import { ProductMedia } from '@/components/shared/ProductMedia'
import { DesignService } from '@/services/DesignService'
import { cn } from '@/utils/cn'

export interface CartLineMediaProps {
    item: CartItem
    size: 'sm' | 'lg'
}

/**
 * A cart line's picture: the preview of its own design when it has one (loaded with the token
 * the cart keeps), otherwise the product photo or illustration. A preview that no longer loads
 * (e.g. the design expired) falls back to the product.
 */
export function CartLineMedia({ item, size }: CartLineMediaProps) {
    const [failedPath, setFailedPath] = useState<string | null>(null)
    const design = item.design
    if (design && failedPath !== design.previewPath) {
        return (
            <img
                src={DesignService.url(design.previewPath)}
                alt={`Tu diseño para ${item.name}`}
                loading="lazy"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
                onError={() => setFailedPath(design.previewPath)}
                className={cn(
                    'aspect-[6/5] w-full object-contain select-none',
                    size === 'sm' ? 'max-w-16 rounded-xl' : 'max-w-full rounded-2xl',
                )}
            />
        )
    }
    return (
        <ProductMedia
            category={item.category}
            color={item.colorHex}
            printText={item.printText}
            image={item.imageUrl ? { url: item.imageUrl } : undefined}
            fallbackAlt={item.name}
            size={size}
        />
    )
}
