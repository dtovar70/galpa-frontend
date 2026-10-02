import { z } from 'zod'

import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { CATEGORY_ICON_NAMES } from '@/constants/category.constant'
import { HEX_COLOR_PATTERN, SLUG_PATTERN } from '@/views/admin/products/schema/product.schema'

export const CATEGORY_NAME_MAX_LENGTH = 60
export const CATEGORY_SLUG_MAX_LENGTH = 60
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 1000

/** Mirrors the API's `CreateCategoryDto`. The slug is only sent on create. */
export const categoryFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Escribe el nombre')
        .max(CATEGORY_NAME_MAX_LENGTH, `Máximo ${CATEGORY_NAME_MAX_LENGTH} caracteres`),
    slug: z
        .string()
        .trim()
        .max(CATEGORY_SLUG_MAX_LENGTH, `Máximo ${CATEGORY_SLUG_MAX_LENGTH} caracteres`)
        .refine(
            (value) => value === '' || SLUG_PATTERN.test(value),
            'Solo minúsculas, números y guiones, por ejemplo aires-inverter',
        ),
    tagline: z.string().trim().max(MAX_TEXT, MAX_TEXT_MESSAGE),
    description: z
        .string()
        .trim()
        .max(
            CATEGORY_DESCRIPTION_MAX_LENGTH,
            `Máximo ${CATEGORY_DESCRIPTION_MAX_LENGTH} caracteres`,
        ),
    colorHex: z
        .string()
        .trim()
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .regex(HEX_COLOR_PATTERN, 'Usa un color hexadecimal, por ejemplo #0B6FB8'),
    /** Lucide icon name, or "" for the default one. */
    icon: z.union([z.enum(CATEGORY_ICON_NAMES), z.literal('')]),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const EMPTY_CATEGORY_FORM: CategoryFormValues = {
    name: '',
    slug: '',
    tagline: '',
    description: '',
    colorHex: '#0B6FB8',
    icon: 'air-vent',
}
