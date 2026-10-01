import { apiClient } from '@/services/ApiClient'
import type { ContactTopic, SpaceType } from '@/views/contact/schema/contact.schema'

export interface ContactMessageInput {
    fullName: string
    email: string
    /** "0424-1234567"; left out when empty. */
    phone?: string
    topic: ContactTopic
    spaceType?: SpaceType
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
