import { useEffect, type KeyboardEvent } from 'react'
import {
    Landmark,
    ListChecks,
    Lock,
    MessageSquareText,
    ReceiptText,
    Smartphone,
    Wallet,
} from 'lucide-react'
import { useSearchParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/utils/cn'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { BanksSection } from '@/views/admin/catalogs/components/BanksSection'
import { ContactOptionsSection } from '@/views/admin/catalogs/components/ContactOptionsSection'
import { MobilePrefixesSection } from '@/views/admin/catalogs/components/MobilePrefixesSection'
import { OrderStatusesSection } from '@/views/admin/catalogs/components/OrderStatusesSection'
import { PaymentMethodsSection } from '@/views/admin/catalogs/components/PaymentMethodsSection'
import { QuoteStatusesSection } from '@/views/admin/catalogs/components/QuoteStatusesSection'
import { useSession } from '@/views/admin/hooks/useSession'

const SECTIONS = [
    { id: 'estados', label: 'Estados de pedido', shortLabel: 'Pedidos', icon: ListChecks },
    {
        id: 'cotizaciones',
        label: 'Estados de cotización',
        shortLabel: 'Cotizaciones',
        icon: ReceiptText,
    },
    { id: 'pagos', label: 'Métodos de pago', shortLabel: 'Pagos', icon: Wallet },
    { id: 'bancos', label: 'Bancos', shortLabel: 'Bancos', icon: Landmark },
    { id: 'celulares', label: 'Códigos de celular', shortLabel: 'Celulares', icon: Smartphone },
    { id: 'asesoria', label: 'Asesoría', shortLabel: 'Asesoría', icon: MessageSquareText },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function isSectionId(value: string | null): value is SectionId {
    return SECTIONS.some((section) => section.id === value)
}

const TAB_PREFIX = 'catalog-section'

/**
 * "Catálogos" (ADMIN only): the lists the business names and orders itself, kept in the
 * database. `?seccion=estados|cotizaciones|pagos|bancos|celulares|asesoria` picks the section,
 * so a reload keeps it.
 */
export function AdminCatalogsView() {
    const { data: session } = useSession()
    const [searchParams, setSearchParams] = useSearchParams()
    const raw = searchParams.get('seccion')
    const active: SectionId = isSectionId(raw) ? raw : 'estados'

    // Keeps the chosen tab in view on the phone row, which scrolls sideways.
    useEffect(() => {
        document
            .getElementById(`${TAB_PREFIX}-${active}`)
            ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
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
                    description="Pide a un administrador que cambie los estados de pedido o de cotización, los métodos de pago, los bancos, los códigos de celular o las opciones de asesoría."
                    icon={<Lock className="size-6" />}
                />
            </>
        )
    }

    return (
        <>
            <AdminPageHeader
                title="Catálogos"
                description="Nombres y textos que se ven en la tienda y en el panel: los estados de los pedidos y de las cotizaciones, los métodos de pago, los bancos, los códigos de celular y las opciones del formulario de asesoría."
            />

            <div
                role="tablist"
                aria-label="Catálogos"
                onKeyDown={onKeyDown}
                // Phones: a row that scrolls sideways (icon over a short name); wider screens show
                // the full names, wrapping onto a second row if they must.
                className="-mx-4 mb-8 flex snap-x scroll-px-4 [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-max sm:max-w-full sm:flex-wrap sm:gap-1 sm:overflow-visible sm:rounded-full sm:border sm:border-line sm:bg-white sm:p-1"
            >
                {SECTIONS.map(({ id, label, shortLabel, icon: Icon }) => {
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
                                'flex min-w-19 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-white px-3 py-2 text-xs font-semibold whitespace-nowrap transition',
                                'sm:min-w-0 sm:border-0 sm:bg-transparent',
                                'sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm',
                                isActive
                                    ? 'bg-brand-100 text-brand-800'
                                    : 'text-ink-soft hover:bg-brand-50 hover:text-ink',
                            )}
                        >
                            <Icon aria-hidden="true" className="size-4" />
                            <span className="sm:hidden">{shortLabel}</span>
                            <span className="hidden sm:inline">{label}</span>
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
                ) : active === 'cotizaciones' ? (
                    <QuoteStatusesSection />
                ) : active === 'pagos' ? (
                    <PaymentMethodsSection />
                ) : active === 'bancos' ? (
                    <BanksSection />
                ) : active === 'celulares' ? (
                    <MobilePrefixesSection />
                ) : (
                    <ContactOptionsSection />
                )}
            </div>
        </>
    )
}
