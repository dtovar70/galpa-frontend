import { z } from 'zod'

/**
 * Venezuelan phone and cédula/RIF formats. Mirrors the API's
 * backend-cups/src/common/validation/ve-formats.ts.
 */

/** Mobile number as stored: operator code, dash, seven digits ("0424-1234567"). */
export const VE_MOBILE_PATTERN = /^04\d{2}-\d{7}$/
/** Any Venezuelan number, landlines included: "0412-5550134", "0251-1234567". */
export const VE_PHONE_PATTERN = /^0\d{3}-\d{7}$/
export const MOBILE_NUMBER_DIGITS = 7

/** V (venezolano), J (jurídico), G (gobierno). The API accepts exactly these. */
export const ID_NUMBER_LETTERS = ['V', 'J', 'G'] as const
export type IdNumberLetter = (typeof ID_NUMBER_LETTERS)[number]
export const ID_NUMBER_MIN_DIGITS = 6
export const ID_NUMBER_MAX_DIGITS = 9
export const ID_NUMBER_PATTERN = /^[VJG]-\d{6,9}$/
export const ID_NUMBER_MESSAGE = 'Usa V, J o G seguido de 6 a 9 números, por ejemplo V-12345678'

export interface MobileParts {
    prefix: string
    number: string
}

/** "0424-1234567" -> { prefix: "0424", number: "1234567" }; "" -> both empty. */
export function splitMobile(value: string): MobileParts {
    const match = /^(\d{0,4})-?(\d*)$/.exec(value.trim())
    if (!match) return { prefix: '', number: '' }
    return { prefix: match[1] ?? '', number: (match[2] ?? '').slice(0, MOBILE_NUMBER_DIGITS) }
}

/** What the field stores: "0424-1234567", or "" while no digit of the number was typed. */
export function joinMobile({ prefix, number }: MobileParts): string {
    return number ? `${prefix}-${number}` : ''
}

/**
 * A whole mobile number however it was written: "04241234567", "0424-1234567",
 * "+58 424 1234567", "0058 424 123 4567" or "424 1234567". Null when it is not one.
 */
export function parseMobile(text: string): MobileParts | null {
    let digits = text.replace(/\D/g, '')
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (/^58\d{10}$/.test(digits)) digits = `0${digits.slice(2)}`
    else if (/^4\d{9}$/.test(digits)) digits = `0${digits}`
    return /^04\d{9}$/.test(digits) ? { prefix: digits.slice(0, 4), number: digits.slice(4) } : null
}

export interface IdNumberParts {
    letter: IdNumberLetter
    digits: string
}

export function isIdLetter(value: string): value is IdNumberLetter {
    return (ID_NUMBER_LETTERS as readonly string[]).includes(value)
}

/** "J-123456789" -> { letter: "J", digits: "123456789" }; "" -> V and no digits. */
export function splitIdNumber(value: string): IdNumberParts {
    const match = /^([A-Z])?-?(\d*)$/.exec(value.trim().toUpperCase())
    const letter = match?.[1] ?? 'V'
    return {
        letter: isIdLetter(letter) ? letter : 'V',
        digits: (match?.[2] ?? '').slice(0, ID_NUMBER_MAX_DIGITS),
    }
}

/** What the field stores: "V-12345678", or "" while no digit was typed. */
export function joinIdNumber({ letter, digits }: IdNumberParts): string {
    return digits ? `${letter}-${digits}` : ''
}

/**
 * A pasted cédula or RIF: "v12345678", "V-12.345.678", "J-123456789", "12.345.678". The letter
 * is null when none (or an unknown one) was written; digits past the ninth are dropped.
 */
export function parseIdNumber(text: string): { letter: IdNumberLetter | null; digits: string } {
    const compact = text.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const match = /^([A-Z]?)(\d+)$/.exec(compact)
    if (!match)
        return { letter: null, digits: text.replace(/\D/g, '').slice(0, ID_NUMBER_MAX_DIGITS) }
    const letter = match[1] ?? ''
    return {
        letter: isIdLetter(letter) ? letter : null,
        digits: (match[2] ?? '').slice(0, ID_NUMBER_MAX_DIGITS),
    }
}

/**
 * The zod rule of a mobile field fed by `MobilePhoneField`: an operator code and 7 digits. Each
 * missing part gets its own message. The API also checks that the code is active.
 */
export function mobilePhoneSchema({
    required,
    optional = false,
}: {
    required: string
    optional?: boolean
}) {
    return z
        .string()
        .trim()
        .superRefine((value, context) => {
            if (value === '') {
                if (!optional) context.addIssue({ code: 'custom', message: required })
                return
            }
            if (VE_MOBILE_PATTERN.test(value)) return
            const { prefix, number } = splitMobile(value)
            context.addIssue({
                code: 'custom',
                message: !/^04\d{2}$/.test(prefix)
                    ? 'Elige el código de la operadora'
                    : number.length < MOBILE_NUMBER_DIGITS
                      ? `Escribe los ${MOBILE_NUMBER_DIGITS} números después del código`
                      : 'Usa un celular con el formato 0412-5550134',
            })
        })
}

/** The zod rule of a field fed by `IdNumberField` ("" allowed only when optional). */
export function idNumberSchema({
    required = '',
    optional = false,
}: {
    required?: string
    optional?: boolean
}) {
    return z
        .string()
        .trim()
        .toUpperCase()
        .superRefine((value, context) => {
            if (value === '') {
                if (!optional) context.addIssue({ code: 'custom', message: required })
                return
            }
            if (!ID_NUMBER_PATTERN.test(value)) {
                context.addIssue({ code: 'custom', message: ID_NUMBER_MESSAGE })
            }
        })
}
