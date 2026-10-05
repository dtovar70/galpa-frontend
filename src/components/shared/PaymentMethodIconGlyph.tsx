import { createElement } from 'react'
import type { LucideProps } from 'lucide-react'

import { paymentMethodIcon } from '@/constants/payment.constant'

export interface PaymentMethodIconGlyphProps extends Omit<LucideProps, 'name'> {
    /** The method's icon name from the catalog; unknown or missing draws a wallet. */
    name: string | null | undefined
}

/** A payment method's icon, looked up by the name the API stores. Decorative by default. */
export function PaymentMethodIconGlyph({ name, ...props }: PaymentMethodIconGlyphProps) {
    return createElement(paymentMethodIcon(name), { 'aria-hidden': true, ...props })
}
