import { useEffect, useState, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import {
    ClipboardList,
    ExternalLink,
    FileText,
    Landmark,
    ListChecks,
    LogOut,
    Menu,
    Package,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    Send,
    Tags,
    Users,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'

import type { AuthUser, UserRole } from '@/@types/admin'
import { RailTooltip } from '@/components/layouts/AdminRailTooltip'
import { ScrollToTop } from '@/components/route/ScrollToTop'
import { BrandMark } from '@/components/shared/BrandMark'
import { Drawer, Spinner } from '@/components/ui'
import { appConfig } from '@/configs/app.config'
import { ADMIN_ROUTES, ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { useAdminOrdersSummary } from '@/views/admin/hooks/useAdminOrders'
import { useLogout, useSession } from '@/views/admin/hooks/useSession'

const ROLE_LABEL: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    EDITOR: 'Editor',
}

/** `roles`: only these roles see the link (every role when omitted). */
const NAV_LINKS: readonly {
    label: string
    to: string
    icon: typeof ClipboardList
    roles?: readonly UserRole[]
}[] = [
    { label: 'Pedidos', to: ADMIN_ROUTES.orders, icon: ClipboardList },
    { label: 'Cotizaciones', to: ADMIN_ROUTES.quotes, icon: ReceiptText },
    { label: 'Tasa BCV', to: ADMIN_ROUTES.exchangeRate, icon: Landmark },
    { label: 'Productos', to: ADMIN_ROUTES.products, icon: Package },
    { label: 'Categorías', to: ADMIN_ROUTES.categories, icon: Tags },
    { label: 'Contenido', to: ADMIN_ROUTES.content, icon: FileText },
    { label: 'Catálogos', to: ADMIN_ROUTES.catalogs, icon: ListChecks, roles: ['ADMIN'] },
    // Before Telegram: chats are linked on behalf of a user, and deactivating one mutes them.
    { label: 'Usuarios', to: ADMIN_ROUTES.users, icon: Users, roles: ['ADMIN'] },
    { label: 'Telegram', to: ADMIN_ROUTES.telegram, icon: Send, roles: ['ADMIN'] },
]

const SIDEBAR_ID = 'admin-sidebar'
/** Rail tooltips start past the sidebar's edge, so a card never covers the other column. */
const RAIL_EDGE = `#${SIDEBAR_ID}`
const SIDEBAR_STORAGE_KEY = 'galpa-admin-sidebar-collapsed'
/** Tailwind's `lg`: the sidebar (and so the collapse) only exists from here up. */
const DESKTOP_QUERY = '(min-width: 64rem)'

/** Every rail control is the same 44px squircle, so hover, focus and active read as tiles. */
const RAIL_SQUARE_CLASS =
    'flex size-11 shrink-0 items-center justify-center rounded-2xl transition duration-200'

const navLinkVariants = cva(
    'flex items-center rounded-xl text-[0.95rem] font-semibold whitespace-nowrap transition duration-200',
    {
        variants: {
            isActive: { true: '', false: 'text-ink' },
            isCollapsed: {
                true: RAIL_SQUARE_CLASS,
                // 44px rows on short windows, so the nine admin links never need a scrollbar.
                false: 'h-12 gap-3 px-4 [@media(max-height:720px)]:h-11',
            },
        },
        compoundVariants: [
            { isCollapsed: false, isActive: true, class: 'bg-brand-600 text-white shadow-glow' },
            { isCollapsed: false, isActive: false, class: 'hover:bg-mist' },
            { isCollapsed: true, isActive: true, class: 'bg-brand-600 text-white shadow-glow' },
            { isCollapsed: true, isActive: false, class: 'hover:bg-mist' },
        ],
        defaultVariants: { isActive: false, isCollapsed: false },
    },
)

/**
 * Hover and keyboard focus of the controls in the tinted top and bottom zones: a deeper grey
 * of the zone itself, never a white tile.
 */
const ZONE_HOVER_CLASS = 'hover:bg-line focus-visible:bg-line'

/** Icon-only buttons in the rail's tinted top and bottom zones. */
const RAIL_BUTTON_CLASS = cn(RAIL_SQUARE_CLASS, 'text-ink', ZONE_HOVER_CLASS)

/**
 * The sidebar's header and user zones: a touch greyer than the menu between them, so the
 * brand and the session never read as menu items.
 */
const SIDEBAR_ZONE_CLASS = 'shrink-0 border-line bg-mist/70'

/** The account link is a `group` for its avatar, and hands its focus ring to the circle. */
const ACCOUNT_LINK_CLASS = 'group outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

/** Read synchronously for the first render, so a reload never flashes the other width. */
function readCollapsed(): boolean {
    try {
        return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

function useSidebarCollapsed() {
    const [isCollapsed, setIsCollapsed] = useState(readCollapsed)

    useEffect(() => {
        try {
            window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isCollapsed ? '1' : '0')
        } catch {
            // Storage disabled or full: the choice just lasts for this visit.
        }
    }, [isCollapsed])

    // Ctrl+B / ⌘B, only while the desktop sidebar is on screen.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
            if (event.key.toLowerCase() !== 'b' || event.repeat) return
            if (!window.matchMedia(DESKTOP_QUERY).matches) return
            event.preventDefault()
            setIsCollapsed((value) => !value)
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [])

    return [isCollapsed, setIsCollapsed] as const
}

const SHORTCUT_LABEL =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
        ? '⌘B'
        : 'Ctrl+B'

/** The rail tooltip body: a bold label and an optional quieter second line. */
interface RailTipProps {
    title: ReactNode
    /** Highlighted after the title, e.g. the pending count. */
    accent?: ReactNode
    /** A key combination, drawn as a key cap next to the title. */
    shortcut?: string
    /** Quieter lines under the title. */
    detail?: ReactNode
}

/** The rail tooltip body: a bold label plus optional extras. */
function RailTip({ title, accent, shortcut, detail }: RailTipProps) {
    return (
        <span className="flex flex-col gap-1 whitespace-nowrap">
            <span className="flex items-center gap-1.5">
                <span className="font-semibold">{title}</span>
                {accent ? <span className="font-semibold text-brand-700">· {accent}</span> : null}
                {shortcut ? (
                    <kbd className="rounded-md border border-line bg-page px-1.5 py-0.5 font-sans text-[11px] font-semibold text-ink-soft">
                        {shortcut}
                    </kbd>
                ) : null}
            </span>
            {detail ? (
                <span className="flex flex-col gap-0.5 text-xs text-ink-soft">{detail}</span>
            ) : null}
        </span>
    )
}

function initialOf(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?'
}

function AdminBrand({ compact = false }: { compact?: boolean }) {
    const { general } = useSiteContent()

    return (
        <Link
            to={ADMIN_ROUTES.orders}
            aria-label={`${general.brandName} — panel de administración`}
            className="group inline-flex min-w-0 items-center gap-2.5 rounded-xl"
        >
            <BrandMark className="size-11" />
            {compact ? null : (
                <span className="flex flex-col leading-none whitespace-nowrap">
                    <span className="text-lg font-extrabold tracking-display text-ink">
                        {appConfig.brandShortName}
                    </span>
                    <span className="text-[0.65rem] font-bold tracking-[0.22em] text-brand-700 uppercase">
                        Panel
                    </span>
                </span>
            )}
        </Link>
    )
}

interface SidebarToggleProps {
    isCollapsed: boolean
    onToggle: () => void
}

function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
    const label = isCollapsed ? 'Expandir menú' : 'Contraer menú'
    const Icon = isCollapsed ? PanelLeftOpen : PanelLeftClose

    return (
        // The icon alone never says what it does, so it has a tooltip in both states.
        <RailTooltip
            enabled
            sideEdge={RAIL_EDGE}
            content={<RailTip title={label} shortcut={SHORTCUT_LABEL} />}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-label={label}
                aria-expanded={!isCollapsed}
                aria-controls={SIDEBAR_ID}
                aria-keyshortcuts="Control+B Meta+B"
                className={
                    isCollapsed
                        ? RAIL_BUTTON_CLASS
                        : cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition duration-200 hover:text-ink',
                              ZONE_HOVER_CLASS,
                          )
                }
            >
                <Icon aria-hidden="true" className="size-5" />
            </button>
        </RailTooltip>
    )
}

interface AdminNavProps {
    user: AuthUser
    onNavigate?: () => void
    /** Desktop rail: icons only, with tooltips instead of labels. */
    isCollapsed?: boolean
}

function AdminNav({ user, onNavigate, isCollapsed = false }: AdminNavProps) {
    const { data: summary } = useAdminOrdersSummary()
    const pending = summary?.pendingVerification ?? 0

    const links = NAV_LINKS.filter((link) => !link.roles || link.roles.includes(user.role))

    return (
        <nav aria-label="Administración">
            {/* The rail lays its icons out two by two, row by row (the tab order too). An odd
                last icon ("Ver tienda" for admins) gets a centred row of its own. */}
            <ul
                className={
                    isCollapsed
                        ? 'grid grid-cols-[repeat(2,2.75rem)] justify-center gap-2 [&>li:last-child:nth-child(odd)]:col-span-2 [&>li:last-child:nth-child(odd)]:justify-self-center'
                        : 'space-y-1 [@media(max-height:720px)]:space-y-0.5'
                }
            >
                {links.map(({ label, to, icon: Icon }) => {
                    const count = to === ADMIN_ROUTES.orders ? pending : 0
                    const countText = `${count} por verificar`

                    return (
                        <li key={to}>
                            <RailTooltip
                                enabled={isCollapsed}
                                sideEdge={RAIL_EDGE}
                                content={
                                    <RailTip
                                        title={label}
                                        accent={count > 0 ? countText : undefined}
                                    />
                                }
                            >
                                <NavLink
                                    to={to}
                                    onClick={onNavigate}
                                    aria-label={
                                        isCollapsed
                                            ? count > 0
                                                ? `${label} (${countText})`
                                                : label
                                            : undefined
                                    }
                                    className={({ isActive }) =>
                                        navLinkVariants({ isActive, isCollapsed })
                                    }
                                >
                                    <span className="relative flex shrink-0">
                                        <Icon aria-hidden="true" className="size-5" />
                                        {isCollapsed && count > 0 ? (
                                            <span
                                                aria-hidden="true"
                                                className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] leading-none font-bold text-white tabular-nums ring-2 ring-page"
                                            >
                                                {count > 99 ? '99+' : count}
                                            </span>
                                        ) : null}
                                    </span>
                                    {isCollapsed ? null : (
                                        <>
                                            <span className="flex-1">{label}</span>
                                            {count > 0 ? (
                                                <>
                                                    <span
                                                        aria-hidden="true"
                                                        className="flex min-w-6 items-center justify-center rounded-full bg-brand-800 px-1.5 text-xs font-bold text-white tabular-nums ring-1 ring-white/60"
                                                    >
                                                        {count}
                                                    </span>
                                                    <span className="sr-only">({countText})</span>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                </NavLink>
                            </RailTooltip>
                        </li>
                    )
                })}
                <li>
                    <RailTooltip
                        enabled={isCollapsed}
                        sideEdge={RAIL_EDGE}
                        content={
                            <RailTip title="Ver tienda" detail="Se abre en una pestaña nueva" />
                        }
                    >
                        <a
                            href={ROUTES.home}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={
                                isCollapsed
                                    ? 'Ver tienda (se abre en una pestaña nueva)'
                                    : undefined
                            }
                            className={navLinkVariants({ isCollapsed })}
                        >
                            <ExternalLink aria-hidden="true" className="size-5 shrink-0" />
                            {isCollapsed ? null : (
                                <>
                                    Ver tienda
                                    <span className="sr-only">(se abre en una pestaña nueva)</span>
                                </>
                            )}
                        </a>
                    </RailTooltip>
                </li>
            </ul>
        </nav>
    )
}

interface AdminUserBlockProps {
    user: AuthUser
    onNavigate?: () => void
    /** Desktop rail: the initial and the logout icon, stacked. */
    isCollapsed?: boolean
}

/** Who is signed in, and the way out: one compact row (or a stack in the rail). */
function AdminUserBlock({ user, onNavigate, isCollapsed = false }: AdminUserBlockProps) {
    const navigate = useNavigate()
    const logout = useLogout()
    const roleLabel = ROLE_LABEL[user.role]

    const handleLogout = async () => {
        // The session is cleared locally even if the request fails (see `useLogout`).
        await logout.mutateAsync().catch(() => undefined)
        onNavigate?.()
        await navigate(ADMIN_ROUTES.login, { replace: true })
    }

    const userTip = (
        <RailTip
            title={user.name}
            detail={
                <>
                    <span className="text-[0.65rem] font-bold tracking-[0.18em] text-brand-700 uppercase">
                        {roleLabel}
                    </span>
                    <span>{user.email}</span>
                    <span className="font-semibold text-brand-700">
                        Mi cuenta: datos, contraseña y permisos
                    </span>
                </>
            }
        />
    )
    const accountLabel = `Mi cuenta: ${user.name}, ${roleLabel}, ${user.email}`

    /*
     * The circle itself reacts, never a tile behind it: a blue ring and a slight lift on hover,
     * and the keyboard focus ring drawn around the circle. The link that holds it is a group
     * and drops its own ring.
     */
    const avatar = (isActive: boolean) => (
        <span
            aria-hidden="true"
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 transition duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-brand-300 group-focus-visible:ring-2 group-focus-visible:ring-brand-500 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-brand-50 motion-reduce:transform-none',
                isActive
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-brand-100 text-brand-800 ring-brand-200',
            )}
        >
            {initialOf(user.name)}
        </span>
    )

    const logoutButton = (className: string) => (
        <RailTooltip
            enabled
            placement={isCollapsed ? 'side' : 'top'}
            sideEdge={RAIL_EDGE}
            content={<RailTip title="Cerrar sesión" />}
        >
            <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={logout.isPending}
                aria-busy={logout.isPending || undefined}
                aria-label="Cerrar sesión"
                className={cn(
                    'text-ink-soft hover:text-brand-700 disabled:pointer-events-none disabled:opacity-60',
                    className,
                )}
            >
                {logout.isPending ? (
                    <Spinner size="sm" label="Cerrando sesión" />
                ) : (
                    <LogOut aria-hidden="true" className="size-5" />
                )}
            </button>
        </RailTooltip>
    )

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center gap-2">
                <RailTooltip enabled sideEdge={RAIL_EDGE} content={userTip}>
                    {/* The circle keeps the rail's 44px hit area, without a tile of its own. */}
                    <NavLink
                        to={ADMIN_ROUTES.account}
                        onClick={onNavigate}
                        aria-label={accountLabel}
                        className={cn(RAIL_SQUARE_CLASS, ACCOUNT_LINK_CLASS)}
                    >
                        {({ isActive }) => avatar(isActive)}
                    </NavLink>
                </RailTooltip>
                {logoutButton(RAIL_BUTTON_CLASS)}
            </div>
        )
    }

    // A white card on the grey zone, so the row reads as one block.
    return (
        <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1.5 pl-2">
            {/* The row is narrow: the role, and the email when it truncates, live in a tooltip. */}
            <RailTooltip enabled placement="top" content={userTip} className="flex min-w-0 flex-1">
                {/* The name/avatar area opens "Mi cuenta"; logout stays a separate button. Like
                    the rail, hovering it lights the circle (and the name), not a tile. */}
                <NavLink
                    to={ADMIN_ROUTES.account}
                    onClick={onNavigate}
                    aria-label={accountLabel}
                    className={({ isActive }) =>
                        cn(
                            ACCOUNT_LINK_CLASS,
                            'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-0.5 pr-1.5 transition duration-200',
                            isActive && 'bg-mist',
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            {avatar(isActive)}
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate text-sm leading-5 font-semibold text-ink transition-colors duration-200 group-hover:text-brand-700">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs leading-4 text-ink-soft">
                                    {user.email}
                                </span>
                            </span>
                        </>
                    )}
                </NavLink>
            </RailTooltip>
            {logoutButton(
                cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl transition duration-200',
                    ZONE_HOVER_CLASS,
                ),
            )}
        </div>
    )
}

/**
 * Back-office shell: a fixed sidebar on desktop and a top bar plus drawer on smaller
 * screens. None of the storefront chrome (header, footer, cart) is rendered here.
 */
export function AdminLayout() {
    const { data: user } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useSidebarCollapsed()
    const { data: summary } = useAdminOrdersSummary()
    const pending = summary?.pendingVerification ?? 0

    // `RequireAdmin` only renders this layout with a session; this narrows the type.
    if (!user) return null

    const closeMenu = () => setIsMenuOpen(false)

    return (
        <div className="min-h-screen overflow-x-clip bg-page">
            <ScrollToTop />

            <aside
                id={SIDEBAR_ID}
                className={cn(
                    'fixed inset-y-0 left-0 hidden flex-col overflow-hidden border-r border-line bg-white transition-[width] duration-300 ease-out motion-reduce:transition-none lg:flex',
                    // Collapsed, the rail holds two 44px columns of icons.
                    isCollapsed ? 'w-32' : 'w-72',
                )}
            >
                <div
                    className={cn(
                        SIDEBAR_ZONE_CLASS,
                        'flex border-b py-4 [@media(max-height:720px)]:py-3',
                        isCollapsed
                            ? 'flex-col items-center gap-2 px-3'
                            : 'items-center justify-between gap-2 px-5',
                    )}
                >
                    <AdminBrand compact={isCollapsed} />
                    <SidebarToggle
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed((value) => !value)}
                    />
                </div>
                {/* Scrolls only as a last resort, on very short windows. The padding keeps
                    focus outlines clear of the scroll box's clipping edge. */}
                <div
                    data-sidebar-scroll=""
                    className={cn(
                        'min-h-0 flex-1 overflow-x-hidden overflow-y-auto',
                        isCollapsed ? 'px-3 py-4' : 'px-5 py-5 [@media(max-height:720px)]:py-3',
                    )}
                >
                    <AdminNav user={user} isCollapsed={isCollapsed} />
                </div>
                <div
                    className={cn(
                        SIDEBAR_ZONE_CLASS,
                        'border-t py-4 [@media(max-height:720px)]:py-3',
                        isCollapsed ? 'px-3' : 'px-5',
                    )}
                >
                    <AdminUserBlock user={user} isCollapsed={isCollapsed} />
                </div>
            </aside>

            <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-line bg-page/90 px-4 py-3 backdrop-blur lg:hidden">
                <AdminBrand />
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    aria-label={
                        pending > 0
                            ? `Abrir menú de administración (${pending} pedidos por verificar)`
                            : 'Abrir menú de administración'
                    }
                    aria-expanded={isMenuOpen}
                    className="relative flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-mist focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                    <Menu aria-hidden="true" className="size-6" />
                    {pending > 0 ? (
                        <span
                            aria-hidden="true"
                            className="absolute top-0.5 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px] font-bold text-white tabular-nums"
                        >
                            {pending}
                        </span>
                    ) : null}
                </button>
            </header>

            <Drawer isOpen={isMenuOpen} onClose={closeMenu} title="Administración" side="left">
                <div className="flex min-h-full flex-col gap-6">
                    <AdminNav user={user} onNavigate={closeMenu} />
                    <div className="mt-auto">
                        <AdminUserBlock user={user} onNavigate={closeMenu} />
                    </div>
                </div>
            </Drawer>

            <main
                className={cn(
                    'transition-[padding] duration-300 ease-out motion-reduce:transition-none',
                    isCollapsed ? 'lg:pl-32' : 'lg:pl-72',
                )}
            >
                {/* The rail frees room, so collapsed pages may also grow wider on large screens. */}
                <div
                    className={cn(
                        'mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10',
                        isCollapsed && 'lg:max-w-7xl',
                    )}
                >
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
