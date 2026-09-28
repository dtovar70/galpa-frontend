import { z } from 'zod'

import { DELIVERY_METHOD_LABELS as LABELS } from '@/constants/order.constant'
import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { mobilePhoneSchema } from '@/utils/veFormats'

export const DELIVERY_METHODS = ['delivery', 'pickup'] as const

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = LABELS

export const CHECKOUT_NOTES_MAX_LENGTH = 300

/**
 * Same rules as the API's CreateOrderDto, so most mistakes are caught before sending. The phone
 * is a mobile ("0424-1234567", from `MobilePhoneField`): order notices go out by WhatsApp.
 */

export const checkoutSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(3, 'Escribe tu nombre y apellido')
        .max(MAX_TEXT, MAX_TEXT_MESSAGE),
    email: z
        .string()
        .trim()
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .pipe(z.email('Escribe un correo válido, por ejemplo hola@correo.com')),
    phone: mobilePhoneSchema({ required: 'Escribe tu número de celular' }),
    city: z.string().trim().min(2, 'Escribe tu ciudad').max(80, 'Máximo 80 caracteres'),
    address: z
        .string()
        .trim()
        .min(6, 'Escribe una dirección completa')
        .max(MAX_TEXT, MAX_TEXT_MESSAGE),
    notes: z
        .string()
        .trim()
        .max(CHECKOUT_NOTES_MAX_LENGTH, `Máximo ${CHECKOUT_NOTES_MAX_LENGTH} caracteres`),
    deliveryMethod: z.enum(DELIVERY_METHODS),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const CHECKOUT_FIELDS = Object.keys(checkoutSchema.shape) as (keyof CheckoutValues)[]
