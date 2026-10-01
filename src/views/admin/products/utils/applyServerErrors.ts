import type { FieldPath, UseFormSetError } from 'react-hook-form'

import { isApiError } from '@/services/errors'
import type { ProductFormValues } from '@/views/admin/products/schema/product.schema'

const TOP_LEVEL_FIELDS = new Set<string>([
    'name',
    'slug',
    'categorySlug',
    'price',
    'compareAtPrice',
    'stock',
    'brand',
    'model',
    'sku',
    'stockMode',
    'leadTimeDays',
    'btu',
    'voltage',
    'refrigerant',
    'description',
    'tags',
    'isActive',
])

/** API field path to form field path, or `null` when the form has no matching input. */
function toFormPath(field: string): FieldPath<ProductFormValues> | null {
    if (TOP_LEVEL_FIELDS.has(field)) return field as FieldPath<ProductFormValues>
    if (field === 'isInverter') return 'inverter'
    if (/^(variants\.\d+\.(label|priceDelta|stock)|specs\.\d+\.(label|value))$/.test(field)) {
        return field as FieldPath<ProductFormValues>
    }
    const highlight = /^highlights\.(\d+)$/.exec(field)
    if (highlight) return `highlights.${Number(highlight[1])}.value`
    return null
}

/**
 * Pins API validation errors on the fields they belong to and returns the message for the
 * form-level alert: the backend's own message plus anything no field could show.
 */
export function applyServerErrors(
    error: unknown,
    setError: UseFormSetError<ProductFormValues>,
): string {
    if (!isApiError(error)) {
        return 'No pudimos guardar el producto. Intenta de nuevo.'
    }

    if (error.status === 409) {
        setError('slug', { type: 'server', message: error.message })
        return error.message
    }

    if (error.status === 400 && error.message.includes('compareAtPrice')) {
        setError('compareAtPrice', { type: 'server', message: error.message })
    }

    const unplaced: string[] = []
    for (const detail of error.details) {
        const message = detail.errors[0]
        if (!message) continue
        const path = toFormPath(detail.field)
        if (path) setError(path, { type: 'server', message })
        else unplaced.push(`${detail.field}: ${message}`)
    }

    return unplaced.length ? `${error.message} ${unplaced.join(' · ')}` : error.message
}
