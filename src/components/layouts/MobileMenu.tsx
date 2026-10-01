import { cva } from 'class-variance-authority'
import { NavLink } from 'react-router'

import { ButtonLink, Drawer } from '@/components/ui'
import { SearchField } from '@/components/layouts/SearchField'
import { ROUTES } from '@/constants/route.constant'
import { useMobileMenu } from '@/store/uiStore'
import { useNavLinks } from '@/utils/hooks/useNavLinks'
import { useShippingContent } from '@/utils/hooks/useSiteContent'

const mobileLinkVariants = cva(
    'block rounded-2xl px-4 py-3 font-display text-lg transition duration-200',
    {
        variants: {
            isActive: {
                true: 'bg-blush-100 text-blush-700',
                false: 'text-ink hover:bg-blush-50',
            },
        },
        defaultVariants: { isActive: false },
    },
)

const ORDER_LINKS = [
    { label: 'Mis pedidos', to: ROUTES.myOrders },
    { label: 'Consultar un pedido', to: ROUTES.orderLookup },
] as const

export function MobileMenu() {
    const { isOpen, close } = useMobileMenu()
    const navLinks = useNavLinks()
    const { freeShippingText } = useShippingContent()

    return (
        <Drawer isOpen={isOpen} onClose={close} title="Menú" side="left">
            <div className="space-y-6">
                <SearchField onNavigate={close} />

                <nav aria-label="Navegación móvil">
                    <ul className="space-y-1">
                        {navLinks.map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    end
                                    onClick={close}
                                    className={({ isActive }) => mobileLinkVariants({ isActive })}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-label="Tus pedidos" className="border-t border-line pt-4">
                    <ul className="space-y-1">
                        {ORDER_LINKS.map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    end
                                    onClick={close}
                                    className={({ isActive }) => mobileLinkVariants({ isActive })}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <ButtonLink to={ROUTES.catalog} fullWidth onClick={close}>
                    Explorar catálogo
                </ButtonLink>

                <p className="text-sm text-ink-soft">{freeShippingText}</p>
            </div>
        </Drawer>
    )
}
