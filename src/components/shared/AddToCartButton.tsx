import { useEffect, useRef, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'

import type { CartDesign } from '@/@types/design'
import type { Product } from '@/@types/product'
import { Button, type ButtonProps } from '@/components/ui'
import { useCartActions, useCartItems } from '@/store/cartStore'
import { useCartDrawer } from '@/store/uiStore'
import { cartUnitsOf } from '@/utils/cartAvailability'
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
    /** The customer's own image ("Diseño propio"); part of the cart line identity. */
    design?: CartDesign | null
    label?: string
    /** Opening the drawer is the default success feedback; cards can opt out. */
    openDrawerOnAdd?: boolean
    /** Called after the line was added (e.g. to let go of a design that is now in the cart). */
    onAdded?: () => void
    /** Blocks adding for a reason of the caller (e.g. a design made for another version). */
    disabled?: boolean
}

export function AddToCartButton({
    product,
    variantId,
    quantity = 1,
    personalization,
    design,
    label = 'Agregar',
    openDrawerOnAdd = true,
    onAdded,
    disabled = false,
    ...buttonProps
}: AddToCartButtonProps) {
    const { addItem } = useCartActions()
    const cartItems = useCartItems()
    const { open } = useCartDrawer()
    const [isConfirming, setIsConfirming] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    useEffect(() => () => clearTimeout(timeoutRef.current), [])

    const handleClick = () => {
        addItem(product, variantId, quantity, personalization, design)
        onAdded?.()
        setIsConfirming(true)
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setIsConfirming(false), CONFIRMATION_MS)

        if (openDrawerOnAdd) open()
    }

    const variant = product.variants.find((candidate) => candidate.id === variantId)
    const stock = stockOf(product, variant)
    const isSoldOut = stock <= 0
    // Every unit left is already in the cart (lines of this version share its stock).
    const isAllInCart = !isSoldOut && cartUnitsOf(cartItems, product.id, variantId) >= stock

    return (
        <Button
            onClick={handleClick}
            disabled={disabled || isSoldOut || (isAllInCart && !isConfirming)}
            leadingIcon={
                isConfirming ? (
                    <Check aria-hidden="true" className="size-4" />
                ) : (
                    <ShoppingBag aria-hidden="true" className="size-4" />
                )
            }
            {...buttonProps}
        >
            {isSoldOut
                ? 'Agotado'
                : isConfirming
                  ? '¡Agregado!'
                  : isAllInCart
                    ? 'Ya está todo en tu carrito'
                    : label}
        </Button>
    )
}
