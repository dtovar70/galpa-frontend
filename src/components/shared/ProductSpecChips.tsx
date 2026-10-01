import { Snowflake, Zap } from 'lucide-react'

import type { Product } from '@/@types/product'
import { formatBtu } from '@/constants/product.constant'
import { cn } from '@/utils/cn'

export interface ProductSpecChipsProps {
    product: Pick<Product, 'btu' | 'isInverter' | 'voltage'>
    /** Adds the voltage chip (the detail page has room for it). */
    showVoltage?: boolean
    className?: string
}

const CHIP = 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold'

/** The figures customers compare at a glance: capacity, inverter and voltage. */
export function ProductSpecChips({
    product,
    showVoltage = false,
    className,
}: ProductSpecChipsProps) {
    const hasAny =
        product.btu !== null || product.isInverter === true || (showVoltage && product.voltage)
    if (!hasAny) return null

    return (
        <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Características">
            {product.btu !== null ? (
                <li className={cn(CHIP, 'bg-ink font-tech text-white')}>
                    <Snowflake aria-hidden="true" className="size-3 text-frost-400" />
                    {formatBtu(product.btu)}
                </li>
            ) : null}
            {product.isInverter ? (
                <li className={cn(CHIP, 'bg-brand-100 text-brand-800')}>Inverter</li>
            ) : null}
            {showVoltage && product.voltage ? (
                <li className={cn(CHIP, 'border border-line-strong font-tech text-ink-soft')}>
                    <Zap aria-hidden="true" className="size-3" />
                    {product.voltage}
                </li>
            ) : null}
        </ul>
    )
}
