import { cva } from 'class-variance-authority'
import { Menu, Package, ShoppingBag } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router'

import { BrandLogo } from '@/components/layouts/BrandLogo'
import { HeaderIconButton } from '@/components/layouts/HeaderIconButton'
import { SearchField } from '@/components/layouts/SearchField'
import { Tooltip } from '@/components/ui'
import { appConfig } from '@/configs/app.config'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { useCartCount } from '@/store/cartStore'
import { useCartDrawer, useMobileMenu } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { useNavLinks } from '@/utils/hooks/useNavLinks'

const navLinkVariants = cva(
    'rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition duration-200',
    {
        variants: {
            isActive: {
                true: 'bg-blush-100 text-blush-700',
                false: 'text-ink-soft hover:bg-white hover:text-ink',
            },
        },
        defaultVariants: { isActive: false },
    },
)

export function Header() {
    const cartCount = useCartCount()
    const cartDrawer = useCartDrawer()
    const mobileMenu = useMobileMenu()
    const navigate = useNavigate()
    const navLinks = useNavLinks(appConfig.categoryLinkLimits.header)

    return (
        <header className="sticky top-0 z-40 border-b border-line bg-cream/80 backdrop-blur">
            <div className={cn(CONTAINER, 'flex h-16 items-center gap-3 lg:h-20 lg:gap-6')}>
                <BrandLogo />

                <nav
                    aria-label="Navegación principal"
                    className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
                >
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            className={({ isActive }) => navLinkVariants({ isActive })}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <SearchField className="hidden w-64 xl:block" />

                    {/* Phones reach it from the menu drawer, keeping the bar to two buttons. */}
                    <Tooltip label="Mis pedidos" className="hidden sm:inline-flex">
                        <HeaderIconButton
                            onClick={() => navigate(ROUTES.myOrders)}
                            label="Mis pedidos"
                            icon={<Package aria-hidden="true" className="size-5" />}
                        />
                    </Tooltip>

                    <HeaderIconButton
                        onClick={cartDrawer.toggle}
                        label={`Abrir el carrito (${cartCount} artículos)`}
                        icon={<ShoppingBag aria-hidden="true" className="size-5" />}
                        badge={
                            cartCount > 0 ? (
                                <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-blush-700 px-1.5 text-[11px] font-bold text-white tabular-nums">
                                    {cartCount}
                                </span>
                            ) : null
                        }
                    />

                    <HeaderIconButton
                        onClick={mobileMenu.toggle}
                        aria-expanded={mobileMenu.isOpen}
                        label="Abrir el menú"
                        icon={<Menu aria-hidden="true" className="size-5" />}
                        className="lg:hidden"
                    />
                </div>
            </div>
        </header>
    )
}
