import type { ReactNode } from 'react'
import { RotateCcw, Save, Undo2 } from 'lucide-react'
import type { FieldValues } from 'react-hook-form'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Alert, Badge, Button, Card } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { cn } from '@/utils/cn'
import type { SectionFormState } from '@/views/admin/content/hooks/useSectionForm'
import { SECTION_META } from '@/views/admin/content/sections/sectionMeta'

const dateFormatter = new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium', timeStyle: 'short' })

function lastEdit(saved: SectionFormState<FieldValues>['saved']): string {
    if (saved.isDefault || !saved.updatedAt)
        return 'Sin cambios guardados: la tienda usa los valores originales.'
    const when = dateFormatter.format(new Date(saved.updatedAt))
    return saved.updatedBy
        ? `Última edición: ${when}, por ${saved.updatedBy.name}.`
        : `Última edición: ${when}.`
}

export interface SectionFormLayoutProps<F extends FieldValues> {
    state: SectionFormState<F>
    children: ReactNode
}

/**
 * Header, field groups and a sticky action bar shared by every section form. Each section
 * saves on its own, so the bar only ever talks about the section on screen.
 */
export function SectionFormLayout<F extends FieldValues>({
    state,
    children,
}: SectionFormLayoutProps<F>) {
    const { label, description } = SECTION_META[state.section]
    const { isDirty } = state.form.formState
    const hasErrors = Object.keys(state.form.formState.errors).length > 0

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                state.submit()
            }}
            noValidate
            className="space-y-6"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold text-ink">{label}</h2>
                        {isDirty ? (
                            <Badge tone="warning" size="sm">
                                Cambios sin guardar
                            </Badge>
                        ) : null}
                    </div>
                    <p className="text-sm text-ink-soft">{description}</p>
                    <p className="text-xs text-ink-soft">{lastEdit(state.saved)}</p>
                </div>
                {state.canRestore && !state.saved.isDefault ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={state.restore.open}
                        leadingIcon={<RotateCcw aria-hidden="true" className="size-4" />}
                        className="shrink-0 self-start"
                    >
                        Restaurar textos originales
                    </Button>
                ) : null}
            </div>

            {children}

            {/* Sticks to the bottom only while there is something to save or read. */}
            <div
                className={cn(
                    (isDirty || state.serverError || state.notice) && 'sticky bottom-3 z-20',
                )}
            >
                <Card
                    padding="sm"
                    elevation="lift"
                    className="space-y-3 bg-white/95 backdrop-blur-sm"
                >
                    {state.serverError ? <Alert>{state.serverError}</Alert> : null}
                    {!state.serverError && hasErrors ? (
                        <Alert>Revisa los campos marcados antes de guardar.</Alert>
                    ) : null}
                    {state.notice ? (
                        <Alert
                            key={state.notice}
                            tone="success"
                            autoDismissMs={NOTICE_DISMISS_MS}
                            onDismiss={state.clearNotice}
                        >
                            {state.notice}
                        </Alert>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                        <p className="hidden text-sm text-ink-soft sm:block" aria-live="polite">
                            {isDirty ? 'Tienes cambios sin guardar.' : 'Todo guardado.'}
                        </p>
                        <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={state.discard}
                                disabled={!isDirty || state.isSaving}
                                leadingIcon={<Undo2 aria-hidden="true" className="size-4" />}
                            >
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!isDirty || state.isSaving}
                                isLoading={state.isSaving}
                                leadingIcon={<Save aria-hidden="true" className="size-4" />}
                            >
                                Guardar cambios
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <ConfirmDialog
                isOpen={state.restore.isOpen}
                title={`¿Restaurar los textos originales de «${label}»?`}
                description="Se borran los cambios guardados de esta sección y la tienda vuelve a mostrar los textos con los que se lanzó. Las demás secciones no cambian. No se puede deshacer."
                confirmLabel="Restaurar textos"
                isLoading={state.restore.isPending}
                error={state.restore.error}
                onConfirm={state.restore.confirm}
                onClose={state.restore.close}
            />
        </form>
    )
}
