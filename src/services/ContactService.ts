import { apiClient } from '@/services/ApiClient'

export interface ContactMessageInput {
    name: string
    email: string
    /** "0424-1234567"; left out when empty. */
    phone?: string
    /** Code of an active topic (`GET /catalogs/contact-options`). */
    topic: string
    /** Code of an active space type; left out when not chosen. */
    spaceType?: string
    /** Square meters of the space (1–5000). */
    areaM2?: number
    /** The product the customer asks about (from "Solicitar asesoría" on its page). */
    productSlug?: string
    message: string
    /** Honeypot: always "" for people. */
    website: string
}

/** The storefront's advisory and contact form ("Asesoría y contacto"). */
export const ContactService = {
    /** Resolves once the message is on its way to the store; rejects with the `ApiError`. */
    send: (input: ContactMessageInput) =>
        apiClient.post<{ message: string }>('/contact', {
            ...input,
            phone: input.phone || undefined,
            productSlug: input.productSlug || undefined,
        }),
} as const
