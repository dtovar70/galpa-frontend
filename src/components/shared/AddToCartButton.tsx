import { useEffect, useRef, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'

import type { Product } from '@/@types/product'
import { Button, type ButtonProps } from '@/components/ui'
import { useCartActions } from '@/store/cartStore'
import { useCartDrawer } from '@/store/uiStore'
import { stockOf } from '@/utils/productStock'

const CONFIRMATION_MS = 1600

export interface AddToCartButtonProps extends Pick<
    ButtonProps,
    'size' | 'variant' | 'fullWidth' | 'className'
> {
    product: Product
    variantId: string
    quantity?: number
    /** Text to print, for `personalizable` products (part of the cart line identity). */
    personalization?: string
    label?: string
    /** Opening the drawer is the default success feedback; cards can opt out. */
    openDrawerOnAdd?: boolean
}

export function AddToCartButton({
    product,
    variantId,
    quantity = 1,
    personalization,
    label = 'Agregar',
    openDrawerOnAdd = true,
    ...buttonProps
}: AddToCartButtonProps) {
    const { addItem } = useCartActions()
    const { open } = useCartDrawer()
    const [isConfirming, setIsConfirming] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    useEffect(() => () => clearTimeout(timeoutRef.current), [])

    const handleClick = () => {
        addItem(product, variantId, quantity, personalization)
        setIsConfirming(true)
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setIsConfirming(false), CONFIRMATION_MS)

        if (openDrawerOnAdd) open()
    }

    const variant = product.variants.find((candidate) => candidate.id === variantId)
    const isSoldOut = stockOf(product, variant) <= 0

    return (
        <Button
            onClick={handleClick}
            disabled={isSoldOut}
            leadingIcon={
                isConfirming ? (
                    <Check aria-hidden="true" className="size-4" />
                ) : (
                    <ShoppingBag aria-hidden="true" className="size-4" />
                )
            }
            {...buttonProps}
        >
            {isSoldOut ? 'Agotado' : isConfirming ? '¡Agregado!' : label}
        </Button>
    )
}
