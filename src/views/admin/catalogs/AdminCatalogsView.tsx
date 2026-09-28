import { useEffect, type KeyboardEvent } from 'react'
import { Landmark, ListChecks, Lock, Smartphone } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/utils/cn'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { BanksSection } from '@/views/admin/catalogs/components/BanksSection'
import { MobilePrefixesSection } from '@/views/admin/catalogs/components/MobilePrefixesSection'
import { OrderStatusesSection } from '@/views/admin/catalogs/components/OrderStatusesSection'
import { useSession } from '@/views/admin/hooks/useSession'

const SECTIONS = [
    { id: 'estados', label: 'Estados de pedido', icon: ListChecks },
    { id: 'bancos', label: 'Bancos', icon: Landmark },
    { id: 'celulares', label: 'Códigos de celular', icon: Smartphone },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function isSectionId(value: string | null): value is SectionId {
    return SECTIONS.some((section) => section.id === value)
}

const TAB_PREFIX = 'catalog-section'

/**
 * "Catálogos" (ADMIN only): the lists the business names and orders itself, kept in the
 * database. `?seccion=estados|bancos|celulares` picks the section, so a reload keeps it.
 */
export function AdminCatalogsView() {
    const { data: session } = useSession()
    const [searchParams, setSearchParams] = useSearchParams()
    const raw = searchParams.get('seccion')
    const active: SectionId = isSectionId(raw) ? raw : 'estados'

    // On narrow screens the tabs scroll sideways: keep the open one in view (e.g. after a reload).
    useEffect(() => {
        document
            .getElementById(`${TAB_PREFIX}-${active}`)
            ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }, [active])

    const select = (id: SectionId) =>
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current)
                next.set('seccion', id)
                return next
            },
            { replace: true },
        )

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
        event.preventDefault()
        const index = SECTIONS.findIndex((section) => section.id === active)
        const next =
            SECTIONS[
                (index + (event.key === 'ArrowRight' ? 1 : -1) + SECTIONS.length) % SECTIONS.length
            ]
        if (!next) return
        select(next.id)
        document.getElementById(`${TAB_PREFIX}-${next.id}`)?.focus()
    }

    if (session && session.role !== 'ADMIN') {
        return (
            <>
                <AdminPageHeader title="Catálogos" />
                <EmptyState
                    title="Solo un administrador puede editar los catálogos"
                    description="Pide a un administrador que cambie los estados de pedido, los bancos o los códigos de celular."
                    icon={<Lock className="size-6" />}
                />
            </>
        )
    }

    return (
        <>
            <AdminPageHeader
                title="Catálogos"
                description="Nombres y textos que se ven en la tienda y en el panel: los estados de los pedidos, los bancos de Pago Móvil y los códigos de celular."
            />

            <div
                role="tablist"
                aria-label="Catálogos"
                onKeyDown={onKeyDown}
                className="mb-8 flex w-max max-w-full gap-1 overflow-x-auto rounded-full border-2 border-line bg-white p-1"
            >
                {SECTIONS.map(({ id, label, icon: Icon }) => {
                    const isActive = id === active
                    return (
                        <button
                            key={id}
                            id={`${TAB_PREFIX}-${id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`${TAB_PREFIX}-panel`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => select(id)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition',
                                isActive
                                    ? 'bg-blush-100 text-blush-800'
                                    : 'text-ink-soft hover:bg-blush-50 hover:text-ink',
                            )}
                        >
                            <Icon aria-hidden="true" className="size-4" />
                            {label}
                        </button>
                    )
                })}
            </div>

            <div
                id={`${TAB_PREFIX}-panel`}
                role="tabpanel"
                aria-labelledby={`${TAB_PREFIX}-${active}`}
            >
                {active === 'estados' ? (
                    <OrderStatusesSection />
                ) : active === 'bancos' ? (
                    <BanksSection />
                ) : (
                    <MobilePrefixesSection />
                )}
            </div>
        </>
    )
}
