import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FileText } from 'lucide-react'
import { useBlocker, useSearchParams } from 'react-router'

import type { AdminContent } from '@/@types/admin'
import { CONTENT_SECTIONS, isContentSection, type ContentSection } from '@/@types/content'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button, Select, Skeleton, type SelectOption } from '@/components/ui'
import { ADMIN_ROUTES } from '@/constants/route.constant'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { AboutSection } from '@/views/admin/content/sections/AboutSection'
import { ContactPageSection } from '@/views/admin/content/sections/ContactPageSection'
import { ContactSection } from '@/views/admin/content/sections/ContactSection'
import { GeneralSection } from '@/views/admin/content/sections/GeneralSection'
import { HomeSection } from '@/views/admin/content/sections/HomeSection'
import { PaymentSection } from '@/views/admin/content/sections/PaymentSection'
import { SECTION_META } from '@/views/admin/content/sections/sectionMeta'
import { ShippingSection } from '@/views/admin/content/sections/ShippingSection'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminContent } from '@/views/admin/hooks/useAdminContent'

/** `?seccion=` keeps the open section across reloads and shared links. */
const SECTION_PARAM = 'seccion'

const SECTION_OPTIONS: SelectOption[] = CONTENT_SECTIONS.map((section) => ({
    value: section,
    label: SECTION_META[section].label,
}))

const tabClass =
    'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

type DirtyChange = (section: ContentSection, isDirty: boolean) => void

function SectionPanel({
    section,
    content,
    onDirtyChange,
}: {
    section: ContentSection
    content: AdminContent
    onDirtyChange: DirtyChange
}) {
    switch (section) {
        case 'general':
            return <GeneralSection saved={content.general} onDirtyChange={onDirtyChange} />
        case 'home':
            return <HomeSection saved={content.home} onDirtyChange={onDirtyChange} />
        case 'about':
            return <AboutSection saved={content.about} onDirtyChange={onDirtyChange} />
        case 'contact':
            return <ContactSection saved={content.contact} onDirtyChange={onDirtyChange} />
        case 'contactPage':
            return <ContactPageSection saved={content.contactPage} onDirtyChange={onDirtyChange} />
        case 'shipping':
            return <ShippingSection saved={content.shipping} onDirtyChange={onDirtyChange} />
        case 'payment':
            return <PaymentSection saved={content.payment} onDirtyChange={onDirtyChange} />
    }
}

/**
 * Site content editor: one tab per section, each its own form with its own Save. Visited
 * sections stay mounted while you switch tabs, so unsaved edits survive; leaving the page
 * (or closing the tab) with unsaved edits asks first.
 */
export function AdminContentView() {
    const content = useAdminContent()
    const [searchParams, setSearchParams] = useSearchParams()
    const requested = searchParams.get(SECTION_PARAM) ?? ''
    const active: ContentSection = isContentSection(requested) ? requested : 'general'
    const [visited, setVisited] = useState<ReadonlySet<ContentSection>>(() => new Set([active]))
    const [dirty, setDirty] = useState<Partial<Record<ContentSection, boolean>>>({})
    const tabRefs = useRef(new Map<ContentSection, HTMLButtonElement>())
    const hasUnsavedChanges = Object.values(dirty).some(Boolean)

    const onDirtyChange = useCallback<DirtyChange>((section, isDirty) => {
        setDirty((current) =>
            current[section] === isDirty ? current : { ...current, [section]: isDirty },
        )
    }, [])

    const selectSection = (section: ContentSection) => {
        setVisited((current) => (current.has(section) ? current : new Set([...current, section])))
        setSearchParams(
            (params) => {
                params.set(SECTION_PARAM, section)
                return params
            },
            { replace: true },
        )
    }

    // Switching sections is in-page (only `?seccion` changes); leaving the page is not. Going
    // to the login page means the session is gone, so there is nothing left to protect.
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasUnsavedChanges &&
            currentLocation.pathname !== nextLocation.pathname &&
            nextLocation.pathname !== ADMIN_ROUTES.login,
    )

    useEffect(() => {
        if (!hasUnsavedChanges) return
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            // Older browsers only show the prompt when a value is set.
            event.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [hasUnsavedChanges])

    const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
        let next: number | undefined
        if (event.key in offsets) {
            next =
                (index + (offsets[event.key] ?? 0) + CONTENT_SECTIONS.length) %
                CONTENT_SECTIONS.length
        } else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = CONTENT_SECTIONS.length - 1
        if (next === undefined) return
        event.preventDefault()
        const section = CONTENT_SECTIONS[next]
        if (!section) return
        selectSection(section)
        tabRefs.current.get(section)?.focus()
    }

    const unsavedLabels = CONTENT_SECTIONS.filter((section) => dirty[section]).map(
        (section) => `«${SECTION_META[section].label}»`,
    )

    return (
        <>
            <AdminPageHeader
                title="Contenido"
                description="Los textos y datos del negocio que se ven en la tienda. Cada sección se guarda por separado y se publica al instante."
            />

            {content.isPending ? (
                <div className="space-y-6">
                    <Skeleton shape="block" className="h-12" />
                    <Skeleton shape="block" className="h-96" />
                </div>
            ) : content.isError ? (
                <EmptyState
                    title="No pudimos cargar el contenido"
                    description={getErrorMessage(content.error)}
                    icon={<FileText className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void content.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-6">
                    <div className="md:hidden">
                        <Select
                            label="Sección"
                            options={SECTION_OPTIONS.map((option) => ({
                                ...option,
                                label: dirty[option.value as ContentSection]
                                    ? `${option.label} (sin guardar)`
                                    : option.label,
                            }))}
                            value={active}
                            onChange={(event) => {
                                if (isContentSection(event.target.value)) {
                                    selectSection(event.target.value)
                                }
                            }}
                        />
                    </div>

                    <div
                        role="tablist"
                        aria-label="Secciones del contenido"
                        className="hidden flex-wrap gap-1 rounded-2xl border border-line bg-white p-2 shadow-soft md:flex"
                    >
                        {CONTENT_SECTIONS.map((section, index) => {
                            const isActive = section === active
                            return (
                                <button
                                    key={section}
                                    ref={(node) => {
                                        if (node) tabRefs.current.set(section, node)
                                        else tabRefs.current.delete(section)
                                    }}
                                    type="button"
                                    role="tab"
                                    id={`content-tab-${section}`}
                                    aria-selected={isActive}
                                    aria-controls={`content-panel-${section}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => selectSection(section)}
                                    onKeyDown={(event) => onTabKeyDown(event, index)}
                                    className={cn(
                                        tabClass,
                                        isActive
                                            ? 'bg-brand-100 text-brand-700'
                                            : 'text-ink-soft hover:bg-brand-50 hover:text-ink',
                                    )}
                                >
                                    {SECTION_META[section].label}
                                    {dirty[section] ? (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className="size-2 rounded-full bg-warning-400"
                                            />
                                            <span className="sr-only">(cambios sin guardar)</span>
                                        </>
                                    ) : null}
                                </button>
                            )
                        })}
                    </div>

                    {CONTENT_SECTIONS.filter(
                        (section) => visited.has(section) || section === active,
                    ).map((section) => (
                        <div
                            key={section}
                            id={`content-panel-${section}`}
                            role="tabpanel"
                            aria-labelledby={`content-tab-${section}`}
                            hidden={section !== active}
                        >
                            <SectionPanel
                                section={section}
                                content={content.data}
                                onDirtyChange={onDirtyChange}
                            />
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={blocker.state === 'blocked'}
                title="¿Salir sin guardar?"
                description={
                    <>
                        Tienes cambios sin guardar en {unsavedLabels.join(', ')}. Si sales ahora, se
                        pierden.
                    </>
                }
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                onConfirm={() => blocker.proceed?.()}
                onClose={() => blocker.reset?.()}
            />
        </>
    )
}
