import { z } from 'zod'

import { PAYMENT_METHODS, type PaymentMethod } from '@/@types/order'
import { TEXT_INPUT_MAX_LENGTH as MAX_TEXT } from '@/constants/ui.constant'
import { ID_NUMBER_MESSAGE, ID_NUMBER_PATTERN, VE_MOBILE_PATTERN } from '@/utils/veFormats'

export const MAX_PROOF_BYTES = 5 * 1024 * 1024
export const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** "32.469,62" / "32469.62" -> 32469.62; NaN when it is not an amount. */
function parseAmount(value: string): number {
    const text = value.trim().replace(/\s/g, '')
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text
    return /^\d+(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : Number.NaN
}

export interface ReferenceRule {
    /** Digits only (bank references) or letters and digits (Zelle, Binance). */
    digitsOnly: boolean
    min: number
    max: number
    message: string
}

/** Reference formats per method (same as the API's SubmitPaymentDto). */
export const REFERENCE_RULES: Record<PaymentMethod, ReferenceRule> = {
    PAGO_MOVIL: {
        digitsOnly: true,
        min: 4,
        max: 12,
        message: 'La referencia del Pago Móvil tiene de 4 a 12 dígitos.',
    },
    TRANSFERENCIA: {
        digitsOnly: true,
        min: 4,
        max: 20,
        message: 'La referencia de la transferencia tiene de 4 a 20 dígitos.',
    },
    ZELLE: {
        digitsOnly: false,
        min: 4,
        max: 40,
        message: 'Usa de 4 a 40 letras o números de la confirmación de Zelle.',
    },
    BINANCE: {
        digitsOnly: false,
        min: 4,
        max: 64,
        message: 'Usa de 4 a 64 letras o números del ID de la orden de Binance.',
    },
}

/** Keeps what a reference may hold for `method` (digits, or letters and digits). */
export function cleanReference(method: PaymentMethod, value: string): string {
    const rule = REFERENCE_RULES[method]
    const cleaned = rule.digitsOnly ? value.replace(/\D/g, '') : value.replace(/[^\dA-Za-z]/g, '')
    return cleaned.slice(0, rule.max)
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_LIKE_PATTERN = /^\+?[\d\s()-]{7,20}$/

/**
 * Every method's fields in one flat form; only the chosen method's ones are checked (and sent).
 * Same rules as the API's SubmitPaymentDto (dates are checked against the order there).
 */
export const paymentSchema = z
    .object({
        method: z.enum(PAYMENT_METHODS),
        reference: z.string().trim(),
        paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del pago'),
        payerBankCode: z.string(),
        payerPhone: z.string().trim(),
        payerIdNumber: z.string().trim().toUpperCase(),
        payerName: z.string().trim().max(MAX_TEXT),
        payerAccount: z.string().trim().max(MAX_TEXT),
        amountBs: z.string().max(MAX_TEXT),
        amountUsd: z.string().max(MAX_TEXT),
    })
    .superRefine((values, context) => {
        const issue = (path: string, message: string) =>
            context.addIssue({ code: 'custom', path: [path], message })
        const rule = REFERENCE_RULES[values.method]
        const pattern = rule.digitsOnly ? /^\d+$/ : /^[\dA-Za-z]+$/
        if (
            !pattern.test(values.reference) ||
            values.reference.length < rule.min ||
            values.reference.length > rule.max
        ) {
            issue('reference', rule.message)
        }

        switch (values.method) {
            case 'PAGO_MOVIL':
            case 'TRANSFERENCIA':
                if (!values.payerBankCode)
                    issue('payerBankCode', 'Elige el banco desde el que pagaste')
                if (!ID_NUMBER_PATTERN.test(values.payerIdNumber)) {
                    issue(
                        'payerIdNumber',
                        values.payerIdNumber
                            ? ID_NUMBER_MESSAGE
                            : 'Escribe la cédula o RIF del titular',
                    )
                }
                if (values.method === 'PAGO_MOVIL' && !VE_MOBILE_PATTERN.test(values.payerPhone)) {
                    issue(
                        'payerPhone',
                        'Escribe el celular desde el que pagaste, por ejemplo 0412-5550134',
                    )
                }
                if (!(parseAmount(values.amountBs) > 0)) {
                    issue('amountBs', 'Escribe el monto pagado, por ejemplo 1.234,56')
                }
                break
            case 'ZELLE':
                if (values.payerName.length < 3)
                    issue('payerName', 'Escribe el nombre del titular de la cuenta Zelle')
                if (
                    !EMAIL_PATTERN.test(values.payerAccount) &&
                    !PHONE_LIKE_PATTERN.test(values.payerAccount)
                ) {
                    issue('payerAccount', 'Escribe el correo o teléfono registrado en Zelle')
                }
                if (!(parseAmount(values.amountUsd) > 0)) {
                    issue('amountUsd', 'Escribe el monto pagado, por ejemplo 120,00')
                }
                break
            case 'BINANCE':
                if (values.payerAccount.length < 3) {
                    issue('payerAccount', 'Escribe tu Binance Pay ID o el correo de tu cuenta')
                }
                if (!(parseAmount(values.amountUsd) > 0)) {
                    issue('amountUsd', 'Escribe el monto pagado, por ejemplo 120,00')
                }
                break
        }
    })

export type PaymentFormValues = z.infer<typeof paymentSchema>

export const PAYMENT_FIELDS = [
    'method',
    'reference',
    'paidOn',
    'payerBankCode',
    'payerPhone',
    'payerIdNumber',
    'payerName',
    'payerAccount',
    'amountBs',
    'amountUsd',
] as const satisfies readonly (keyof PaymentFormValues)[]

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
