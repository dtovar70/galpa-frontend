import { z } from 'zod'

import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'

const CODE_MESSAGE = 'Escribe el código de tu pedido, por ejemplo GP-000123'

/**
 * "GP-000123", "gp-123", "GP123" or just "123" -> "GP-000123". Order codes are "GP-" plus the
 * sequence padded to 6 digits (the API's pattern is `GP-` + 6 or more digits), so padding a
 * shorter number gives the same code. Anything else is returned unchanged (and fails the check).
 */
export function normalizeOrderCode(raw: string): string {
    const match = /^(?:GP\s*-?\s*)?(\d+)$/i.exec(raw.trim())
    return match?.[1] ? `GP-${match[1].padStart(6, '0')}` : raw.trim()
}

/** Same rules as the API's OrderLookupDto. */
export const orderLookupSchema = z.object({
    code: z
        .string()
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .transform(normalizeOrderCode)
        .pipe(z.string().regex(/^GP-\d{6,}$/, CODE_MESSAGE)),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Escribe el correo que usaste al hacer el pedido')
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .pipe(z.email('Escribe un correo válido, por ejemplo hola@correo.com')),
})
export type OrderLookupInput = z.input<typeof orderLookupSchema>
export type OrderLookupValues = z.output<typeof orderLookupSchema>
