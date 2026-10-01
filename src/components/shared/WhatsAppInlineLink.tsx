import type { ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'

import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export interface WhatsAppInlineLinkProps {
    /** Pre-filled chat message (product name, order code…). */
    message: string
    children: ReactNode
}

/**
 * A WhatsApp link inside a sentence, to the business number of the site content. Renders the
 * plain text when no number is configured.
 */
export function WhatsAppInlineLink({ message, children }: WhatsAppInlineLinkProps) {
    const { contact } = useSiteContent()
    if (!contact.whatsapp) return <>{children}</>
    return (
        <a
            href={whatsappUrl(contact.whatsapp, message)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
            <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
            {children}
        </a>
    )
}
