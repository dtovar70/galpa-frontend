import { z } from 'zod'

import { BADGE_TONES } from '@/@types/catalog'
import type { OrderStatus } from '@/@types/order'
import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import {
    WHATSAPP_TEMPLATE_MAX_LENGTH,
    whatsAppTemplateError,
} from '@/views/admin/catalogs/utils/whatsappTemplate'

/** Group descriptions and customer messages (same limit as the API and the columns). */
export const CATALOG_DESCRIPTION_MAX_LENGTH = 300

/** Placeholders a customer message may use, filled in on the order page. */
export const CUSTOMER_MESSAGE_PLACEHOLDERS = ['produccion', 'marca'] as const

const ONLY_KNOWN_PLACEHOLDERS = new RegExp(
    `^(?:[^{}]|\\{(?:${CUSTOMER_MESSAGE_PLACEHOLDERS.join('|')})\\})*$`,
)

const required = (message: string) =>
    z.string().trim().min(1, message).max(MAX_TEXT, MAX_TEXT_MESSAGE)

/** Mirrors the API's `UpdateOrderStatusDto`. */
export const orderStatusFormSchema = z.object({
    label: required('Escribe el nombre del estado'),
    tone: z.enum(BADGE_TONES),
    customerLabel: required('Escribe el nombre que ve el cliente'),
    customerTitle: z.string().trim().max(MAX_TEXT, MAX_TEXT_MESSAGE),
    customerDescription: z
        .string()
        .trim()
        .max(CATALOG_DESCRIPTION_MAX_LENGTH, `Máximo ${CATALOG_DESCRIPTION_MAX_LENGTH} caracteres`)
        .regex(ONLY_KNOWN_PLACEHOLDERS, 'Solo puedes usar los marcadores {produccion} y {marca}'),
    whatsappTemplate: z
        .string()
        .trim()
        .min(1, 'Escribe el mensaje de WhatsApp')
        .max(WHATSAPP_TEMPLATE_MAX_LENGTH, `Máximo ${WHATSAPP_TEMPLATE_MAX_LENGTH} caracteres`),
})

/** The form of one status: `{comprobante}` is only allowed where a receipt exists. */
export function createOrderStatusFormSchema(status: OrderStatus) {
    return orderStatusFormSchema.superRefine((values, context) => {
        const error = whatsAppTemplateError(values.whatsappTemplate, status)
        if (error) context.addIssue({ code: 'custom', path: ['whatsappTemplate'], message: error })
    })
}

export type OrderStatusFormValues = z.infer<typeof orderStatusFormSchema>

/** Mirrors the API's `UpdateOrderStatusGroupDto` (the position is changed with the arrows). */
export const orderStatusGroupFormSchema = z.object({
    label: required('Escribe el nombre de la pestaña'),
    description: z
        .string()
        .trim()
        .max(CATALOG_DESCRIPTION_MAX_LENGTH, `Máximo ${CATALOG_DESCRIPTION_MAX_LENGTH} caracteres`),
})

export type OrderStatusGroupFormValues = z.infer<typeof orderStatusGroupFormSchema>

export const BANK_CODE_PATTERN = /^\d{4}$/

/** Mirrors the API's `CreateBankDto`; the code is only sent on create. */
export const bankFormSchema = z.object({
    code: z
        .string()
        .trim()
        .regex(BANK_CODE_PATTERN, 'Usa los 4 dígitos del banco, por ejemplo 0102'),
    name: required('Escribe el nombre del banco'),
})

export type BankFormValues = z.infer<typeof bankFormSchema>

export const MOBILE_PREFIX_CODE_PATTERN = /^04\d{2}$/

/** Mirrors the API's `CreateMobilePrefixDto`. */
export const mobilePrefixFormSchema = z.object({
    code: z
        .string()
        .trim()
        .regex(MOBILE_PREFIX_CODE_PATTERN, 'Usa 4 dígitos que empiecen por 04, por ejemplo 0426'),
})

export type MobilePrefixFormValues = z.infer<typeof mobilePrefixFormSchema>
