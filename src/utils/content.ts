import {
    PUBLIC_CONTENT_SECTIONS,
    type ContactContent,
    type ContentPlaceholder,
    type ContentSection,
    type PublicSiteContent,
    type SiteContent,
} from '@/@types/content'
import { DEFAULT_SITE_CONTENT } from '@/configs/content.defaults'
import { formatCurrency } from '@/utils/formatCurrency'

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sameKind(value: unknown, fallback: unknown): boolean {
    if (Array.isArray(fallback)) return Array.isArray(value)
    return typeof value === typeof fallback && value !== null
}

/**
 * `stored` over `defaults`, field by field. Nested objects (the payment methods) are merged the
 * same way, so a partial or older payload never leaves a method without one of its fields.
 */
function mergeFields(defaults: object, stored: Record<string, unknown>): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...defaults }
    for (const [field, fallback] of Object.entries(defaults)) {
        const value = stored[field]
        if (value === undefined || !sameKind(value, fallback)) continue
        merged[field] =
            isPlainObject(fallback) && isPlainObject(value) ? mergeFields(fallback, value) : value
    }
    return merged
}

/** One section over its defaults, field by field (same rule as the API's `mergeSection`). */
export function resolveSection<K extends ContentSection>(
    section: K,
    stored: unknown,
): SiteContent[K] {
    const defaults = DEFAULT_SITE_CONTENT[section]
    if (!isPlainObject(stored)) return defaults
    return mergeFields(defaults, stored) as unknown as SiteContent[K]
}

/**
 * The API already merges stored values over the defaults; doing it again here keeps the
 * storefront whole against an older API or a partial payload.
 */
export function resolveSiteContent(raw: unknown): PublicSiteContent {
    const source = isPlainObject(raw) ? raw : {}
    return Object.fromEntries(
        PUBLIC_CONTENT_SECTIONS.map((section) => [
            section,
            resolveSection(section, source[section]),
        ]),
    ) as unknown as PublicSiteContent
}

/** "$35" for whole amounts (as the copy always read), "$35,50" otherwise. */
export function formatShortMoney(amount: number): string {
    return Number.isInteger(amount) ? `$${amount.toLocaleString('es-VE')}` : formatCurrency(amount)
}

export type PlaceholderValues = Partial<Record<ContentPlaceholder, string>>

/** Values of the placeholders that come from the content itself. */
export function placeholderValues(content: PublicSiteContent): PlaceholderValues {
    return {
        envioGratis: formatShortMoney(content.shipping.freeThreshold),
        tarifaEnvio: formatShortMoney(content.shipping.flatRate),
        despacho: content.shipping.dispatchCopy,
        marca: content.general.brandName,
        ciudad: content.contact.city,
    }
}

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g

/** Replaces the known `{placeholders}`; unknown ones are left as typed. */
export function fillPlaceholders(text: string, values: PlaceholderValues): string {
    return text.replace(PLACEHOLDER_PATTERN, (token, name: string) => {
        const value = values[name as ContentPlaceholder]
        return value ?? token
    })
}

const SENTENCE_START = /(^|[.!?¡¿]\s*)$/

/**
 * Like `fillPlaceholders`, but lowercases the first letter of a value that lands mid-sentence
 * ("{categorias}" -> "Tres formatos" at the start, "tres formatos" after other words).
 */
export function fillPlaceholdersInSentence(text: string, values: PlaceholderValues): string {
    return text.replace(PLACEHOLDER_PATTERN, (token, name: string, offset: number) => {
        const value = values[name as ContentPlaceholder]
        if (value === undefined) return token
        const startsSentence = SENTENCE_START.test(text.slice(0, offset))
        return startsSentence ? value : value.charAt(0).toLowerCase() + value.slice(1)
    })
}

export interface TextSegment {
    text: string
    highlighted: boolean
}

/**
 * "Tu *confort*" -> [{ "Tu " }, { "confort", highlighted }]. A lone asterisk (the API
 * rejects them, but the preview sees them while typing) is kept as a literal character.
 */
export function splitHighlights(text: string): TextSegment[] {
    const parts = text.split('*')
    if (parts.length % 2 === 0) {
        const last = parts.pop() ?? ''
        parts[parts.length - 1] = `${parts.at(-1) ?? ''}*${last}`
    }
    return parts
        .map((part, index) => ({ text: part, highlighted: index % 2 === 1 }))
        .filter((segment) => segment.text !== '')
}

/** Text without the highlight marks, for `aria-label`s, titles and the like. */
export function stripHighlights(text: string): string {
    return splitHighlights(text)
        .map((segment) => segment.text)
        .join('')
}

const COUNT_WORDS = [
    'Una',
    'Dos',
    'Tres',
    'Cuatro',
    'Cinco',
    'Seis',
    'Siete',
    'Ocho',
    'Nueve',
    'Diez',
]

/** What `{categorias}` renders: "Cuatro líneas", "Una línea", "Varias líneas". */
export function categoryCountPhrase(count: number | undefined): string {
    if (count === undefined || count === 0) return 'Varias líneas'
    if (count === 1) return 'Una línea'
    return `${COUNT_WORDS[count - 1] ?? 'Varias'} líneas`
}

const VE_PHONE = /^0(\d{3})-(\d{3})(\d{4})$/

/** "0412-5550134" -> "+58 412 555 0134". Anything else is returned as typed. */
export function formatVePhone(phone: string): string {
    const match = VE_PHONE.exec(phone)
    return match ? `+58 ${match[1]} ${match[2]} ${match[3]}` : phone
}

/** Digits in international format, without "+": "0412-5550134" -> "584125550134". */
function internationalDigits(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    return digits.startsWith('0') ? `58${digits.slice(1)}` : digits
}

export function phoneHref(phone: string): string {
    return `tel:+${internationalDigits(phone)}`
}

/** wa.me link; `message` pre-fills the chat (e.g. the product name or the order code). */
export function whatsappUrl(phone: string, message?: string): string {
    const base = `https://wa.me/${internationalDigits(phone)}`
    return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export interface SocialLink {
    label: string
    handle: string
    href: string
}

/** Footer links; a network without a handle is left out. */
export function socialLinks(contact: ContactContent): SocialLink[] {
    const links: SocialLink[] = []
    if (contact.instagram) {
        links.push({
            label: 'Instagram',
            handle: `@${contact.instagram}`,
            href: `https://instagram.com/${contact.instagram}`,
        })
    }
    if (contact.tiktok) {
        links.push({
            label: 'TikTok',
            handle: `@${contact.tiktok}`,
            href: `https://tiktok.com/@${contact.tiktok}`,
        })
    }
    if (contact.whatsapp) {
        links.push({
            label: 'WhatsApp',
            handle: formatVePhone(contact.whatsapp),
            href: whatsappUrl(contact.whatsapp),
        })
    }
    return links
}

/** Same rule the cart and checkout always used: free at or above the threshold. */
export function shippingCost(subtotal: number, shipping: SiteContent['shipping']): number {
    return subtotal >= shipping.freeThreshold ? 0 : shipping.flatRate
}

/** First `{…}` token in `text` that is not in `allowed` (same rule as the API). */
export function findUnknownPlaceholder(
    text: string,
    allowed: readonly ContentPlaceholder[] = [],
): string | undefined {
    for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
        if (!(allowed as readonly string[]).includes(match[1] ?? '')) return match[0]
    }
    return undefined
}

/** An odd number of asterisks leaves a highlight open; `**` is an empty one. */
export function hasBrokenHighlights(text: string): boolean {
    const parts = text.split('*')
    if (parts.length % 2 === 0) return true
    return parts.some((part, index) => index % 2 === 1 && part.trim() === '')
}
