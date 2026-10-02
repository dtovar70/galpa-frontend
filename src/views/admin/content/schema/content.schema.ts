import { z } from 'zod'

import {
    BANK_ACCOUNT_TYPES,
    CONTENT_PLACEHOLDERS,
    ABOUT_VALUE_ICONS,
    type ContentPlaceholder,
    type ContentSection,
    type SiteContent,
} from '@/@types/content'
import { findUnknownPlaceholder, hasBrokenHighlights } from '@/utils/content'
import {
    ID_NUMBER_MESSAGE,
    ID_NUMBER_PATTERN,
    mobilePhoneSchema,
    VE_MOBILE_PATTERN,
    VE_PHONE_PATTERN,
} from '@/utils/veFormats'

/**
 * Admin forms for the site content. They mirror the API DTOs (backend-galpa/src/content/dto):
 * same lengths, list sizes, formats, placeholders and highlight rules, so most mistakes never
 * reach the server. Lists of plain texts are held as `{ value }` objects, which is the shape
 * `useFieldArray` needs.
 */

export const CONTENT_LIMITS = {
    label: 40,
    title: 90,
    itemTitle: 60,
    question: 100,
    /** Subtitles and descriptions edited in a textarea. */
    text: 300,
    /** Descriptions edited in a single-line field (every one-line field stops at 100). */
    shortText: 100,
    paragraph: 1000,
    brandName: 60,
    tagline: 80,
    titleSuffix: 70,
    metaDescription: 300,
    shippingCopy: 80,
    searchPlaceholder: 60,
    statValue: 12,
    email: 100,
    city: 80,
    schedule: 100,
    // Same limit as `banks.name`: the name is copied from the banks catalog.
    bankName: 100,
    holderName: 80,
    instructions: 500,
    payId: 64,
    testimonialQuote: 400,
    testimonialName: 60,
    testimonialProduct: 80,
} as const

export const CONTENT_LIST_SIZES = {
    heroFeatures: { min: 0, max: 4 },
    steps: { min: 1, max: 6 },
    paragraphs: { min: 1, max: 6 },
    values: { min: 1, max: 8 },
    stats: { min: 1, max: 8 },
    faq: { min: 1, max: 12 },
    testimonials: { min: 0, max: 12 },
} as const

export const CONTENT_MAX_MONEY = 100_000

export { ID_NUMBER_PATTERN, VE_MOBILE_PATTERN, VE_PHONE_PATTERN } from '@/utils/veFormats'
export { ABOUT_VALUE_ICONS }
export const BANK_CODE_PATTERN = /^\d{4}$/
const ACCOUNT_NUMBER_PATTERN = /^\d{20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PAY_ID_PATTERN = /^[A-Za-z0-9]{4,64}$/
export const SOCIAL_HANDLE_PATTERN = /^(?:[A-Za-z0-9._]{1,30})?$/

interface TextRules {
    optional?: boolean
    placeholders?: readonly ContentPlaceholder[]
    highlights?: boolean
    /** Message when a required field is left empty. */
    required?: string
}

export function placeholderList(names: readonly ContentPlaceholder[]): string {
    return names.map((name) => CONTENT_PLACEHOLDERS[name]).join(', ')
}

function text(max: number, rules: TextRules = {}) {
    const base = z.string().trim().max(max, `Máximo ${max} caracteres`)
    const checked = rules.optional ? base : base.min(1, rules.required ?? 'Completa este campo')
    return checked.superRefine((value, context) => {
        const unknown = findUnknownPlaceholder(value, rules.placeholders)
        if (unknown) {
            context.addIssue({
                code: 'custom',
                message: rules.placeholders?.length
                    ? `${unknown} no existe. Puedes usar ${placeholderList(rules.placeholders)}.`
                    : `Este campo no admite marcadores como ${unknown}.`,
            })
            return
        }
        if (rules.highlights && hasBrokenHighlights(value)) {
            context.addIssue({
                code: 'custom',
                message: 'Falta cerrar un destacado o hay uno vacío. Márcalo así: *palabras*.',
            })
        }
    })
}

interface ListSize {
    min: number
    max: number
}

/** `one` names a single item with its article: "un anuncio", "una pregunta". */
function list<T extends z.ZodType>(item: T, size: ListSize, one: string) {
    return z
        .array(item)
        .min(size.min, `Agrega al menos ${size.min === 1 ? one : size.min}`)
        .max(size.max, `Máximo ${size.max}`)
}

/** A list of plain texts; `the` names an item for the empty message: "el anuncio". */
function textList(
    max: number,
    size: ListSize,
    names: { one: string; the: string },
    rules: TextRules = {},
) {
    const item = text(max, { required: `Escribe ${names.the} o elimínalo`, ...rules })
    return list(z.object({ value: item }), size, names.one)
}

/** At most two decimals, checked on the text form to dodge floating-point noise. */
function hasTwoDecimalsAtMost(value: number): boolean {
    return /^\d+(\.\d{1,2})?$/.test(String(value))
}

function money(requiredMessage: string) {
    return z
        .number({ error: requiredMessage })
        .min(0, 'No puede ser negativo')
        .max(CONTENT_MAX_MONEY, 'El monto es demasiado alto')
        .refine(hasTwoDecimalsAtMost, 'Usa como máximo dos decimales')
}

function pattern(regex: RegExp, message: string, max: number) {
    return z.string().trim().max(max, `Máximo ${max} caracteres`).regex(regex, message)
}

/** Handles are stored without "@"; typing it is harmless. */
const handle = z
    .string()
    .trim()
    // 30 characters plus an optional leading "@".
    .max(31, 'Hasta 30 caracteres')
    .transform((value) => value.replace(/^@+/, ''))
    .pipe(
        z
            .string()
            .regex(
                SOCIAL_HANDLE_PATTERN,
                'Solo letras, números, puntos y guiones bajos, hasta 30 caracteres',
            ),
    )

const L = CONTENT_LIMITS
const PHONE_MESSAGE = 'Usa el formato 0412-5550134'

type TextItem = { value: string }
const toItems = (values: string[]): TextItem[] => values.map((value) => ({ value }))
const fromItems = (items: TextItem[]): string[] => items.map((item) => item.value)

/* ---------------------------------------------------------------- General */

export const generalSchema = z.object({
    brandName: text(L.brandName),
    tagline: text(L.tagline),
    description: text(L.text),
    titleSuffix: text(L.titleSuffix, { optional: true }),
    metaDescription: text(L.metaDescription, { placeholders: ['envioGratis'] }),
    searchPlaceholder: text(L.searchPlaceholder),
})
export type GeneralFormValues = z.infer<typeof generalSchema>

/* ------------------------------------------------------------------- Home */

const title = () => text(L.title, { highlights: true })

export const homeSchema = z.object({
    heroBadge: text(L.label),
    heroTitle: title(),
    heroSubtitle: text(L.text),
    heroPrimaryCta: text(L.label),
    heroSecondaryCta: text(L.label),
    heroFeatures: textList(L.label, CONTENT_LIST_SIZES.heroFeatures, {
        one: 'una ventaja',
        the: 'la ventaja',
    }),
    categoriesEyebrow: text(L.label),
    categoriesTitle: title(),
    categoriesDescription: text(L.text, { placeholders: ['categorias'] }),
    featuredEyebrow: text(L.label),
    featuredTitle: title(),
    featuredDescription: text(L.text),
    featuredCta: text(L.label),
    stepsEyebrow: text(L.label),
    stepsTitle: title(),
    stepsDescription: text(L.shortText, { optional: true }),
    steps: list(
        z.object({ title: text(L.itemTitle), description: text(L.text) }),
        CONTENT_LIST_SIZES.steps,
        'una razón',
    ),
    testimonialsEyebrow: text(L.label),
    testimonialsTitle: title(),
    testimonials: list(
        z.object({
            quote: text(L.testimonialQuote, { required: 'Escribe la opinión o elimínala' }),
            name: text(L.testimonialName, { required: 'Escribe el nombre del cliente' }),
            city: text(L.city, { optional: true }),
            product: text(L.testimonialProduct, { optional: true }),
        }),
        CONTENT_LIST_SIZES.testimonials,
        'una opinión',
    ),
    ctaBadge: text(L.label),
    ctaTitle: title(),
    ctaDescription: text(L.text),
    ctaPrimary: text(L.label),
    ctaSecondary: text(L.label),
})
export type HomeFormValues = z.infer<typeof homeSchema>

/* ------------------------------------------------------------------ About */

export const ABOUT_PLACEHOLDERS = ['marca', 'ciudad'] as const

export const aboutSchema = z.object({
    badge: text(L.label),
    title: title(),
    paragraphs: textList(
        L.paragraph,
        CONTENT_LIST_SIZES.paragraphs,
        { one: 'un párrafo', the: 'el párrafo' },
        {
            placeholders: ABOUT_PLACEHOLDERS,
        },
    ),
    ctaLabel: text(L.label),
    imageBadge: text(L.label),
    valuesEyebrow: text(L.label),
    valuesTitle: title(),
    valuesDescription: text(L.shortText, { optional: true }),
    values: list(
        z.object({
            icon: z.enum(ABOUT_VALUE_ICONS, { error: 'Elige un ícono' }),
            title: text(L.itemTitle),
            description: text(L.text),
        }),
        CONTENT_LIST_SIZES.values,
        'un valor',
    ),
    statsEyebrow: text(L.label),
    statsTitle: title(),
    stats: list(
        z.object({ value: text(L.statValue), label: text(L.label) }),
        CONTENT_LIST_SIZES.stats,
        'una cifra',
    ),
})
export type AboutFormValues = z.infer<typeof aboutSchema>

/* ---------------------------------------------------------------- Contact */

export const contactSchema = z.object({
    email: z
        .string()
        .trim()
        .max(L.email, `Máximo ${L.email} caracteres`)
        .pipe(z.email('Escribe un correo válido, por ejemplo hola@correo.com')),
    phone: pattern(VE_PHONE_PATTERN, PHONE_MESSAGE, 12),
    whatsapp: mobilePhoneSchema({ required: 'Escribe el número de WhatsApp' }),
    city: text(L.city),
    schedule: text(L.schedule),
    instagram: handle,
    tiktok: handle,
})
export type ContactFormValues = z.input<typeof contactSchema>

/* ----------------------------------------------------------- Contact page */

export const FAQ_PLACEHOLDERS = ['envioGratis', 'tarifaEnvio', 'despacho'] as const

export const contactPageSchema = z.object({
    badge: text(L.label),
    title: title(),
    intro: text(L.text),
    faqEyebrow: text(L.label),
    faqTitle: title(),
    faq: list(
        z.object({
            question: text(L.question, { placeholders: FAQ_PLACEHOLDERS }),
            answer: text(L.paragraph, { placeholders: FAQ_PLACEHOLDERS }),
        }),
        CONTENT_LIST_SIZES.faq,
        'una pregunta',
    ),
})
export type ContactPageFormValues = z.infer<typeof contactPageSchema>

/* --------------------------------------------------------------- Shipping */

export const shippingSchema = z.object({
    freeThreshold: money('Escribe el monto para envío gratis'),
    flatRate: money('Escribe la tarifa de envío'),
    freeShippingCopy: text(L.shippingCopy, { placeholders: ['envioGratis'] }),
    dispatchCopy: text(L.shippingCopy),
})
export type ShippingFormValues = z.input<typeof shippingSchema>

/* ---------------------------------------------------------------- Payment */

/** A plain text field of a payment method; whether it is required depends on `enabled`. */
function methodText(max: number) {
    return z.string().trim().max(max, `Máximo ${max} caracteres`)
}

type IssueAdder = (field: string, message: string) => void

function issueAdder(context: z.RefinementCtx): IssueAdder {
    return (field, message) => context.addIssue({ code: 'custom', path: [field], message })
}

/**
 * Checks a filled field's format always, and its presence only when the method is enabled:
 * a disabled method may be left half-filled.
 */
function checkField(
    add: IssueAdder,
    enabled: boolean,
    field: string,
    value: string,
    rule: { required: string; pattern?: RegExp; message?: string },
): void {
    if (value === '') {
        if (enabled) add(field, rule.required)
        return
    }
    if (rule.pattern && !rule.pattern.test(value)) add(field, rule.message ?? rule.required)
}

const pagoMovilSchema = z
    .object({
        enabled: z.boolean(),
        bankCode: z.string(),
        bankName: methodText(L.bankName),
        phone: z.string().trim(),
        idNumber: z.string().trim().toUpperCase(),
        holderName: methodText(L.holderName),
    })
    .superRefine((method, context) => {
        const add = issueAdder(context)
        checkField(add, method.enabled, 'bankCode', method.bankCode, {
            required: 'Elige el banco',
            pattern: BANK_CODE_PATTERN,
        })
        checkField(add, method.enabled, 'phone', method.phone, {
            required: 'Escribe el teléfono de Pago Móvil',
            pattern: VE_MOBILE_PATTERN,
            message: 'Usa un celular con el formato 0412-5550134',
        })
        checkField(add, method.enabled, 'idNumber', method.idNumber, {
            required: 'Escribe la cédula o RIF',
            pattern: ID_NUMBER_PATTERN,
            message: ID_NUMBER_MESSAGE,
        })
        checkField(add, method.enabled, 'holderName', method.holderName, {
            required: 'Escribe el nombre del titular',
        })
    })

const transferSchema = z
    .object({
        enabled: z.boolean(),
        bankCode: z.string(),
        bankName: methodText(L.bankName),
        accountNumber: z.string().trim(),
        accountType: z.enum(BANK_ACCOUNT_TYPES),
        idNumber: z.string().trim().toUpperCase(),
        holderName: methodText(L.holderName),
    })
    .superRefine((method, context) => {
        const add = issueAdder(context)
        checkField(add, method.enabled, 'bankCode', method.bankCode, {
            required: 'Elige el banco',
            pattern: BANK_CODE_PATTERN,
        })
        checkField(add, method.enabled, 'accountNumber', method.accountNumber, {
            required: 'Escribe el número de cuenta',
            pattern: ACCOUNT_NUMBER_PATTERN,
            message: 'El número de cuenta tiene 20 dígitos',
        })
        checkField(add, method.enabled, 'idNumber', method.idNumber, {
            required: 'Escribe la cédula o RIF',
            pattern: ID_NUMBER_PATTERN,
            message: ID_NUMBER_MESSAGE,
        })
        checkField(add, method.enabled, 'holderName', method.holderName, {
            required: 'Escribe el nombre del titular',
        })
    })

const zelleSchema = z
    .object({
        enabled: z.boolean(),
        email: methodText(L.email),
        holderName: methodText(L.holderName),
    })
    .superRefine((method, context) => {
        const add = issueAdder(context)
        checkField(add, method.enabled, 'email', method.email, {
            required: 'Escribe el correo de Zelle',
            pattern: EMAIL_PATTERN,
            message: 'Escribe un correo válido, por ejemplo pagos@empresa.com',
        })
        checkField(add, method.enabled, 'holderName', method.holderName, {
            required: 'Escribe el nombre del titular',
        })
    })

const binanceSchema = z
    .object({
        enabled: z.boolean(),
        payId: methodText(L.payId),
        email: methodText(L.email),
        holderName: methodText(L.holderName),
    })
    .superRefine((method, context) => {
        const add = issueAdder(context)
        checkField(add, method.enabled, 'payId', method.payId, {
            required: 'Escribe el Binance Pay ID',
            pattern: PAY_ID_PATTERN,
            message: 'Solo letras y números (4 a 64)',
        })
        checkField(add, false, 'email', method.email, {
            required: '',
            pattern: EMAIL_PATTERN,
            message: 'Escribe un correo válido, por ejemplo pagos@empresa.com',
        })
    })

export const paymentSchema = z.object({
    instructions: text(L.instructions, { optional: true }),
    pagoMovil: pagoMovilSchema,
    transfer: transferSchema,
    zelle: zelleSchema,
    binance: binanceSchema,
})
export type PaymentFormValues = z.input<typeof paymentSchema>

/* ------------------------------------------------------------- Converters */

/** How one section maps between the stored value and its form. */
export interface SectionFormConfig<K extends ContentSection, F> {
    section: K
    schema: z.ZodType
    toForm: (value: SiteContent[K]) => F
    toValue: (form: F) => SiteContent[K]
}

/** Sections whose form holds the stored value as-is. */
function sameShape<K extends ContentSection, F>(
    section: K,
    schema: z.ZodType,
): SectionFormConfig<K, F> {
    return {
        section,
        schema,
        toForm: (value) => value as unknown as F,
        toValue: (form) => form as unknown as SiteContent[K],
    }
}

const homeForm: SectionFormConfig<'home', HomeFormValues> = {
    section: 'home',
    schema: homeSchema,
    toForm: (value) => ({ ...value, heroFeatures: toItems(value.heroFeatures) }),
    toValue: (form) => ({ ...form, heroFeatures: fromItems(form.heroFeatures) }),
}

const aboutForm: SectionFormConfig<'about', AboutFormValues> = {
    section: 'about',
    schema: aboutSchema,
    toForm: (value) => ({ ...value, paragraphs: toItems(value.paragraphs) }),
    toValue: (form) => ({ ...form, paragraphs: fromItems(form.paragraphs) }),
}

export const SECTION_FORMS = {
    general: sameShape<'general', GeneralFormValues>('general', generalSchema),
    home: homeForm,
    about: aboutForm,
    contact: sameShape<'contact', ContactFormValues>('contact', contactSchema),
    contactPage: sameShape<'contactPage', ContactPageFormValues>('contactPage', contactPageSchema),
    shipping: sameShape<'shipping', ShippingFormValues>('shipping', shippingSchema),
    payment: sameShape<'payment', PaymentFormValues>('payment', paymentSchema),
} as const
