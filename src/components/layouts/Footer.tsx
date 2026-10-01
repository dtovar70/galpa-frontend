import { Link } from 'react-router'

import { BrandLogo } from '@/components/layouts/BrandLogo'
import { appConfig } from '@/configs/app.config'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { socialLinks } from '@/utils/content'
import { useCategoryLinks } from '@/utils/hooks/useNavLinks'
import { useShippingContent, useSiteContent } from '@/utils/hooks/useSiteContent'

const CATALOG_LINK = { label: 'Todo el catálogo', to: ROUTES.catalog }

const HELP_LINKS = [
    { label: 'Nosotros', to: ROUTES.about },
    { label: 'Contacto', to: ROUTES.contact },
    { label: 'Carrito', to: ROUTES.cart },
    { label: 'Checkout', to: ROUTES.checkout },
    { label: 'Mis pedidos', to: ROUTES.myOrders },
    { label: 'Consultar pedido', to: ROUTES.orderLookup },
]

const linkClass = 'text-sm text-ink-soft transition hover:text-blush-700'

export function Footer() {
    const productLinks = [...useCategoryLinks(appConfig.categoryLinkLimits.footer), CATALOG_LINK]
    const { general, contact } = useSiteContent()
    const { productionCopy } = useShippingContent()
    // Split so the address can wrap after the "@" in the narrow two-column footer on phones.
    const [emailUser, emailDomain] = contact.email.split('@')

    return (
        <footer className="mt-20 border-t border-line bg-white">
            <div
                className={cn(
                    CONTAINER,
                    'flex flex-col gap-12 py-14 md:flex-row md:items-start md:justify-between',
                )}
            >
                <div className="max-w-sm space-y-4">
                    <BrandLogo withTagline />
                    <p className="max-w-xs text-sm text-ink-soft">{general.description}</p>
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

                <div className="grid grid-cols-2 gap-10 sm:gap-16 lg:gap-24">
                    <nav aria-labelledby="footer-products" className="space-y-4">
                        <h2 id="footer-products" className="font-display text-base text-ink">
                            Productos
                        </h2>
                        <ul className="space-y-2">
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
                        <h2 id="footer-help" className="font-display text-base text-ink">
                            Ayuda
                        </h2>
                        <ul className="space-y-2">
                            {HELP_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className={linkClass}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li className="text-sm text-ink-soft">{contact.schedule}</li>
                            <li>
                                <a href={`mailto:${contact.email}`} className={linkClass}>
                                    {emailUser}@
                                    <wbr />
                                    {emailDomain}
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="border-t border-line">
                <div
                    className={cn(
                        CONTAINER,
                        'flex flex-col gap-2 py-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between',
                    )}
                >
                    <p>
                        © {new Date().getFullYear()} {general.brandName}. Todos los derechos
                        reservados.
                    </p>
                    <p>
                        {contact.city} · {productionCopy}
                    </p>
                </div>
            </div>
        </footer>
    )
}
