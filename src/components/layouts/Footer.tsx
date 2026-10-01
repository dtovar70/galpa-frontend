import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router'

import { BrandLogo } from '@/components/layouts/BrandLogo'
import { appConfig } from '@/configs/app.config'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { formatVePhone, phoneHref, socialLinks } from '@/utils/content'
import { useCategoryLinks } from '@/utils/hooks/useNavLinks'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

const CATALOG_LINK = { label: 'Todo el catálogo', to: ROUTES.catalog }

const HELP_LINKS = [
    { label: 'Nosotros', to: ROUTES.about },
    { label: 'Asesoría y contacto', to: ROUTES.contact },
    { label: 'Carrito', to: ROUTES.cart },
    { label: 'Mis pedidos', to: ROUTES.myOrders },
    { label: 'Consultar pedido', to: ROUTES.orderLookup },
]

const linkClass = 'text-sm text-white/65 transition hover:text-brand-300'
const headingClass = 'text-xs font-bold tracking-[0.16em] text-white uppercase'

export function Footer() {
    const productLinks = [...useCategoryLinks(appConfig.categoryLinkLimits.footer), CATALOG_LINK]
    const { general, contact } = useSiteContent()
    // Split so the address can wrap after the "@" in narrow columns.
    const [emailUser, emailDomain] = contact.email.split('@')

    return (
        <footer className="mt-20 bg-ink text-white">
            <div
                className={cn(
                    CONTAINER,
                    'grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]',
                )}
            >
                <div className="max-w-sm space-y-5">
                    <BrandLogo withTagline />
                    <p className="text-sm leading-relaxed text-white/65">{general.description}</p>
                    <ul className="space-y-1.5">
                        {socialLinks(contact).map((social) => (
                            <li key={social.label}>
                                <a
                                    href={social.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={linkClass}
                                >
                                    {social.label} · {social.handle}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <nav aria-labelledby="footer-products" className="space-y-4">
                    <h2 id="footer-products" className={headingClass}>
                        Productos
                    </h2>
                    <ul className="space-y-2.5">
                        {productLinks.map((link) => (
                            <li key={link.to}>
                                <Link to={link.to} className={linkClass}>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-labelledby="footer-help" className="space-y-4">
                    <h2 id="footer-help" className={headingClass}>
                        Ayuda
                    </h2>
                    <ul className="space-y-2.5">
                        {HELP_LINKS.map((link) => (
                            <li key={link.to}>
                                <Link to={link.to} className={linkClass}>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="space-y-4">
                    <h2 className={headingClass}>Contacto</h2>
                    <ul className="space-y-3 text-sm text-white/65">
                        {contact.phone ? (
                            <li className="flex items-start gap-2.5">
                                <Phone
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 text-brand-400"
                                />
                                <a href={phoneHref(contact.phone)} className={linkClass}>
                                    {formatVePhone(contact.phone)}
                                </a>
                            </li>
                        ) : null}
                        <li className="flex items-start gap-2.5">
                            <Mail aria-hidden="true" className="mt-0.5 size-4 text-brand-400" />
                            <a href={`mailto:${contact.email}`} className={linkClass}>
                                {emailUser}@
                                <wbr />
                                {emailDomain}
                            </a>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <MapPin aria-hidden="true" className="mt-0.5 size-4 text-brand-400" />
                            {contact.city}
                        </li>
                        <li className="flex items-start gap-2.5">
                            <Clock aria-hidden="true" className="mt-0.5 size-4 text-brand-400" />
                            {contact.schedule}
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div
                    className={cn(
                        CONTAINER,
                        'flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between',
                    )}
                >
                    <p>
                        © {new Date().getFullYear()} {general.brandName}. Todos los derechos
                        reservados.
                    </p>
                    <p>{general.tagline}</p>
                </div>
            </div>
        </footer>
    )
}
