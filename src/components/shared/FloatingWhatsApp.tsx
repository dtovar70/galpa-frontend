import { MessageCircle } from 'lucide-react'
import { matchPath, useLocation } from 'react-router'

import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

/** Pages with their own bottom bar on phones: the button hides there below `lg`. */
const STICKY_BAR_ROUTES = [ROUTES.checkout, ROUTES.order, ROUTES.product]

/**
 * The store's WhatsApp, always one tap away (bottom-right on every public page). Hidden when
 * no number is configured.
 */
export function FloatingWhatsApp() {
    const { contact } = useSiteContent()
    const { pathname } = useLocation()
    if (!contact.whatsapp) return null

    const overlapsStickyBar = STICKY_BAR_ROUTES.some((route) => matchPath(route, pathname))

    return (
        <a
            href={whatsappUrl(contact.whatsapp, 'Hola, quisiera asesoría sobre un equipo.')}
            target="_blank"
            rel="noreferrer"
            aria-label="Escríbenos por WhatsApp"
            className={cn(
                'group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-[#128c7e] text-white shadow-lift ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-[#0b6f63] focus-visible:ring-brand-500 motion-reduce:transform-none sm:right-6 sm:bottom-6',
                overlapsStickyBar && 'max-lg:hidden',
            )}
        >
            <MessageCircle aria-hidden="true" className="size-7" />
            <span className="pointer-events-none absolute right-full mr-3 hidden rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block">
                ¿Hablamos por WhatsApp?
            </span>
        </a>
    )
}
