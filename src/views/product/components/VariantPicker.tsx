import { cva } from 'class-variance-authority'

import type { ProductVariant } from '@/@types/product'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { isVariantSoldOut } from '@/utils/productStock'

const optionVariants = cva(
    'inline-flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition duration-200 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-blush-400 has-[input:focus-visible]:ring-offset-2',
    {
        variants: {
            isSelected: {
                true: 'border-blush-400 bg-blush-100 text-blush-700',
                false: 'border-line bg-white text-ink-soft hover:border-blush-200 hover:text-ink',
            },
            isSoldOut: {
                true: 'cursor-not-allowed border-dashed border-line bg-cream text-ink-soft/60 hover:border-line hover:text-ink-soft/60',
                false: '',
            },
        },
        defaultVariants: { isSelected: false, isSoldOut: false },
    },
)

export interface VariantPickerProps {
    /** Sold-out versions stay visible but disabled, marked "Agotada". */
    variants: ProductVariant[]
    /** The product's base price; each option shows its own final price when they differ. */
    basePrice: number
    selectedVariantId?: string
    onSelect: (variantId: string) => void
}

export function VariantPicker({
    variants,
    basePrice,
    selectedVariantId,
    onSelect,
}: VariantPickerProps) {
    if (variants.length === 0) return null
    const showPrices = new Set(variants.map((variant) => variant.priceDelta)).size > 1

    return (
        <fieldset className="space-y-3">
            <legend className="font-display text-base text-ink">Elige tu versión</legend>

            <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                    const isSoldOut = isVariantSoldOut(variant)
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
                                <span className="text-xs font-semibold text-blush-700">
                                    Agotada
                                </span>
                            ) : showPrices ? (
                                <span className="text-xs text-ink-soft">
                                    {formatCurrency(basePrice + variant.priceDelta)}
                                </span>
                            ) : null}
                        </label>
                    )
                })}
            </div>
        </fieldset>
    )
}
