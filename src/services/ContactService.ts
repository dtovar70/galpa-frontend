import type { ContactTopic } from '@/views/contact/schema/contact.schema'
import { apiClient } from '@/services/ApiClient'

export interface ContactMessageInput {
    fullName: string
    email: string
    /** "0424-1234567"; left out when empty. */
    phone?: string
    topic: ContactTopic
    message: string
    /** Honeypot: always "" for people. */
    website: string
}

/** The storefront's contact form ("Escríbenos"). */
export const ContactService = {
    /** Resolves once the message is on its way to the store; rejects with the `ApiError`. */
    send: (input: ContactMessageInput) =>
        apiClient.post<{ message: string }>('/contact', {
            ...input,
            phone: input.phone || undefined,
        }),
} as const
