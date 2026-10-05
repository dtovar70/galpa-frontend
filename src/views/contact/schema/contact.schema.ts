import { z } from 'zod'

import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { mobilePhoneSchema } from '@/utils/veFormats'

export const CONTACT_MESSAGE_MAX_LENGTH = 600
export const CONTACT_AREA_MAX = 5000

/**
 * Same rules as the API's ContactMessageDto, so most mistakes are caught before sending. The
 * WhatsApp is optional; when given it is a mobile ("0424-1234567", from `MobilePhoneField`).
 * The topic and space type are codes of the options catalog (`useContactOptions`); the API
 * checks they are active. Space type and area are optional and kept as typed (`""` when empty). `productSlug` comes from
 * the `?producto=` link of a product page. `website` is the hidden honeypot input.
 */
export const contactSchema = z.object({
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
    phone: mobilePhoneSchema({ required: '', optional: true }),
    topic: z.string().min(1, 'Elige un tema'),
    spaceType: z.string(),
    areaM2: z
        .string()
        .trim()
        .refine(
            (value) => {
                if (value === '') return true
                const area = Number(value.replace(',', '.'))
                return Number.isFinite(area) && area >= 1 && area <= CONTACT_AREA_MAX
            },
            `Indica un área entre 1 y ${CONTACT_AREA_MAX.toLocaleString('es-VE')} m²`,
        ),
    productSlug: z.string(),
    message: z
        .string()
        .trim()
        .min(15, 'Cuéntanos un poco más, al menos 15 caracteres')
        .max(CONTACT_MESSAGE_MAX_LENGTH, `Máximo ${CONTACT_MESSAGE_MAX_LENGTH} caracteres`),
    website: z.string(),
})

export type ContactValues = z.infer<typeof contactSchema>

/** Fields the API may pin an error on (`details[].field`). */
export const CONTACT_FIELDS = [
    'fullName',
    'email',
    'phone',
    'topic',
    'spaceType',
    'areaM2',
    'productSlug',
    'message',
] as const
