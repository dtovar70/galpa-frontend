import type { ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'

import { cn } from '@/utils/cn'
import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export interface WhatsAppNoticeProps {
    title: string
    children: ReactNode
    className?: string
    /** Pre-filled chat message, e.g. with the order code. */
    message?: string
}

/**
 * Friendly dead end with a way out: when the checkout cannot run (no BCV rate, no payment method
 * details), or an order cannot move on by itself, the customer can still reach us on WhatsApp.
 */
export function WhatsAppNotice({ title, children, className, message }: WhatsAppNoticeProps) {
    const { contact } = useSiteContent()

    return (
        <div
            role="status"
            className={cn(
                'space-y-3 rounded-2xl border border-warning-200 bg-warning-50 p-5 text-ink',
                className,
            )}
        >
            <p className="text-lg font-bold">{title}</p>
            <div className="text-sm text-ink-soft">{children}</div>
            {contact.whatsapp ? (
                <a
                    href={whatsappUrl(contact.whatsapp, message)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#128c7e] px-5 text-sm font-semibold text-white transition hover:bg-[#0b6f63] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    Escríbenos por WhatsApp
                </a>
            ) : null}
        </div>
    )
}
