import type { FieldPath } from 'react-hook-form'
import { z } from 'zod'

import type { QuotesContent } from '@/@types/content'
import type { Quote, QuoteInput } from '@/@types/quote'
import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { caracasToday, toCalendarDay } from '@/utils/calendarDay'
import { idNumberSchema, mobilePhoneSchema } from '@/utils/veFormats'

export const QUOTE_MAX_ITEMS = 50
export const QUOTE_NOTES_MAX_LENGTH = 1000
export const QUOTE_TERMS_MAX_LENGTH = 2000
export const QUOTE_DESCRIPTION_MAX_LENGTH = 300
const MAX_AMOUNT = 99_999_999.99
export const QUOTE_MAX_QUANTITY = 9999

/** At most two decimals, checked on the text form to dodge floating-point noise. */
function hasTwoDecimalsAtMost(value: number): boolean {
    return /^\d+(\.\d{1,2})?$/.test(String(value))
}

function money(requiredMessage: string) {
    return z
        .number({ error: requiredMessage })
        .min(0, 'No puede ser negativo')
        .max(MAX_AMOUNT, 'El monto es demasiado alto')
        .refine(hasTwoDecimalsAtMost, 'Usa como máximo dos decimales')
}

/** Mirrors the API's quote DTO, so most mistakes are caught before saving. */
export const quoteFormSchema = z
    .object({
        customerName: z
            .string()
            .trim()
            .min(3, 'Escribe el nombre del cliente')
            .max(MAX_TEXT, MAX_TEXT_MESSAGE),
        // Optional, like the API: the email is needed to send the PDF, a mobile number to
        // share it by WhatsApp.
        customerEmail: z
            .string()
            .trim()
            .max(MAX_TEXT, MAX_TEXT_MESSAGE)
            .refine(
                (value) => value === '' || z.email().safeParse(value).success,
                'Escribe un correo válido, por ejemplo cliente@correo.com',
            ),
        customerPhone: mobilePhoneSchema({ required: '', optional: true }),
        customerIdNumber: idNumberSchema({ optional: true }),
        customerCompany: z.string().trim().max(MAX_TEXT, MAX_TEXT_MESSAGE),
        validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige hasta cuándo es válida'),
        discount: money('Escribe el descuento (0 si no hay)'),
        notes: z
            .string()
            .trim()
            .max(QUOTE_NOTES_MAX_LENGTH, `Máximo ${QUOTE_NOTES_MAX_LENGTH} caracteres`),
        terms: z
            .string()
            .trim()
            .max(QUOTE_TERMS_MAX_LENGTH, `Máximo ${QUOTE_TERMS_MAX_LENGTH} caracteres`),
        items: z
            .array(
                z.object({
                    productId: z.string().nullable(),
                    /** The chosen version when the product has variants. */
                    variantId: z.string().nullable(),
                    description: z
                        .string()
                        .trim()
                        .min(1, 'Describe el producto o servicio')
                        .max(
                            QUOTE_DESCRIPTION_MAX_LENGTH,
                            `Máximo ${QUOTE_DESCRIPTION_MAX_LENGTH} caracteres`,
                        ),
                    brand: z.string().trim().max(60, 'Máximo 60 caracteres'),
                    model: z.string().trim().max(80, 'Máximo 80 caracteres'),
                    quantity: z
                        .number({ error: 'Escribe la cantidad' })
                        .int('Usa un número entero')
                        .min(1, 'Mínimo 1')
                        .max(QUOTE_MAX_QUANTITY, 'Cantidad demasiado alta'),
                    unitPrice: money('Escribe el precio unitario'),
                }),
            )
            .min(1, 'Agrega al menos una línea')
            .max(QUOTE_MAX_ITEMS, `Máximo ${QUOTE_MAX_ITEMS} líneas`),
    })
    .superRefine((values, context) => {
        const subtotal = quoteSubtotal(values.items)
        if (values.discount > subtotal) {
            context.addIssue({
                code: 'custom',
                path: ['discount'],
                message: 'El descuento no puede superar el subtotal',
            })
        }
    })

export type QuoteFormValues = z.infer<typeof quoteFormSchema>
export type QuoteFormItem = QuoteFormValues['items'][number]

/** Rounded to cents like the API. */
function cents(value: number): number {
    return Math.round(value * 100) / 100
}

export function lineTotal(item: Partial<Pick<QuoteFormItem, 'quantity' | 'unitPrice'>>): number {
    const quantity = Number(item.quantity)
    const price = Number(item.unitPrice)
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) return 0
    return cents(quantity * price)
}

export function quoteSubtotal(
    items: readonly Partial<Pick<QuoteFormItem, 'quantity' | 'unitPrice'>>[],
): number {
    return cents(items.reduce((sum, item) => sum + lineTotal(item), 0))
}

function addDays(days: number): string {
    const date = caracasToday()
    date.setDate(date.getDate() + days)
    return toCalendarDay(date)
}

/** A new quote, from the defaults set in Contenido → Cotizaciones. */
export function emptyQuoteForm(defaults: QuotesContent): QuoteFormValues {
    return {
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerIdNumber: '',
        customerCompany: '',
        validUntil: addDays(defaults.defaultValidityDays),
        discount: 0,
        notes: '',
        terms: defaults.defaultTerms,
        items: [],
    }
}

export function toQuoteFormValues(quote: Quote): QuoteFormValues {
    return {
        customerName: quote.customerName,
        customerEmail: quote.customerEmail ?? '',
        customerPhone: quote.customerPhone ?? '',
        customerIdNumber: quote.customerIdNumber ?? '',
        customerCompany: quote.customerCompany ?? '',
        validUntil: quote.validUntil,
        discount: quote.discount,
        notes: quote.notes ?? '',
        terms: quote.terms ?? '',
        items: [...quote.items]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                description: item.description,
                brand: item.brand ?? '',
                model: item.model ?? '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
    }
}

export function toQuoteInput(values: QuoteFormValues): QuoteInput {
    return {
        customerName: values.customerName,
        customerEmail: values.customerEmail || null,
        customerPhone: values.customerPhone || null,
        customerIdNumber: values.customerIdNumber || null,
        customerCompany: values.customerCompany || null,
        notes: values.notes,
        terms: values.terms,
        validUntil: values.validUntil,
        discount: values.discount,
        items: values.items.map((item) => ({
            productId: item.productId,
            variantId: item.productId ? item.variantId : null,
            description: item.description,
            brand: item.brand || null,
            model: item.model || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        })),
    }
}

/** API field path ("items.2.unitPrice") to a form field, or null when no input shows it. */
export function quoteFormPath(field: string): FieldPath<QuoteFormValues> | null {
    const item = /^items\.(\d+)\.(description|brand|model|quantity|unitPrice)$/.exec(field)
    if (item) return field as FieldPath<QuoteFormValues>
    const top: readonly (keyof QuoteFormValues)[] = [
        'customerName',
        'customerEmail',
        'customerPhone',
        'customerIdNumber',
        'customerCompany',
        'validUntil',
        'discount',
        'notes',
        'terms',
        'items',
    ]
    return top.find((name) => name === field) ?? null
}
