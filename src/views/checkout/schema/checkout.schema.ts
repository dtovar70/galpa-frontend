import { z } from 'zod'

import { PAYMENT_METHODS } from '@/@types/order'
import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { idNumberSchema, mobilePhoneSchema } from '@/utils/veFormats'

export const DELIVERY_METHODS = ['delivery', 'pickup'] as const

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const CHECKOUT_NOTES_MAX_LENGTH = 300

/**
 * Same rules as the API's CreateOrderDto, so most mistakes are caught before sending. The phone
 * is a mobile ("0424-1234567", from `MobilePhoneField`): order notices go out by WhatsApp. The
 * cédula/RIF is optional (invoices); the payment method is one of those the store offers.
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
    customerIdNumber: idNumberSchema({ optional: true }),
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
    paymentMethod: z.enum(PAYMENT_METHODS, 'Elige cómo vas a pagar'),
    wantsInstallation: z.boolean(),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const CHECKOUT_FIELDS = Object.keys(checkoutSchema.shape) as (keyof CheckoutValues)[]
