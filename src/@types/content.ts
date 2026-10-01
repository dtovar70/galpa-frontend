/**
 * Editable site content: one JSON value per section, stored in `site_content`.
 *
 * Mirror of backend-galpa/src/content/content.types.ts. Keep both files identical (only the
 * comments that point at each other differ), so the storefront and the API agree on the shape.
 *
 * Text conventions shared by the API and the storefront:
 * - Highlighted words (painted green in headings) are wrapped in asterisks: "Tu *confort*".
 * - Placeholders in braces are replaced when rendered, e.g. "{envioGratis}" -> "$35". Each field
 *   accepts only the placeholders listed in `CONTENT_PLACEHOLDERS`.
 */

export const CONTENT_SECTIONS = [
    'general',
    'announcements',
    'home',
    'about',
    'contact',
    'contactPage',
    'shipping',
    'payment',
] as const

export type ContentSection = (typeof CONTENT_SECTIONS)[number]

export function isContentSection(value: string): value is ContentSection {
    return (CONTENT_SECTIONS as readonly string[]).includes(value)
}

/** Placeholders and what they render. */
export const CONTENT_PLACEHOLDERS = {
    /** Free-shipping threshold, as money: "$35". */
    envioGratis: '{envioGratis}',
    /** Flat shipping rate, as money: "$4". */
    tarifaEnvio: '{tarifaEnvio}',
    /** Number of categories in words: "Cuatro líneas". */
    categorias: '{categorias}',
    /** Brand name of the general section. */
    marca: '{marca}',
    /** City of the contact section. */
    ciudad: '{ciudad}',
} as const

export type ContentPlaceholder = keyof typeof CONTENT_PLACEHOLDERS

/** Icons a brand value on the About page can use (lucide icons on the storefront). */
export const ABOUT_VALUE_ICONS = [
    'palette',
    'heart-handshake',
    'timer',
    'leaf',
    'sparkles',
    'star',
    'truck',
    'shield-check',
] as const

export type AboutValueIcon = (typeof ABOUT_VALUE_ICONS)[number]

export interface GeneralContent {
    brandName: string
    tagline: string
    /** Short description shown in the footer. */
    description: string
    /** document.title is "<brandName> — <titleSuffix>" (just the brand when empty). */
    titleSuffix: string
    /** `<meta name="description">`. Accepts {envioGratis}. */
    metaDescription: string
    searchPlaceholder: string
}

export interface AnnouncementsContent {
    /** Ticker messages, in order. Accept {envioGratis} and {tarifaEnvio}. */
    messages: string[]
}

export interface HomeStep {
    title: string
    description: string
}

/** A real customer review shown on the home page. */
export interface HomeTestimonial {
    quote: string
    name: string
    /** Empty hides it. */
    city: string
    /** What the customer bought, free text. Empty hides it. */
    product: string
}

export interface HomeContent {
    heroBadge: string
    /** Accepts *highlights*. */
    heroTitle: string
    heroSubtitle: string
    heroPrimaryCta: string
    heroSecondaryCta: string
    heroFeatures: string[]
    categoriesEyebrow: string
    categoriesTitle: string
    /** Accepts {categorias}. */
    categoriesDescription: string
    featuredEyebrow: string
    featuredTitle: string
    featuredDescription: string
    featuredCta: string
    stepsEyebrow: string
    stepsTitle: string
    stepsDescription: string
    steps: HomeStep[]
    testimonialsEyebrow: string
    testimonialsTitle: string
    /** Real reviews, in order. Empty hides the whole section. */
    testimonials: HomeTestimonial[]
    ctaBadge: string
    ctaTitle: string
    ctaDescription: string
    ctaPrimary: string
    ctaSecondary: string
}

export interface AboutValue {
    icon: AboutValueIcon
    title: string
    description: string
}

export interface AboutStat {
    value: string
    label: string
}

export interface AboutContent {
    badge: string
    title: string
    /** Accept {marca} and {ciudad}. The first one is set larger. */
    paragraphs: string[]
    ctaLabel: string
    imageBadge: string
    valuesEyebrow: string
    valuesTitle: string
    valuesDescription: string
    values: AboutValue[]
    statsEyebrow: string
    statsTitle: string
    stats: AboutStat[]
}

export interface ContactContent {
    email: string
    phone: string
    whatsapp: string
    city: string
    schedule: string
    instagram: string
    tiktok: string
}

export interface FaqItem {
    question: string
    answer: string
}

export interface ContactPageContent {
    badge: string
    title: string
    intro: string
    faqEyebrow: string
    faqTitle: string
    /** Accept {envioGratis} and {tarifaEnvio}. */
    faq: FaqItem[]
}

export interface ShippingContent {
    /** USD. Orders at or above it ship free. */
    freeThreshold: number
    /** USD charged below the threshold. */
    flatRate: number
    /** Accepts {envioGratis}. */
    freeShippingCopy: string
    /** How and when paid orders leave the store ("Despachamos en 24 a 48 horas hábiles"). */
    dispatchCopy: string
}

export interface PagoMovilDetails {
    enabled: boolean
    /** Four-digit bank code, "0102". */
    bankCode: string
    bankName: string
    phone: string
    /** Cédula or RIF, "V-12345678" / "J-123456789". */
    idNumber: string
    holderName: string
}

export const BANK_ACCOUNT_TYPES = ['CORRIENTE', 'AHORRO'] as const
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number]

export interface TransferDetails {
    enabled: boolean
    bankCode: string
    bankName: string
    /** 20 digits. */
    accountNumber: string
    accountType: BankAccountType
    idNumber: string
    holderName: string
}

export interface ZelleDetails {
    enabled: boolean
    email: string
    holderName: string
}

export interface BinanceDetails {
    enabled: boolean
    /** Binance Pay ID. */
    payId: string
    email: string
    holderName: string
}

export interface PaymentContent {
    /** General note shown with every method. */
    instructions: string
    pagoMovil: PagoMovilDetails
    transfer: TransferDetails
    zelle: ZelleDetails
    binance: BinanceDetails
}

export interface SiteContent {
    general: GeneralContent
    announcements: AnnouncementsContent
    home: HomeContent
    about: AboutContent
    contact: ContactContent
    contactPage: ContactPageContent
    shipping: ShippingContent
    payment: PaymentContent
}

function filled(...values: string[]): boolean {
    return values.every((value) => value.trim() !== '')
}

/** A method is offered when it is enabled and every field the customer needs is filled. */
export const PAYMENT_METHOD_CONFIGURED = {
    PAGO_MOVIL: ({ pagoMovil: m }: PaymentContent) =>
        m.enabled && filled(m.bankCode, m.bankName, m.phone, m.idNumber, m.holderName),
    TRANSFERENCIA: ({ transfer: m }: PaymentContent) =>
        m.enabled && filled(m.bankCode, m.bankName, m.accountNumber, m.idNumber, m.holderName),
    ZELLE: ({ zelle: m }: PaymentContent) => m.enabled && filled(m.email, m.holderName),
    BINANCE: ({ binance: m }: PaymentContent) => m.enabled && filled(m.payId, m.holderName),
} as const
