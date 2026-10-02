import { cva } from 'class-variance-authority'

import type { Product, ProductVariant } from '@/@types/product'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { isVariantSoldOut } from '@/utils/productStock'

const optionVariants = cva(
    'inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition duration-200 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500 has-[input:focus-visible]:ring-offset-2',
    {
        variants: {
            isSelected: {
                true: 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500',
                false: 'border-line-strong bg-white text-ink-soft hover:border-ink/40 hover:text-ink',
            },
            isSoldOut: {
                true: 'cursor-not-allowed border-dashed border-line bg-page text-ink-muted/70 hover:border-line hover:text-ink-muted/70',
                false: '',
            },
        },
        defaultVariants: { isSelected: false, isSoldOut: false },
    },
)

export interface VariantPickerProps {
    product: Pick<Product, 'stock' | 'stockMode' | 'price'>
    /** Sold-out versions stay visible but disabled, marked "Agotada". */
    variants: ProductVariant[]
    selectedVariantId?: string
    onSelect: (variantId: string) => void
}

export function VariantPicker({
    product,
    variants,
    selectedVariantId,
    onSelect,
}: VariantPickerProps) {
    // A single version needs no choice.
    if (variants.length < 2) return null
    const showPrices = new Set(variants.map((variant) => variant.priceDelta)).size > 1

    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-ink">Elige la versión</legend>

            <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                    const isSoldOut = isVariantSoldOut(product, variant)
                    const isSelected = !isSoldOut && variant.id === selectedVariantId
                    return (
                        <label
                            key={variant.id}
                            // tailwind-merge lets the sold-out look override the unselected one.
                            className={cn(optionVariants({ isSelected, isSoldOut }))}
                        >
                            <input
                                type="radio"
                                name="variant"
                                className="sr-only"
                                value={variant.id}
                                checked={isSelected}
                                disabled={isSoldOut}
                                onChange={() => onSelect(variant.id)}
                            />
                            <span className={cn(isSoldOut && 'line-through')}>{variant.label}</span>
                            {isSoldOut ? (
                                <span className="text-xs font-semibold text-danger-700">
                                    Agotada
                                </span>
                            ) : showPrices ? (
                                <span className="text-xs text-ink-muted tabular-nums">
                                    {formatCurrency(product.price + variant.priceDelta)}
                                </span>
                            ) : null}
                        </label>
                    )
                })}
            </div>
        </fieldset>
    )
}
