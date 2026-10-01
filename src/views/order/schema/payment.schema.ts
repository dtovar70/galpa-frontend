import { z } from 'zod'

import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { idNumberSchema, mobilePhoneSchema } from '@/utils/veFormats'

export const MAX_PROOF_BYTES = 5 * 1024 * 1024
export const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** "32.469,62" / "32469.62" -> 32469.62; NaN when it is not an amount. */
export function parseBsAmount(value: string): number {
    const text = value.trim().replace(/\s/g, '')
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text
    return /^\d+(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : Number.NaN
}

/** Only the last digits of the bank reference are asked for: the whole number is long. */
export const REFERENCE_DIGITS = 6

/** Same rules as the API's SubmitPaymentDto (dates are checked against the order there). */
export const paymentSchema = z.object({
    reference: z
        .string()
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .transform((value) => value.replace(/[\s.-]/g, ''))
        .pipe(
            z
                .string()
                .min(1, 'Escribe los últimos 6 dígitos de la referencia.')
                .regex(/^\d{6}$/, 'Deben ser exactamente 6 dígitos.'),
        ),
    payerBankCode: z.string().min(1, 'Elige el banco desde el que pagaste'),
    payerPhone: mobilePhoneSchema({ required: 'Escribe el teléfono desde el que pagaste' }),
    payerIdNumber: idNumberSchema({ optional: true }),
    paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del pago'),
    amountBs: z
        .string()
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .refine(
            (value) => parseBsAmount(value) > 0,
            'Escribe el monto pagado, por ejemplo 1.234,56',
        ),
})

export type PaymentFormInput = z.input<typeof paymentSchema>
export type PaymentFormValues = z.output<typeof paymentSchema>

export const PAYMENT_FIELDS = Object.keys(paymentSchema.shape) as (keyof PaymentFormValues)[]

/**
 * Problem with a chosen screenshot, or null when it can be sent. `ignoreSize` checks only the
 * type (the weight is checked again after the screenshot is shrunk in the browser).
 */
export function proofProblem(file: File, options: { ignoreSize?: boolean } = {}): string | null {
    if (!(PROOF_TYPES as readonly string[]).includes(file.type)) {
        return 'La captura debe ser una imagen JPG, PNG o WEBP.'
    }
    if (!options.ignoreSize && file.size > MAX_PROOF_BYTES) {
        return 'La captura puede pesar como máximo 5 MB.'
    }
    return null
}
